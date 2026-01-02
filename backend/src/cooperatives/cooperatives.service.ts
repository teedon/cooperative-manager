import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCooperativeDto } from './dto/create-cooperative.dto';
import { UpdateCooperativeDto } from './dto/update-cooperative.dto';
import { SendInviteDto, SendWhatsAppInviteDto } from './dto/invite.dto';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { 
  PERMISSIONS, 
  hasPermission, 
  parsePermissions, 
  stringifyPermissions,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from '../common/permissions';
import { sendMailWithZoho, generateMemberRoleChangeEmailTemplate, generateCooperativeInviteEmailTemplate } from '../services/mailer';

@Injectable()
export class CooperativesService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
    private notificationsService: NotificationsService,
  ) {}

  // Generate a unique 6-character alphanumeric code
  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Ensure generated code is unique
  private async generateUniqueCode(): Promise<string> {
    let code = this.generateCode();
    let exists = await this.prisma.cooperative.findUnique({ where: { code } });
    while (exists) {
      code = this.generateCode();
      exists = await this.prisma.cooperative.findUnique({ where: { code } });
    }
    return code;
  }

  async findAll(userId?: string) {
    // If userId is provided, only return cooperatives where user is an active member
    if (userId) {
      const memberships = await this.prisma.member.findMany({
        where: { 
          userId, 
          status: 'active' 
        },
        include: {
          cooperative: true,
        },
      });

      // Get the user's contribution totals for each cooperative
      const cooperativesWithUserData = await Promise.all(
        memberships.map(async (membership) => {
          // Calculate user's total contributions for this cooperative
          const userContributions = await this.prisma.contributionPayment.aggregate({
            where: {
              memberId: membership.id,
              status: 'approved',
            },
            _sum: {
              amount: true,
            },
          });

          return {
            ...membership.cooperative,
            memberRole: membership.role,
            userTotalContributions: userContributions._sum.amount || 0,
          };
        })
      );

      return cooperativesWithUserData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Fallback: return all cooperatives (for admin/system use)
    return this.prisma.cooperative.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const coop = await this.prisma.cooperative.findUnique({ where: { id } });
    if (!coop) throw new NotFoundException('Cooperative not found');
    return coop;
  }

  async findByCode(code: string) {
    const coop = await this.prisma.cooperative.findUnique({ where: { code: code.toUpperCase() } });
    if (!coop) throw new NotFoundException('Cooperative not found with this code');
    return coop;
  }

  async create(dto: CreateCooperativeDto, createdBy?: string) {
    //allow each member create only one cooperative but they can join others
    if (createdBy) {
      const existingCoop = await this.prisma.member.findFirst({
        where: { userId: createdBy },
        include: { cooperative: true },
      });
      if (existingCoop) {
        throw new ConflictException('You have already created a cooperative. You can only create one cooperative.');
      }
    }
    const code = await this.generateUniqueCode();
    
    const created = await this.prisma.cooperative.create({
      data: {
        name: dto.name,
        code,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        useGradient: dto.useGradient ?? true,
        gradientPreset: dto.gradientPreset ?? 'ocean',
        status: dto.status ?? 'active',
        createdBy: createdBy ?? null,
        memberCount: createdBy ? 1 : 0,
      },
    });

    // Add the creator as an admin member if createdBy is provided
    if (createdBy) {
      await this.prisma.member.create({
        data: {
          cooperativeId: created.id,
          userId: createdBy,
          role: 'admin',
          joinedAt: new Date(),
          status: 'active',
          virtualBalance: 0,
        },
      });

      // Log activity
      await this.activitiesService.log(
        createdBy,
        'cooperative.create',
        `Created cooperative "${created.name}"`,
        created.id,
        { cooperativeName: created.name, code: created.code },
      );
    }

    return created;
  }

  async update(id: string, dto: UpdateCooperativeDto, userId: string) {
    const coop = await this.findOne(id);
    
    // Check if user is admin or moderator with settings permission
    const member = await this.prisma.member.findFirst({
      where: { cooperativeId: id, userId, status: 'active' },
    });
    
    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }
    
    const isAdmin = member.role === 'admin';
    const isModerator = member.role === 'moderator';
    const permissions = parsePermissions(member.permissions || '');
    const canEdit = isAdmin || (isModerator && hasPermission(member.role, permissions, PERMISSIONS.SETTINGS_EDIT));
    
    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to update this cooperative');
    }
    
    const updated = await this.prisma.cooperative.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.useGradient !== undefined && { useGradient: dto.useGradient }),
        ...(dto.gradientPreset !== undefined && { gradientPreset: dto.gradientPreset }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
    
    // Log activity
    await this.activitiesService.log(
      userId,
      'cooperative.update',
      `Updated cooperative "${coop.name}" settings`,
      id,
      { cooperativeName: coop.name, changes: dto },
    );
    
    return updated;
  }

  async joinByCode(code: string, userId: string) {
    const coop = await this.findByCode(code);

    // Check if user is already a member
    const existingMember = await this.prisma.member.findFirst({
      where: { cooperativeId: coop.id, userId },
    });

    if (existingMember) {
      if (existingMember.status === 'pending') {
        throw new ConflictException('You have already requested to join this cooperative. Please wait for admin approval.');
      }
      throw new ConflictException('You are already a member of this cooperative');
    }

    // Create member with pending status
    const member = await this.prisma.member.create({
      data: {
        cooperativeId: coop.id,
        userId,
        role: 'member',
        joinedAt: new Date(),
        status: 'pending',
        virtualBalance: 0,
      },
    });

    // Log activity
    await this.activitiesService.log(
      userId,
      'cooperative.join_request',
      `Requested to join cooperative "${coop.name}"`,
      coop.id,
      { cooperativeName: coop.name, code: coop.code },
    );

    // Notify cooperative admins about new join request
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const userName = user ? `${user.firstName} ${user.lastName}` : 'A new user';
    await this.notificationsService.notifyCooperativeAdmins(
      coop.id,
      'member_joined',
      'New Membership Request',
      `${userName} has requested to join "${coop.name}". Please review their application.`,
      { memberId: member.id },
    );

    return { cooperative: coop, member };
  }

  async approveMember(memberId: string, adminUserId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: { cooperative: true, user: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Check if the requesting user is an admin of this cooperative
    const adminMember = await this.prisma.member.findFirst({
      where: {
        cooperativeId: member.cooperativeId,
        userId: adminUserId,
        role: 'admin',
        status: 'active',
      },
    });

    if (!adminMember) {
      throw new BadRequestException('You are not authorized to approve members for this cooperative');
    }

    if (member.status !== 'pending') {
      throw new BadRequestException('This member is not pending approval');
    }

    // Update member status to active and increment member count
    const [updatedMember] = await this.prisma.$transaction([
      this.prisma.member.update({
        where: { id: memberId },
        data: { status: 'active' },
      }),
      this.prisma.cooperative.update({
        where: { id: member.cooperativeId },
        data: { memberCount: { increment: 1 } },
      }),
    ]);

    // Log activity for admin
    await this.activitiesService.log(
      adminUserId,
      'member.approve',
      `Approved ${member.user?.firstName ?? 'Unknown'} ${member.user?.lastName ?? 'Member'}'s membership`,
      member.cooperativeId,
      { memberName: `${member.user?.firstName ?? 'Unknown'} ${member.user?.lastName ?? 'Member'}`, memberId: member.userId ?? member.id },
    );

    // Log activity for the approved member (only if user exists)
    if (member.userId) {
      await this.activitiesService.log(
        member.userId,
        'member.approved',
        `Your membership to "${member.cooperative.name}" was approved`,
        member.cooperativeId,
        { cooperativeName: member.cooperative.name },
      );

      // Notify the member that they were approved
      await this.notificationsService.createNotification({
        userId: member.userId,
        cooperativeId: member.cooperativeId,
        type: 'member_approved',
        title: 'Membership Approved!',
        body: `Welcome! Your membership to "${member.cooperative.name}" has been approved. You can now participate in the cooperative.`,
        data: { cooperativeId: member.cooperativeId },
      });
    }

    return updatedMember;
  }

  async rejectMember(memberId: string, adminUserId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: { cooperative: true, user: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Check if the requesting user is an admin of this cooperative
    const adminMember = await this.prisma.member.findFirst({
      where: {
        cooperativeId: member.cooperativeId,
        userId: adminUserId,
        role: 'admin',
        status: 'active',
      },
    });

    if (!adminMember) {
      throw new BadRequestException('You are not authorized to reject members for this cooperative');
    }

    if (member.status !== 'pending') {
      throw new BadRequestException('This member is not pending approval');
    }

    // Delete the pending member request
    await this.prisma.member.delete({
      where: { id: memberId },
    });

    // Log activity for admin
    await this.activitiesService.log(
      adminUserId,
      'member.reject',
      `Rejected ${member.user?.firstName ?? 'Unknown'} ${member.user?.lastName ?? 'Member'}'s membership request`,
      member.cooperativeId,
      { memberName: `${member.user?.firstName ?? 'Unknown'} ${member.user?.lastName ?? 'Member'}`, memberId: member.userId ?? member.id },
    );

    // Log activity for the rejected member (only if user exists)
    if (member.userId) {
      await this.activitiesService.log(
        member.userId,
        'member.rejected',
        `Your membership request to "${member.cooperative.name}" was rejected`,
        member.cooperativeId,
        { cooperativeName: member.cooperative.name },
      );

      // Notify the member that they were rejected
      await this.notificationsService.createNotification({
        userId: member.userId,
        cooperativeId: member.cooperativeId,
        type: 'member_rejected',
        title: 'Membership Request Declined',
        body: `Your membership request to "${member.cooperative.name}" was not approved at this time.`,
        data: { cooperativeId: member.cooperativeId },
      });
    }

    return { message: 'Member request rejected', memberId };
  }

  // ==================== INVITATION METHODS ====================

  async sendEmailInvites(cooperativeId: string, dto: SendInviteDto, userId: string) {
    // Verify cooperative exists
    const cooperative = await this.findOne(cooperativeId);
    if (!cooperative) {
      throw new NotFoundException('Cooperative not found');
    }

    // Check if user is admin or moderator
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId,
        status: 'active',
      },
      include: { user: true },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const permissions = parsePermissions(member.permissions);
    if (!hasPermission(member.role, permissions, PERMISSIONS.MEMBERS_INVITE)) {
      throw new ForbiddenException('You do not have permission to invite members');
    }

    const inviterName = member.user ? `${member.user.firstName} ${member.user.lastName}` : 'A cooperative admin';
    const appUrl = process.env.FRONTEND_URL || 'https://coopmanager.app';
    const deepLink = `coopmanager://join?code=${cooperative.code}`;
    const webLink = `${appUrl}/join?code=${cooperative.code}`;
    
    const results = [];
    
    for (const email of dto.emails) {
      try {
        const htmlContent = generateCooperativeInviteEmailTemplate(
          email,
          inviterName,
          cooperative.name,
          cooperative.code,
        );

        // Enhance the email template with deep link
        const enhancedHtmlContent = htmlContent.replace(
          '<a href="#" class="button">Join Cooperative</a>',
          `<a href="${deepLink}" class="button" style="margin-right: 10px;">Open in App</a>
           <a href="${webLink}" class="button" style="background: #6366f1;">Join via Web</a>`
        );

        const emailSent = await sendMailWithZoho({
          recipient: email,
          subject: `You're invited to join ${cooperative.name}`,
          htmlContent: enhancedHtmlContent,
        });

        // Persist invitation record so the invite can be claimed when the user signs up
        try {
          await this.prisma.invitation.create({
            data: {
              cooperativeId: cooperative.id,
              inviterId: userId,
              email: email,
              message: dto.message ?? null,
              code: cooperative.code,
              status: emailSent ? 'pending' : 'pending',
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiration
            },
          });
        } catch (err) {
          // non-fatal - we still return email results even if persistence fails
          console.error('Failed to persist invitation for', email, err);
        }

        results.push({
          email,
          sent: emailSent,
          message: emailSent ? 'Invitation sent successfully' : 'Failed to send invitation',
        });
      } catch (error) {
        results.push({
          email,
          sent: false,
          message: 'Failed to send invitation',
        });
      }
    }

    // Log activity
    await this.activitiesService.log(
      userId,
      'members.invite_sent',
      `Sent ${dto.emails.length} email invitation(s) to join "${cooperative.name}"`,
      cooperativeId,
      { emails: dto.emails, cooperativeName: cooperative.name },
    );

    return {
      cooperativeCode: cooperative.code,
      cooperativeName: cooperative.name,
      deepLink,
      webLink,
      results,
    };
  }

  async generateWhatsAppInviteLinks(cooperativeId: string, dto: SendWhatsAppInviteDto, userId: string) {
    // Verify cooperative exists
    const cooperative = await this.findOne(cooperativeId);
    if (!cooperative) {
      throw new NotFoundException('Cooperative not found');
    }

    // Check if user is admin or moderator
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId,
        status: 'active',
      },
      include: { user: true },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const permissions = parsePermissions(member.permissions);
    if (!hasPermission(member.role, permissions, PERMISSIONS.MEMBERS_INVITE)) {
      throw new ForbiddenException('You do not have permission to invite members');
    }

    const inviterName = member.user ? `${member.user.firstName} ${member.user.lastName}` : 'A cooperative admin';
    const appUrl = process.env.FRONTEND_URL || 'https://coopmanager.app';
    const deepLink = `coopmanager://join?code=${cooperative.code}`;
    const webLink = `${appUrl}/join?code=${cooperative.code}`;

    const customMessage = dto.message || 
      `Hello! ${inviterName} has invited you to join *${cooperative.name}* on CoopManager.`;

    const whatsappMessage = `${customMessage}

*Cooperative Code:* ${cooperative.code}

Open the CoopManager app and use this code to join, or click the link below:
${deepLink}

Don't have the app? Join via web:
${webLink}`;

    const whatsappLinks = dto.phoneNumbers.map((phone) => {
      // Remove all non-numeric characters from phone
      const cleanPhone = phone.replace(/\D/g, '');
      const encodedMessage = encodeURIComponent(whatsappMessage);
      
      return {
        phone: cleanPhone,
        originalPhone: phone,
        whatsappUrl: `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
      };
    });

    // Log activity
    await this.activitiesService.log(
      userId,
      'members.whatsapp_invite_generated',
      `Generated ${dto.phoneNumbers.length} WhatsApp invitation link(s) for "${cooperative.name}"`,
      cooperativeId,
      { phoneCount: dto.phoneNumbers.length, cooperativeName: cooperative.name },
    );

    return {
      cooperativeCode: cooperative.code,
      cooperativeName: cooperative.name,
      deepLink,
      webLink,
      whatsappMessage,
      whatsappLinks,
    };
  }

  async getInvitations(cooperativeId: string, userId: string) {
    // Verify cooperative exists
    const cooperative = await this.findOne(cooperativeId);
    if (!cooperative) {
      throw new NotFoundException('Cooperative not found');
    }

    // Check if user is admin or moderator
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId,
        status: 'active',
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const permissions = parsePermissions(member.permissions);
    if (!hasPermission(member.role, permissions, PERMISSIONS.MEMBERS_INVITE)) {
      throw new ForbiddenException('You do not have permission to view invitations');
    }

    // Fetch invitations for this cooperative
    const invitations = await this.prisma.invitation.findMany({
      where: { cooperativeId },
      include: {
        inviter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations;
  }

  async revokeInvitation(invitationId: string, userId: string) {
    // Find the invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { cooperative: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if user has permission to revoke
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId: invitation.cooperativeId,
        userId,
        status: 'active',
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const permissions = parsePermissions(member.permissions);
    if (!hasPermission(member.role, permissions, PERMISSIONS.MEMBERS_INVITE)) {
      throw new ForbiddenException('You do not have permission to revoke invitations');
    }

    // Update invitation status to revoked
    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'revoked' },
    });

    // Log activity
    await this.activitiesService.log(
      userId,
      'invitation.revoked',
      `Revoked invitation for ${invitation.email || invitation.phone}`,
      invitation.cooperativeId,
      { invitationId, email: invitation.email, phone: invitation.phone },
    );

    return updated;
  }

  async getPendingMembers(cooperativeId: string, adminUserId: string) {
    // Check if the requesting user is an admin of this cooperative
    const adminMember = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId: adminUserId,
        role: 'admin',
        status: 'active',
      },
    });

    if (!adminMember) {
      throw new BadRequestException('You are not authorized to view pending members for this cooperative');
    }

    return this.prisma.member.findMany({
      where: {
        cooperativeId,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async getMyPendingMemberships(userId: string) {
    const pendingMemberships = await this.prisma.member.findMany({
      where: {
        userId,
        status: 'pending',
      },
      include: {
        cooperative: {
          select: {
            id: true,
            name: true,
            description: true,
            code: true,
            memberCount: true,
            totalContributions: true,
            createdAt: true,
            imageUrl: true,
            status: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return pendingMemberships;
  }

  async cancelPendingRequest(cooperativeId: string, userId: string) {
    const pendingMember = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId,
        status: 'pending',
      },
    });

    if (!pendingMember) {
      throw new NotFoundException('No pending membership request found for this cooperative');
    }

    // Delete the pending membership
    await this.prisma.member.delete({
      where: { id: pendingMember.id },
    });

    // Log activity
    await this.activitiesService.log(
      userId,
      'cooperative.cancel_request',
      `Cancelled membership request to join cooperative`,
      cooperativeId,
      { cooperativeId },
    );

    return { message: 'Membership request cancelled successfully' };
  }

  //implement getMembers
  async getMembers(cooperativeId: string, requestingUserId: string) {
    // Check if the requesting user is a member of this cooperative
    const requestingMember = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId: requestingUserId,
        status: 'active',
      },
    });

    if (!requestingMember) {
      throw new BadRequestException('You are not a member of this cooperative');
    }

    const isAdmin = requestingMember.role === 'admin';

    const members = await this.prisma.member.findMany({
      where: {
        cooperativeId,
        status: 'active',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    // If not admin, hide financial data (virtualBalance) from other members
    if (!isAdmin) {
      return members.map((member) => ({
        ...member,
        // Parse permissions from JSON string to array
        permissions: parsePermissions(member.permissions),
        // Only show virtualBalance for the requesting user's own record
        virtualBalance: member.userId === requestingUserId ? member.virtualBalance : null,
        // Add a flag to indicate if financial data is hidden
        isFinancialDataHidden: member.userId !== requestingUserId,
      }));
    }

    // Admin can see all data
    return members.map((member) => ({
      ...member,
      // Parse permissions from JSON string to array
      permissions: parsePermissions(member.permissions),
      isFinancialDataHidden: false,
    }));
  }

  // ==================== ADMIN MANAGEMENT ====================

  // Get all admins/moderators for a cooperative
  async getAdmins(cooperativeId: string, requestingUserId: string) {
    const requestingMember = await this.prisma.member.findFirst({
      where: { cooperativeId, userId: requestingUserId, status: 'active' },
    });

    if (!requestingMember) {
      throw new BadRequestException('You are not a member of this cooperative');
    }

    // Check permission to view admins
    const permissions = parsePermissions(requestingMember.permissions);
    if (!hasPermission(requestingMember.role, permissions, PERMISSIONS.ADMINS_VIEW)) {
      throw new ForbiddenException('You do not have permission to view admins');
    }

    const admins = await this.prisma.member.findMany({
      where: {
        cooperativeId,
        status: 'active',
        role: { in: ['admin', 'moderator'] },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return admins.map((admin) => ({
      ...admin,
      permissions: parsePermissions(admin.permissions),
    }));
  }

  // Update a member's role (promote to admin/moderator or demote)
  async updateMemberRole(
    cooperativeId: string,
    memberId: string,
    role: string,
    permissions: string[] | undefined,
    requestingUserId: string,
    roleTitle?: string | null,
  ) {
    const requestingMember = await this.prisma.member.findFirst({
      where: { cooperativeId, userId: requestingUserId, status: 'active' },
    });

    if (!requestingMember) {
      throw new BadRequestException('You are not a member of this cooperative');
    }

    // Check permission to edit roles
    const reqPermissions = parsePermissions(requestingMember.permissions);
    if (!hasPermission(requestingMember.role, reqPermissions, PERMISSIONS.MEMBERS_EDIT_ROLE)) {
      throw new ForbiddenException('You do not have permission to edit member roles');
    }

    // For promoting to admin, need admin management permission
    if (role === 'admin' && !hasPermission(requestingMember.role, reqPermissions, PERMISSIONS.ADMINS_ADD)) {
      throw new ForbiddenException('You do not have permission to add admins');
    }

    const targetMember = await this.prisma.member.findFirst({
      where: { id: memberId, cooperativeId },
      include: { user: true },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    // Cannot change own role (safety measure)
    if (targetMember.userId === requestingUserId) {
      throw new BadRequestException('You cannot change your own role');
    }

    // Only full admin can demote another admin
    if (targetMember.role === 'admin' && requestingMember.role !== 'admin') {
      throw new ForbiddenException('Only a full admin can demote another admin');
    }

    // Validate permissions if provided
    let permissionsToSet: string | null = null;
    if (role === 'admin') {
      // Full admin gets all permissions, no need to store
      permissionsToSet = null;
    } else if (role === 'moderator' && permissions) {
      // Validate that all permissions are valid
      const validPermissions = ALL_PERMISSIONS as readonly string[];
      const invalidPerms = permissions.filter((p) => !validPermissions.includes(p));
      if (invalidPerms.length > 0) {
        throw new BadRequestException(`Invalid permissions: ${invalidPerms.join(', ')}`);
      }
      permissionsToSet = stringifyPermissions(permissions);
    } else if (role === 'member') {
      // Regular members don't have custom permissions
      permissionsToSet = null;
    }

    // Determine roleTitle to set
    // If role is 'member', clear the roleTitle
    // If roleTitle is provided, use it; otherwise keep existing
    const roleTitleToSet = role === 'member' ? null : (roleTitle !== undefined ? roleTitle : targetMember.roleTitle);

    const updatedMember = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        role,
        roleTitle: roleTitleToSet,
        permissions: permissionsToSet,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    const memberName = updatedMember.user 
      ? `${updatedMember.user.firstName} ${updatedMember.user.lastName}`
      : `${updatedMember.firstName ?? 'Unknown'} ${updatedMember.lastName ?? 'Member'}`;
    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId,
      action: 'member_role_updated',
      description: `Updated ${memberName}'s role to ${role}`,
    });

    // Send role change email to the member
    if (updatedMember.user?.email) {
      const cooperative = await this.prisma.cooperative.findUnique({
        where: { id: cooperativeId },
        select: { name: true },
      });

      const isPromotion = role === 'admin' || role === 'moderator';
      await sendMailWithZoho({
        recipient: updatedMember.user.email,
        subject: isPromotion ? 'Congratulations on Your Promotion!' : 'Your Role Has Been Updated',
        htmlContent: generateMemberRoleChangeEmailTemplate(
          memberName,
          cooperative?.name || 'the cooperative',
          role.charAt(0).toUpperCase() + role.slice(1),
          isPromotion,
        ),
      });
    }

    return {
      ...updatedMember,
      permissions: parsePermissions(updatedMember.permissions),
    };
  }

  // Update a moderator's permissions
  async updateMemberPermissions(
    cooperativeId: string,
    memberId: string,
    permissions: string[],
    requestingUserId: string,
  ) {
    const requestingMember = await this.prisma.member.findFirst({
      where: { cooperativeId, userId: requestingUserId, status: 'active' },
    });

    if (!requestingMember) {
      throw new BadRequestException('You are not a member of this cooperative');
    }

    // Check permission to edit admin permissions
    const reqPermissions = parsePermissions(requestingMember.permissions);
    if (!hasPermission(requestingMember.role, reqPermissions, PERMISSIONS.ADMINS_EDIT_PERMISSIONS)) {
      throw new ForbiddenException('You do not have permission to edit admin permissions');
    }

    const targetMember = await this.prisma.member.findFirst({
      where: { id: memberId, cooperativeId },
      include: { user: true },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    // Can only edit permissions for moderators
    if (targetMember.role !== 'moderator') {
      throw new BadRequestException('Can only edit permissions for moderators. Admins have full access.');
    }

    // Validate permissions
    const validPermissions = ALL_PERMISSIONS as readonly string[];
    const invalidPerms = permissions.filter((p) => !validPermissions.includes(p));
    if (invalidPerms.length > 0) {
      throw new BadRequestException(`Invalid permissions: ${invalidPerms.join(', ')}`);
    }

    const updatedMember = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        permissions: stringifyPermissions(permissions),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    const memberName = updatedMember.user 
      ? `${updatedMember.user.firstName} ${updatedMember.user.lastName}`
      : `${updatedMember.firstName ?? 'Unknown'} ${updatedMember.lastName ?? 'Member'}`;
    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId,
      action: 'permissions_updated',
      description: `Updated permissions for ${memberName}`,
    });

    return {
      ...updatedMember,
      permissions: parsePermissions(updatedMember.permissions),
    };
  }

  // Remove admin/moderator status (demote to member)
  async removeAdmin(cooperativeId: string, memberId: string, requestingUserId: string) {
    return this.updateMemberRole(cooperativeId, memberId, 'member', undefined, requestingUserId);
  }

  // Get available permissions list
  getAvailablePermissions() {
    return {
      permissions: ALL_PERMISSIONS,
      defaultRolePermissions: DEFAULT_ROLE_PERMISSIONS,
    };
  }

  // Check if a member has a specific permission
  async checkMemberPermission(
    cooperativeId: string,
    userId: string,
    permission: string,
  ): Promise<boolean> {
    const member = await this.prisma.member.findFirst({
      where: { cooperativeId, userId, status: 'active' },
    });

    if (!member) return false;

    const permissions = parsePermissions(member.permissions);
    return hasPermission(member.role, permissions, permission as any);
  }

  // ==================== OFFLINE MEMBER MANAGEMENT ====================

  // Helper to get member display name (works for both online and offline members)
  getMemberDisplayName(member: any): string {
    if (member.isOfflineMember) {
      return `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unnamed Member';
    }
    if (member.user) {
      return `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim();
    }
    return 'Unknown Member';
  }

  // Create an offline member
  async createOfflineMember(
    cooperativeId: string,
    dto: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      memberCode?: string;
      notes?: string;
      initialBalance?: number;
      autoSubscribe?: boolean;
    },
    requestingUserId: string,
  ) {
    // Check permission
    const requestingMember = await this.prisma.member.findFirst({
      where: { cooperativeId, userId: requestingUserId, status: 'active' },
    });

    if (!requestingMember) {
      throw new BadRequestException('You are not a member of this cooperative');
    }

    const permissions = parsePermissions(requestingMember.permissions);
    if (!hasPermission(requestingMember.role, permissions, PERMISSIONS.MEMBERS_APPROVE)) {
      throw new ForbiddenException('You do not have permission to add members');
    }

    // Check for duplicate member code within the cooperative
    if (dto.memberCode) {
      const existingMember = await this.prisma.member.findFirst({
        where: { cooperativeId, memberCode: dto.memberCode },
      });
      if (existingMember) {
        throw new ConflictException(`A member with code "${dto.memberCode}" already exists`);
      }
    }

    // Create the offline member
    const member = await this.prisma.member.create({
      data: {
        cooperativeId,
        isOfflineMember: true,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        memberCode: dto.memberCode,
        notes: dto.notes,
        addedBy: requestingUserId,
        role: 'member',
        status: 'active',
        joinedAt: new Date(),
        virtualBalance: dto.initialBalance || 0,
      },
    });

    // Update cooperative member count
    await this.prisma.cooperative.update({
      where: { id: cooperativeId },
      data: { memberCount: { increment: 1 } },
    });

    // Auto-subscribe to active plans if requested
    if (dto.autoSubscribe) {
      const activePlans = await this.prisma.contributionPlan.findMany({
        where: { cooperativeId, isActive: true },
      });

      for (const plan of activePlans) {
        const amount = plan.fixedAmount || plan.minAmount || 0;
        await this.prisma.contributionSubscription.create({
          data: {
            memberId: member.id,
            planId: plan.id,
            amount,
            status: 'active',
            subscribedAt: new Date(),
          },
        });
      }
    }

    // Log activity
    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId,
      action: 'offline_member_added',
      description: `Added offline member: ${dto.firstName} ${dto.lastName}`,
    });

    return member;
  }

  // Bulk create offline members
  async bulkCreateOfflineMembers(
    cooperativeId: string,
    members: Array<{
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      memberCode?: string;
      notes?: string;
    }>,
    requestingUserId: string,
  ) {
    // Check permission
    const requestingMember = await this.prisma.member.findFirst({
      where: { cooperativeId, userId: requestingUserId, status: 'active' },
    });

    if (!requestingMember) {
      throw new BadRequestException('You are not a member of this cooperative');
    }

    const permissions = parsePermissions(requestingMember.permissions);
    if (!hasPermission(requestingMember.role, permissions, PERMISSIONS.MEMBERS_APPROVE)) {
      throw new ForbiddenException('You do not have permission to add members');
    }

    const results = {
      successful: [] as any[],
      failed: [] as { member: any; error: string }[],
    };

    for (const memberData of members) {
      try {
        // Check for duplicate member code
        if (memberData.memberCode) {
          const existing = await this.prisma.member.findFirst({
            where: { cooperativeId, memberCode: memberData.memberCode },
          });
          if (existing) {
            results.failed.push({
              member: memberData,
              error: `Member code "${memberData.memberCode}" already exists`,
            });
            continue;
          }
        }

        const member = await this.prisma.member.create({
          data: {
            cooperativeId,
            isOfflineMember: true,
            firstName: memberData.firstName,
            lastName: memberData.lastName,
            email: memberData.email,
            phone: memberData.phone,
            memberCode: memberData.memberCode,
            notes: memberData.notes,
            addedBy: requestingUserId,
            role: 'member',
            status: 'active',
            joinedAt: new Date(),
            virtualBalance: 0,
          },
        });
        results.successful.push(member);
      } catch (error: any) {
        results.failed.push({
          member: memberData,
          error: error.message || 'Failed to create member',
        });
      }
    }

    // Update cooperative member count
    if (results.successful.length > 0) {
      await this.prisma.cooperative.update({
        where: { id: cooperativeId },
        data: { memberCount: { increment: results.successful.length } },
      });

      // Log activity
      await this.activitiesService.create({
        userId: requestingUserId,
        cooperativeId,
        action: 'offline_members_bulk_added',
        description: `Added ${results.successful.length} offline members`,
      });
    }

    return {
      totalProcessed: members.length,
      successCount: results.successful.length,
      failedCount: results.failed.length,
      successful: results.successful,
      failed: results.failed,
    };
  }

  // Update offline member
  async updateOfflineMember(
    cooperativeId: string,
    memberId: string,
    dto: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      memberCode?: string;
      notes?: string;
      status?: string;
    },
    requestingUserId: string,
  ) {
    // Check permission
    const requestingMember = await this.prisma.member.findFirst({
      where: { cooperativeId, userId: requestingUserId, status: 'active' },
    });

    if (!requestingMember) {
      throw new BadRequestException('You are not a member of this cooperative');
    }

    const permissions = parsePermissions(requestingMember.permissions);
    if (!hasPermission(requestingMember.role, permissions, PERMISSIONS.MEMBERS_APPROVE)) {
      throw new ForbiddenException('You do not have permission to edit members');
    }

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, cooperativeId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (!member.isOfflineMember) {
      throw new BadRequestException('Cannot edit online member details. They must update their own profile.');
    }

    // Check for duplicate member code if changing
    if (dto.memberCode && dto.memberCode !== member.memberCode) {
      const existing = await this.prisma.member.findFirst({
        where: { cooperativeId, memberCode: dto.memberCode, id: { not: memberId } },
      });
      if (existing) {
        throw new ConflictException(`A member with code "${dto.memberCode}" already exists`);
      }
    }

    const updatedMember = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        memberCode: dto.memberCode,
        notes: dto.notes,
        status: dto.status,
      },
    });

    // Log activity
    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId,
      action: 'offline_member_updated',
      description: `Updated offline member: ${updatedMember.firstName} ${updatedMember.lastName}`,
    });

    return updatedMember;
  }

  // Get offline members for a cooperative
  async getOfflineMembers(cooperativeId: string, requestingUserId: string) {
    // Check membership
    const requestingMember = await this.prisma.member.findFirst({
      where: { cooperativeId, userId: requestingUserId, status: 'active' },
    });

    if (!requestingMember) {
      throw new BadRequestException('You are not a member of this cooperative');
    }

    const permissions = parsePermissions(requestingMember.permissions);
    if (!hasPermission(requestingMember.role, permissions, PERMISSIONS.MEMBERS_VIEW)) {
      throw new ForbiddenException('You do not have permission to view members');
    }

    return this.prisma.member.findMany({
      where: {
        cooperativeId,
        isOfflineMember: true,
      },
      include: {
        contributionSubscriptions: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                frequency: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  // Get a single member details (works for both online and offline)
  async getMemberDetails(cooperativeId: string, memberId: string, requestingUserId: string) {
    // Check membership
    const requestingMember = await this.prisma.member.findFirst({
      where: { cooperativeId, userId: requestingUserId, status: 'active' },
    });

    if (!requestingMember) {
      throw new BadRequestException('You are not a member of this cooperative');
    }

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, cooperativeId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        contributionSubscriptions: {
          include: {
            plan: true,
            schedules: {
              take: 12,
              orderBy: { dueDate: 'desc' },
            },
          },
        },
        contributionPayments: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            subscription: {
              include: {
                plan: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        loans: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Check if requesting user can view financials
    const canViewFinancials = hasPermission(
      requestingMember.role, 
      parsePermissions(requestingMember.permissions), 
      PERMISSIONS.MEMBERS_VIEW_FINANCIALS
    );

    // If not admin and not the member themselves, hide financial data
    if (!canViewFinancials && requestingMember.id !== memberId) {
      return {
        ...member,
        virtualBalance: null,
        contributionPayments: [],
        loans: [],
      };
    }

    return member;
  }

  // Delete/remove an offline member
  async deleteOfflineMember(cooperativeId: string, memberId: string, requestingUserId: string) {
    // Check permission
    const requestingMember = await this.prisma.member.findFirst({
      where: { cooperativeId, userId: requestingUserId, status: 'active' },
    });

    if (!requestingMember) {
      throw new BadRequestException('You are not a member of this cooperative');
    }

    const permissions = parsePermissions(requestingMember.permissions);
    if (!hasPermission(requestingMember.role, permissions, PERMISSIONS.MEMBERS_REMOVE)) {
      throw new ForbiddenException('You do not have permission to remove members');
    }

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, cooperativeId },
      include: {
        contributionSubscriptions: true,
        contributionPayments: true,
        loans: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (!member.isOfflineMember) {
      throw new BadRequestException('Cannot delete online members. Remove their membership instead.');
    }

    // Check if member has any active records
    const hasActiveLoans = member.loans.some(l => l.status === 'active' || l.status === 'pending');
    if (hasActiveLoans) {
      throw new BadRequestException('Cannot delete member with active loans');
    }

    // Soft delete by setting status to removed
    const updatedMember = await this.prisma.member.update({
      where: { id: memberId },
      data: { status: 'removed' },
    });

    // Update cooperative member count
    await this.prisma.cooperative.update({
      where: { id: cooperativeId },
      data: { memberCount: { decrement: 1 } },
    });

    // Log activity
    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId,
      action: 'offline_member_removed',
      description: `Removed offline member: ${member.firstName} ${member.lastName}`,
    });

    return { message: 'Member removed successfully', member: updatedMember };
  }

  // Subscribe an offline member to a contribution plan
  async subscribeOfflineMemberToPlan(
    cooperativeId: string,
    memberId: string,
    planId: string,
    requestingUserId: string,
  ) {
    // Check permission
    const requestingMember = await this.prisma.member.findFirst({
      where: { cooperativeId, userId: requestingUserId, status: 'active' },
    });

    if (!requestingMember) {
      throw new BadRequestException('You are not a member of this cooperative');
    }

    const permissions = parsePermissions(requestingMember.permissions);
    if (!hasPermission(requestingMember.role, permissions, PERMISSIONS.MEMBERS_APPROVE)) {
      throw new ForbiddenException('You do not have permission to manage offline member subscriptions');
    }

    // Verify the member exists and is an offline member
    const member = await this.prisma.member.findFirst({
      where: { 
        id: memberId, 
        cooperativeId, 
        isOfflineMember: true,
        status: 'active',
      },
    });

    if (!member) {
      throw new NotFoundException('Offline member not found');
    }

    // Verify the plan exists and belongs to this cooperative
    const plan = await this.prisma.contributionPlan.findFirst({
      where: { 
        id: planId, 
        cooperativeId, 
        isActive: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Contribution plan not found');
    }

    // Check if already subscribed
    const existingSubscription = await this.prisma.contributionSubscription.findFirst({
      where: {
        memberId,
        planId,
        status: { in: ['active', 'pending'] },
      },
    });

    if (existingSubscription) {
      throw new ConflictException('Member is already subscribed to this plan');
    }

    // Calculate contribution amount based on plan settings
    let contributionAmount = plan.fixedAmount || plan.minAmount || 0;

    // Create the subscription
    const subscription = await this.prisma.contributionSubscription.create({
      data: {
        memberId,
        planId,
        amount: contributionAmount,
        status: 'active',
        subscribedAt: new Date(),
      },
      include: {
        plan: true,
        member: true,
      },
    });

    // Log activity
    await this.activitiesService.create({
      userId: requestingUserId,
      cooperativeId,
      action: 'offline_member_subscribed',
      description: `Subscribed offline member ${member.firstName} ${member.lastName} to plan: ${plan.name}`,
    });

    return subscription;
  }

  async getMemberBalance(cooperativeId: string, memberId: string, requestingUserId: string) {
    // Verify the requesting user is a member or admin
    const requestingMember = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId: requestingUserId,
        status: 'active',
      },
    });

    if (!requestingMember) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    // Get the target member
    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        cooperativeId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Check if user can view this member's balance (admin or own balance)
    const isAdmin = requestingMember.role === 'admin' || requestingMember.role === 'owner';
    const isOwnBalance = member.userId === requestingUserId;

    if (!isAdmin && !isOwnBalance) {
      throw new ForbiddenException('You do not have permission to view this balance');
    }

    // Calculate total contributions
    const totalContributions = await this.prisma.contributionPayment.aggregate({
      where: {
        memberId,
        status: 'approved',
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate total loan disbursements
    const totalLoanDisbursements = await this.prisma.loan.aggregate({
      where: {
        memberId,
        status: { in: ['approved', 'disbursed', 'active', 'repaying'] },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate total loan repayments
    const totalLoanRepayments = await this.prisma.loanRepaymentSchedule.aggregate({
      where: {
        loan: {
          memberId,
        },
        status: 'paid',
      },
      _sum: {
        paidAmount: true,
      },
    });

    // Calculate total group buy outlays (orders)
    const totalGroupBuyOutlays = await this.prisma.groupBuyOrder.aggregate({
      where: {
        memberId,
        status: { in: ['confirmed', 'allocated', 'completed'] },
      },
      _sum: {
        totalLiability: true,
      },
    });

    // Calculate group buy repayments (if there's a payment tracking for group buys)
    // For now, assume paid in full if confirmed
    const totalGroupBuyRepayments = totalGroupBuyOutlays._sum.totalLiability || 0;

    // Get manual adjustments from ledger entries if they exist
    const manualCredits = await this.prisma.ledgerEntry.aggregate({
      where: {
        memberId,
        type: 'manual_credit',
      },
      _sum: {
        amount: true,
      },
    });

    const manualDebits = await this.prisma.ledgerEntry.aggregate({
      where: {
        memberId,
        type: 'manual_debit',
      },
      _sum: {
        amount: true,
      },
    });

    const manualAdjustments = (manualCredits._sum.amount || 0) - Math.abs(manualDebits._sum.amount || 0);

    // Calculate current balance
    const currentBalance = 
      (totalContributions._sum.amount || 0) +
      (totalLoanRepayments._sum.paidAmount || 0) +
      manualAdjustments -
      (totalLoanDisbursements._sum.amount || 0);
      // Note: Group buy outlays are usually paid separately, not from virtual balance

    return {
      memberId,
      cooperativeId,
      totalContributions: totalContributions._sum.amount || 0,
      totalLoanDisbursements: totalLoanDisbursements._sum.amount || 0,
      totalLoanRepayments: totalLoanRepayments._sum.paidAmount || 0,
      totalGroupBuyOutlays: totalGroupBuyOutlays._sum.totalLiability || 0,
      totalGroupBuyRepayments,
      manualAdjustments,
      currentBalance,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get all member balances for a cooperative
   */
  async getAllMemberBalances(cooperativeId: string, userId: string) {
    // Verify user is a member of this cooperative
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId,
        status: 'active',
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not an active member of this cooperative');
    }

    // Get all active members
    const members = await this.prisma.member.findMany({
      where: {
        cooperativeId,
        status: 'active',
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    // Calculate balance for each member
    const balances = await Promise.all(
      members.map(async (m) => {
        const balance = await this.getMemberBalance(cooperativeId, m.id, userId);
        return {
          ...balance,
          member: {
            id: m.id,
            firstName: m.user?.firstName || m.firstName,
            lastName: m.user?.lastName || m.lastName,
            email: m.user?.email || m.email,
            isOfflineMember: m.isOfflineMember,
          },
        };
      })
    );

    return balances;
  }

  /**
   * Get ledger entries for a cooperative (optionally filtered by member)
   */
  async getLedgerEntries(cooperativeId: string, userId: string, memberId?: string) {
    // Verify user is a member of this cooperative
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId,
        status: 'active',
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not an active member of this cooperative');
    }

    // Build the query based on whether we're filtering by member
    const whereClause: any = { cooperativeId };
    if (memberId) {
      whereClause.memberId = memberId;
    }

    // Get ledger entries
    const entries = await this.prisma.ledgerEntry.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 entries
    });

    // Also build virtual ledger entries from contribution payments, loans, etc.
    const virtualEntries = await this.buildVirtualLedgerEntries(cooperativeId, memberId);

    // Deduplicate: Remove virtual entries that already exist as real ledger entries
    // We identify duplicates by matching referenceType and referenceId
    const existingRefs = new Set(
      entries
        .filter(e => e.referenceId && e.referenceType)
        .map(e => `${e.referenceType}:${e.referenceId}`)
    );

    const deduplicatedVirtualEntries = virtualEntries.filter(ve => {
      const key = `${ve.referenceType}:${ve.referenceId}`;
      return !existingRefs.has(key);
    });

    // Combine and sort by date
    const allEntries = [...entries, ...deduplicatedVirtualEntries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return allEntries.slice(0, 100); // Return latest 100
  }

  /**
   * Build virtual ledger entries from contribution payments and loans
   * These are transactions that affect member balances but aren't stored in LedgerEntry table
   */
  private async buildVirtualLedgerEntries(cooperativeId: string, memberId?: string) {
    const entries: any[] = [];

    // Get approved contribution payments
    const whereClause: any = {
      status: 'approved',
      subscription: {
        plan: { cooperativeId },
      },
    };
    if (memberId) {
      whereClause.memberId = memberId;
    }

    const payments = await this.prisma.contributionPayment.findMany({
      where: whereClause,
      include: {
        subscription: {
          include: {
            plan: true,
            member: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { approvedAt: 'desc' },
      take: 50,
    });

    for (const payment of payments) {
      const memberName = payment.subscription.member.user
        ? `${payment.subscription.member.user.firstName} ${payment.subscription.member.user.lastName}`
        : `${payment.subscription.member.firstName || ''} ${payment.subscription.member.lastName || ''}`.trim() || 'Member';
      
      entries.push({
        id: `contribution_${payment.id}`,
        cooperativeId,
        memberId: payment.memberId,
        type: 'contribution_in',
        amount: payment.amount,
        balanceAfter: 0, // Will be calculated client-side
        referenceId: payment.id,
        referenceType: 'contribution_payment',
        description: `Contribution to "${payment.subscription.plan.name}" by ${memberName}`,
        createdBy: payment.approvedBy || 'system',
        createdAt: payment.approvedAt || payment.createdAt,
        memberName,
      });
    }

    // Get disbursed loans
    const loanWhereClause: any = {
      cooperativeId,
      status: { in: ['disbursed', 'repaying', 'completed'] },
    };
    if (memberId) {
      loanWhereClause.memberId = memberId;
    }

    const loans = await this.prisma.loan.findMany({
      where: loanWhereClause,
      include: {
        member: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { disbursedAt: 'desc' },
      take: 50,
    });

    for (const loan of loans) {
      const memberName = loan.member.user
        ? `${loan.member.user.firstName} ${loan.member.user.lastName}`
        : `${loan.member.firstName || ''} ${loan.member.lastName || ''}`.trim() || 'Member';

      if (loan.disbursedAt) {
        entries.push({
          id: `loan_disbursement_${loan.id}`,
          cooperativeId,
          memberId: loan.memberId,
          type: 'loan_disbursement',
          amount: -loan.amountDisbursed,
          balanceAfter: 0,
          referenceId: loan.id,
          referenceType: 'loan',
          description: `Loan disbursement of ₦${loan.amountDisbursed.toLocaleString()} to ${memberName}`,
          createdBy: loan.reviewedBy || 'system',
          createdAt: loan.disbursedAt,
          memberName,
        });
      }
    }

    // Get loan repayments
    const repaymentWhereClause: any = {
      loan: { cooperativeId },
      status: 'paid',
    };
    if (memberId) {
      repaymentWhereClause.loan = { ...repaymentWhereClause.loan, memberId };
    }

    const repayments = await this.prisma.loanRepaymentSchedule.findMany({
      where: repaymentWhereClause,
      include: {
        loan: {
          include: {
            member: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
      take: 50,
    });

    for (const repayment of repayments) {
      const memberName = repayment.loan.member.user
        ? `${repayment.loan.member.user.firstName} ${repayment.loan.member.user.lastName}`
        : `${repayment.loan.member.firstName || ''} ${repayment.loan.member.lastName || ''}`.trim() || 'Member';

      entries.push({
        id: `loan_repayment_${repayment.id}`,
        cooperativeId,
        memberId: repayment.loan.memberId,
        type: 'loan_repayment',
        amount: repayment.paidAmount,
        balanceAfter: 0,
        referenceId: repayment.loanId,
        referenceType: 'loan_repayment',
        description: `Loan repayment of ₦${repayment.paidAmount.toLocaleString()} by ${memberName}`,
        createdBy: 'system',
        createdAt: repayment.paidAt,
        memberName,
      });
    }

    return entries;
  }

  /**
   * Add a manual ledger entry (credit or debit)
   */
  async addManualLedgerEntry(
    cooperativeId: string,
    dto: { memberId: string; type: 'manual_credit' | 'manual_debit'; amount: number; description: string },
    userId: string,
  ) {
    // Verify user is an admin of this cooperative
    const adminMember = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId,
        role: 'admin',
        status: 'active',
      },
    });

    if (!adminMember) {
      throw new ForbiddenException('Only admins can add manual ledger entries');
    }

    // Verify target member exists
    const targetMember = await this.prisma.member.findFirst({
      where: {
        id: dto.memberId,
        cooperativeId,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in this cooperative');
    }

    // Get current balance to calculate balance after
    const currentBalance = await this.getMemberBalance(cooperativeId, dto.memberId, userId);
    const amount = dto.type === 'manual_credit' ? Math.abs(dto.amount) : -Math.abs(dto.amount);
    const balanceAfter = currentBalance.currentBalance + amount;

    // Create the ledger entry
    const entry = await this.prisma.ledgerEntry.create({
      data: {
        cooperativeId,
        memberId: dto.memberId,
        type: dto.type,
        amount,
        balanceAfter,
        description: dto.description,
        createdBy: userId,
      },
    });

    // Log activity
    const memberName = targetMember.user
      ? `${targetMember.user.firstName} ${targetMember.user.lastName}`
      : `${targetMember.firstName || ''} ${targetMember.lastName || ''}`.trim() || 'Member';

    await this.activitiesService.log(
      userId,
      `ledger.${dto.type}`,
      `Added ${dto.type === 'manual_credit' ? 'credit' : 'debit'} of ₦${Math.abs(dto.amount).toLocaleString()} for ${memberName}`,
      cooperativeId,
      { memberId: dto.memberId, amount: dto.amount, type: dto.type },
    );

    return entry;
  }

  /**
   * Get ledger report with summary statistics
   */
  async getLedgerReport(
    cooperativeId: string,
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    // Verify user is a member of this cooperative
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId,
        status: 'active',
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not an active member of this cooperative');
    }

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get total contributions
    const contributionFilter: any = {
      status: 'approved',
      subscription: { plan: { cooperativeId } },
    };
    if (startDate || endDate) {
      contributionFilter.approvedAt = dateFilter;
    }

    const totalContributions = await this.prisma.contributionPayment.aggregate({
      where: contributionFilter,
      _sum: { amount: true },
    });

    // Get total loans disbursed
    const loanFilter: any = {
      cooperativeId,
      status: { in: ['disbursed', 'repaying', 'completed'] },
    };
    if (startDate || endDate) {
      loanFilter.disbursedAt = dateFilter;
    }

    const totalLoans = await this.prisma.loan.aggregate({
      where: loanFilter,
      _sum: { amountDisbursed: true },
    });

    // Get total group buy outlays
    const groupBuyFilter: any = {
      groupBuy: { cooperativeId },
      status: { in: ['confirmed', 'allocated', 'completed'] },
    };
    if (startDate || endDate) {
      groupBuyFilter.createdAt = dateFilter;
    }

    const totalGroupBuys = await this.prisma.groupBuyOrder.aggregate({
      where: groupBuyFilter,
      _sum: { totalLiability: true },
    });

    // Get entries for the period
    const entries = await this.getLedgerEntries(cooperativeId, userId);

    const netBalance = 
      (totalContributions._sum.amount || 0) - 
      (totalLoans._sum.amountDisbursed || 0);

    return {
      totalContributions: totalContributions._sum.amount || 0,
      totalLoans: totalLoans._sum.amountDisbursed || 0,
      totalGroupBuys: totalGroupBuys._sum.totalLiability || 0,
      netBalance,
      entries,
    };
  }
}
