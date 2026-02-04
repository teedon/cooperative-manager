import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/create-organization.dto';
import { InviteStaffDto } from './dto/staff-invite.dto';
import { OrganizationType } from './enums/organization-type.enum';
import { sendMailWithZoho, generateStaffInviteEmailTemplate } from '../services/mailer';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateOrganizationDto, createdBy: string) {
    const organization = await this.prisma.organization.create({
      data: {
        ...createDto,
        settings: {},
      },
    });

    // Automatically add the creator as an admin staff member
    await this.prisma.staff.create({
      data: {
        organizationId: organization.id,
        userId: createdBy,
        role: 'admin',
        permissions: [
          'create_collection',
          'submit_collection',
          'approve_collection',
          'view_reports',
          'manage_staff',
          'manage_settings',
        ],
        isActive: true,
      },
    });

    // If it's a manager organization, create default collection settings
    if (createDto.type === OrganizationType.MANAGER) {
      await this.prisma.collectionSettings.create({
        data: {
          organizationId: organization.id,
          requireApproval: true,
          allowPartialPosting: false,
          minApprovers: 1,
          requireSupervisor: true,
        },
      });
    }

    return organization;
  }

  async findAll(userId: string) {
    // Find organizations where user is a staff member
    const staff = await this.prisma.staff.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                staff: true,
                cooperatives: true,
              },
            },
          },
        },
      },
    });

    return staff.map((s: any) => ({
      ...s.organization,
      staffCount: s.organization._count.staff,
      cooperativesCount: s.organization._count.cooperatives,
      totalRevenue: 0, // Calculate this based on actual business logic
      userRole: s.role,
      userPermissions: s.permissions,
    }));
  }

  async findOne(id: string, userId?: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        collectionSettings: true,
        staff: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        cooperatives: {
          select: {
            id: true,
            name: true,
            code: true,
            memberCount: true,
          },
        },
        _count: {
          select: {
            staff: true,
            cooperatives: true,
            dailyCollections: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // If userId provided, verify user has access and get their role
    let userRole = null;
    let userPermissions = null;
    
    if (userId) {
      const userStaff = organization.staff.find((s: { userId: string }) => s.userId === userId);
      if (!userStaff) {
        throw new NotFoundException('Organization not found');
      }
      userRole = (userStaff as any).role;
      userPermissions = (userStaff as any).permissions;
    }

    return {
      ...organization,
      staffCount: organization._count.staff,
      cooperativesCount: organization._count.cooperatives,
      totalRevenue: 0, // Calculate based on actual collections
      userRole,
      userPermissions,
    };
  }

  async update(id: string, updateDto: UpdateOrganizationDto, userId: string) {
    // Verify user has admin access to this organization
    await this.verifyAdminAccess(id, userId);

    const organization = await this.prisma.organization.update({
      where: { id },
      data: updateDto,
      include: {
        collectionSettings: true,
      },
    });

    return organization;
  }

  async updateSettings(
    id: string,
    settings: any,
    userId: string,
  ) {
    await this.verifyAdminAccess(id, userId);

    const organization = await this.prisma.organization.update({
      where: { id },
      data: { settings },
    });

    return organization;
  }

  async updateCollectionSettings(
    id: string,
    settings: {
      requireApproval?: boolean;
      allowPartialPosting?: boolean;
      autoPostAfterHours?: number;
      minApprovers?: number;
      requireSupervisor?: boolean;
    },
    userId: string,
  ) {
    await this.verifyAdminAccess(id, userId);

    const collectionSettings = await this.prisma.collectionSettings.upsert({
      where: { organizationId: id },
      create: {
        organizationId: id,
        ...settings,
      },
      update: settings,
    });

    return collectionSettings;
  }

  async getStats(id: string, userId: string) {
    await this.verifyAccess(id, userId);

    const [
      totalStaff,
      activeStaff,
      totalCooperatives,
      totalCollections,
      pendingCollections,
    ] = await Promise.all([
      this.prisma.staff.count({ where: { organizationId: id } }),
      this.prisma.staff.count({ where: { organizationId: id, isActive: true } }),
      this.prisma.cooperative.count({ where: { organizationId: id } }),
      this.prisma.dailyCollection.count({ where: { organizationId: id } }),
      this.prisma.dailyCollection.count({
        where: { organizationId: id, status: 'submitted' },
      }),
    ]);

    return {
      totalStaff,
      activeStaff,
      totalCooperatives,
      totalCollections,
      pendingCollections,
    };
  }

  // Helper methods
  private async verifyAccess(organizationId: string, userId: string) {
    console.log('verifyAccess called with:', { organizationId, userId });
    
    const staff = await this.prisma.staff.findFirst({
      where: {
        organizationId,
        userId,
        isActive: true,
      },
    });

    console.log('Staff found for user:', staff);

    if (!staff) {
      throw new NotFoundException('Organization not found or access denied');
    }

    return staff;
  }
  async getStaff(organizationId: string, userId: string, page: number = 1, limit: number = 10) {
    console.log('getStaff called with:', { organizationId, userId, page, limit });
    
    // Verify user has access to this organization (any staff member can view staff list)
    await this.verifyAccess(organizationId, userId);

    const skip = (page - 1) * limit;

    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where: {
          organizationId: organizationId,
        },
        skip,
        take: limit,
        orderBy: {
          hiredAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            }
          }
        }
      }),
      this.prisma.staff.count({
        where: {
          organizationId: organizationId
        }
      })
    ]);

    console.log('Found staff members:', staff.length);
    console.log('Staff data:', staff);

    const formattedStaff = staff.map(member => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      permissions: Array.isArray(member.permissions) ? member.permissions : [],
      employeeCode: member.employeeCode || undefined,
      isActive: member.isActive,
      hiredAt: member.hiredAt.toISOString(),
      user: member.user
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      staff: formattedStaff,
      total,
      totalPages,
      currentPage: page,
    };
  }

  async addStaff(organizationId: string, userId: string, addStaffDto: { userId: string; role: string; permissions: string[]; employeeCode?: string }) {
    // Verify user has admin access to this organization
    await this.verifyAdminAccess(organizationId, userId);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: addStaffDto.userId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already staff in this organization
    const existingStaff = await this.prisma.staff.findFirst({
      where: {
        organizationId: organizationId,
        userId: addStaffDto.userId
      }
    });

    if (existingStaff) {
      throw new BadRequestException('User is already a staff member of this organization');
    }

    // Create staff record
    const staff = await this.prisma.staff.create({
      data: {
        organizationId: organizationId,
        userId: addStaffDto.userId,
        role: addStaffDto.role,
        permissions: addStaffDto.permissions,
        employeeCode: addStaffDto.employeeCode,
        isActive: true,
        hiredAt: new Date()
      }
    });

    return {
      id: staff.id,
      userId: staff.userId,
      role: staff.role,
      permissions: staff.permissions,
      employeeCode: staff.employeeCode,
      isActive: staff.isActive,
      hiredAt: staff.hiredAt.toISOString(),
      user: user
    };
  }

  async removeStaff(organizationId: string, staffId: string, userId: string) {
    // Verify user has admin access to this organization
    await this.verifyAdminAccess(organizationId, userId);

    // Find the staff member
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        organizationId: organizationId
      }
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Don't allow removing the last admin
    if (staff.role === 'admin') {
      const adminCount = await this.prisma.staff.count({
        where: {
          organizationId: organizationId,
          role: 'admin',
          isActive: true
        }
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin from the organization');
      }
    }

    // Soft delete by setting isActive to false
    await this.prisma.staff.update({
      where: { id: staffId },
      data: { isActive: false }
    });

    return { success: true };
  }

  // ==================== STAFF INVITATION METHODS ====================

  async inviteStaff(organizationId: string, inviteDto: InviteStaffDto, inviterId: string) {
    // Verify user has admin access to this organization
    await this.verifyAdminAccess(organizationId, inviterId);

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user is already a staff member
    const existingUser = await this.prisma.user.findUnique({
      where: { email: inviteDto.email },
    });

    if (existingUser) {
      const existingStaff = await this.prisma.staff.findFirst({
        where: {
          organizationId,
          userId: existingUser.id,
        },
      });

      if (existingStaff) {
        throw new BadRequestException('User is already a staff member of this organization');
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        organizationId,
        email: inviteDto.email,
        invitationType: 'staff',
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new BadRequestException('A pending invitation already exists for this email');
    }

    // Get inviter info
    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
      select: { firstName: true, lastName: true },
    });

    const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}` : 'Organization Admin';
    
    // If cooperative assignments provided, validate they exist and belong to organization
    if (inviteDto.cooperativeIds && inviteDto.cooperativeIds.length > 0) {
      const cooperatives = await this.prisma.cooperative.findMany({
        where: {
          id: { in: inviteDto.cooperativeIds },
          organizationId,
        },
      });

      if (cooperatives.length !== inviteDto.cooperativeIds.length) {
        throw new BadRequestException('Some cooperatives do not exist or do not belong to this organization');
      }
    }

    try {
      // Create invitation record
      const invitation = await this.prisma.invitation.create({
        data: {
          organizationId,
          inviterId,
          email: inviteDto.email,
          message: inviteDto.message,
          invitationType: 'staff',
          role: inviteDto.role,
          permissions: inviteDto.permissions || [],
          employeeCode: inviteDto.employeeCode,
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiration
          // Store cooperative assignments in metadata for later use
          metadata: inviteDto.cooperativeIds ? { cooperativeIds: inviteDto.cooperativeIds } : undefined,
        },
      });

      // Send invitation email
      const htmlContent = generateStaffInviteEmailTemplate(
        inviteDto.email,
        inviterName,
        organization.name,
        inviteDto.role,
        inviteDto.message,
      );

      const emailSent = await sendMailWithZoho({
        recipient: inviteDto.email,
        subject: `You're invited to join ${organization.name} as staff`,
        htmlContent,
      });

      return {
        invitation,
        emailSent,
        organizationName: organization.name,
        inviterName,
      };
    } catch (error) {
      console.error('Error sending staff invitation:', error);
      throw new BadRequestException('Failed to send staff invitation');
    }
  }

  async getStaffInvitations(organizationId: string, userId: string) {
    // Verify user has admin access to this organization
    await this.verifyAdminAccess(organizationId, userId);

    const invitations = await this.prisma.invitation.findMany({
      where: { 
        organizationId,
        invitationType: 'staff',
      },
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

  async revokeStaffInvitation(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.invitationType !== 'staff') {
      throw new NotFoundException('Staff invitation not found');
    }

    // Verify user has admin access to this organization
    await this.verifyAdminAccess(invitation.organizationId!, userId);

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'revoked' },
    });

    return { success: true };
  }

  async acceptStaffInvitation(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { organization: true },
    });

    if (!invitation || invitation.invitationType !== 'staff') {
      throw new NotFoundException('Staff invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException('Invitation is no longer valid');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    // Get user email to verify they match
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || user.email !== invitation.email) {
      throw new BadRequestException('You can only accept invitations sent to your email address');
    }

    // Check if user is already staff in this organization
    const existingStaff = await this.prisma.staff.findFirst({
      where: {
        organizationId: invitation.organizationId!,
        userId,
      },
    });

    if (existingStaff) {
      throw new BadRequestException('You are already a staff member of this organization');
    }

    // Create staff record and mark invitation as accepted
    const staff = await this.prisma.staff.create({
      data: {
        organizationId: invitation.organizationId!,
        userId,
        role: invitation.role!,
        permissions: invitation.permissions,
        employeeCode: invitation.employeeCode,
        isActive: true,
        hiredAt: new Date(),
      },
    });

    // Handle cooperative assignments if they were included in the invitation
    const metadata = invitation.metadata as any;
    if (metadata?.cooperativeIds && Array.isArray(metadata.cooperativeIds)) {
      const assignments = metadata.cooperativeIds.map((cooperativeId: string) => ({
        staffId: staff.id,
        cooperativeId,
        assignedBy: invitation.inviterId!,
        assignedAt: new Date(),
        isActive: true,
      }));

      await this.prisma.staffGroupAssignment.createMany({
        data: assignments,
      });
    }

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: 'accepted',
        acceptedBy: userId,
        acceptedAt: new Date(),
      },
    });

    return {
      staff,
      organization: invitation.organization,
    };
  }

  private async verifyAdminAccess(organizationId: string, userId: string) {
    const staff = await this.verifyAccess(organizationId, userId);

    if (staff.role !== 'admin') {
      throw new BadRequestException('Admin access required');
    }

    return staff;
  }
}
