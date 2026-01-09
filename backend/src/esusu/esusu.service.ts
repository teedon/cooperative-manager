import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEsusuDto,
  UpdateEsusuDto,
  RespondToInvitationDto,
  SetOrderDto,
  RecordContributionDto,
  ProcessCollectionDto,
  EsusuSettingsDto,
} from './dto/esusu.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivitiesService } from '../activities/activities.service';
import { sendEmail } from '../services/mailer';

@Injectable()
export class EsusuService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private activitiesService: ActivitiesService,
  ) {}

  // ========== SETTINGS ==========

  async getSettings(cooperativeId: string) {
    let settings = await this.prisma.esusuSettings.findUnique({
      where: { cooperativeId },
    });

    if (!settings) {
      settings = await this.prisma.esusuSettings.create({
        data: {
          cooperativeId,
          commissionRate: 0,
          defaultFrequency: 'monthly',
        },
      });
    }

    return settings;
  }

  async updateSettings(cooperativeId: string, userId: string, dto: EsusuSettingsDto) {
    const settings = await this.prisma.esusuSettings.upsert({
      where: { cooperativeId },
      update: {
        commissionRate: dto.commissionRate,
        defaultFrequency: dto.defaultFrequency,
      },
      create: {
        cooperativeId,
        commissionRate: dto.commissionRate,
        defaultFrequency: dto.defaultFrequency,
      },
    });

    await this.activitiesService.create({
      cooperativeId,
      userId,
      action: 'esusu_settings_updated',
      description: `Updated Esusu settings: ${dto.commissionRate}% commission, ${dto.defaultFrequency} frequency`,
      metadata: {
        settingsId: settings.id,
        commissionRate: dto.commissionRate,
        defaultFrequency: dto.defaultFrequency,
      },
    });

    return settings;
  }

  // ========== CREATE ESUSU ==========

  async create(cooperativeId: string, userId: string, dto: CreateEsusuDto) {
    // Validate dates
    const startDate = new Date(dto.startDate);
    const invitationDeadline = new Date(dto.invitationDeadline);
    const now = new Date();

    if (invitationDeadline <= now) {
      throw new BadRequestException('Invitation deadline must be in the future');
    }

    if (startDate <= invitationDeadline) {
      throw new BadRequestException('Start date must be after invitation deadline');
    }

    // Validate minimum members
    if (dto.memberIds.length < 3) {
      throw new BadRequestException('Esusu requires at least 3 members');
    }

    // Verify all members belong to cooperative
    const members = await this.prisma.member.findMany({
      where: {
        id: { in: dto.memberIds },
        cooperativeId,
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

    if (members.length !== dto.memberIds.length) {
      throw new BadRequestException('Some members do not belong to this cooperative');
    }

    // Create Esusu
    const esusu = await this.prisma.esusu.create({
      data: {
        cooperativeId,
        title: dto.title,
        description: dto.description,
        contributionAmount: dto.contributionAmount,
        frequency: dto.frequency,
        orderType: dto.orderType,
        totalCycles: dto.memberIds.length,
        startDate,
        invitationDeadline,
        createdBy: userId,
        members: {
          create: dto.memberIds.map((memberId) => {
            // Check if member is offline (no user associated)
            const member = members.find(m => m.id === memberId);
            const isOffline = !member?.user;
            
            return {
              memberId,
              status: isOffline ? 'accepted' : 'pending',
              acceptedAt: isOffline ? new Date() : null,
            };
          }),
        },
      },
      include: {
        members: {
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Log activity
    await this.activitiesService.create({
      cooperativeId,
      userId,
      action: 'esusu_created',
      description: `Created Esusu: ${dto.title}`,
      metadata: {
        esusuId: esusu.id,
        contributionAmount: dto.contributionAmount,
        frequency: dto.frequency,
        memberCount: dto.memberIds.length,
      },
    });

    // Send email invitations to all members
    for (const esusuMember of esusu.members) {
      if (esusuMember.member.user) {
        const memberName = `${esusuMember.member.user.firstName} ${esusuMember.member.user.lastName}`;
        const email = esusuMember.member.user.email;

        await sendEmail(
          email,
          `You've been invited to join ${dto.title}`,
          `
            <h2>Esusu Invitation</h2>
            <p>Dear ${memberName},</p>
            <p>You have been invited to participate in a rotational savings plan called <strong>${dto.title}</strong>.</p>
            
            <h3>Esusu Details:</h3>
            <ul>
              <li><strong>Contribution Amount:</strong> ₦${dto.contributionAmount.toLocaleString()} per ${dto.frequency === 'weekly' ? 'week' : 'month'}</li>
              <li><strong>Total Members:</strong> ${dto.memberIds.length}</li>
              <li><strong>Order Type:</strong> ${dto.orderType === 'random' ? 'Random' : dto.orderType === 'first_come' ? 'First Come First Serve' : 'Selection'}</li>
              <li><strong>Start Date:</strong> ${startDate.toLocaleDateString()}</li>
              <li><strong>Deadline to Accept:</strong> ${invitationDeadline.toLocaleDateString()}</li>
            </ul>
            
            ${dto.description ? `<p><strong>Description:</strong> ${dto.description}</p>` : ''}
            
            <p><strong>How it works:</strong> Each ${dto.frequency === 'weekly' ? 'week' : 'month'}, all members contribute ₦${dto.contributionAmount.toLocaleString()}. The total pot (₦${(dto.contributionAmount * dto.memberIds.length).toLocaleString()}) is then collected by one member in a rotating order. This continues until everyone has collected once.</p>
            
            <p><strong>Important:</strong> You must accept this invitation before ${invitationDeadline.toLocaleDateString()} to participate.</p>
            
            <p>Please log in to the app to accept or decline this invitation.</p>
          `,
        );

        // Send push notification
        await this.notificationsService.createNotification({
          userId: esusuMember.member.user.id,
          cooperativeId,
          type: 'esusu',
          title: 'Esusu Invitation',
          body: `You've been invited to join ${dto.title}. Accept before ${invitationDeadline.toLocaleDateString()}.`,
          data: {
            esusuId: esusu.id,
            action: 'invitation',
          },
        });
      }
    }

    return esusu;
  }

  // ========== LIST ESUSUS ==========

  async findAll(cooperativeId: string, userId: string) {
    // Get member record for this user
    const member = await this.prisma.member.findFirst({
      where: { cooperativeId, userId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Admins and moderators can see all Esusus
    const isAdminOrModerator = member.role === 'admin' || member.role === 'moderator';

    // Get Esusus based on role
    const esusus = await this.prisma.esusu.findMany({
      where: isAdminOrModerator
        ? { cooperativeId } // Admins see all
        : {
            cooperativeId,
            members: {
              some: {
                memberId: member.id,
              },
            },
          },
      include: {
        members: isAdminOrModerator
          ? true // Admins see all members
          : {
              where: {
                memberId: member.id,
              },
            },
        _count: {
          select: {
            members: true,
            contributions: true,
            collections: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return esusus;
  }

  // ========== GET ESUSU DETAILS ==========

  async findOne(esusuId: string, userId: string) {
    const esusu = await this.prisma.esusu.findUnique({
      where: { id: esusuId },
      include: {
        members: {
          include: {
            member: {
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
            },
          },
          orderBy: {
            collectionOrder: 'asc',
          },
        },
        contributions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        },
        collections: {
          include: {
            member: {
              include: {
                member: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
          orderBy: {
            cycleNumber: 'desc',
          },
        },
      },
    });

    if (!esusu) {
      throw new NotFoundException('Esusu not found');
    }

    // Verify user is a member of the cooperative
    const member = await this.prisma.member.findFirst({
      where: { cooperativeId: esusu.cooperativeId, userId },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    // Admins and moderators can view any Esusu
    const isAdminOrModerator = member.role === 'admin' || member.role === 'moderator';
    const isMember = esusu.members.some(m => m.memberId === member.id);
    
    if (!isAdminOrModerator && !isMember) {
      throw new ForbiddenException('You are not a member of this Esusu');
    }

    return esusu;
  }

  // ========== UPDATE ESUSU (before start only) ==========

  async update(esusuId: string, userId: string, dto: UpdateEsusuDto) {
    const esusu = await this.prisma.esusu.findUnique({
      where: { id: esusuId },
    });

    if (!esusu) {
      throw new NotFoundException('Esusu not found');
    }

    if (esusu.status !== 'pending') {
      throw new BadRequestException('Cannot update Esusu after it has started');
    }

    // Get member to check if admin/moderator
    const member = await this.prisma.member.findFirst({
      where: { cooperativeId: esusu.cooperativeId, userId },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const isAdminOrModerator = member.role === 'admin' || member.role === 'moderator';
    const isCreator = esusu.createdBy === userId;

    if (!isCreator && !isAdminOrModerator) {
      throw new ForbiddenException('Only the creator or admins can update this Esusu');
    }

    const updatedEsusu = await this.prisma.esusu.update({
      where: { id: esusuId },
      data: {
        title: dto.title,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        invitationDeadline: dto.invitationDeadline ? new Date(dto.invitationDeadline) : undefined,
      },
    });

    await this.activitiesService.create({
      cooperativeId: esusu.cooperativeId,
      userId,
      action: 'esusu_updated',
      description: `Updated Esusu: ${updatedEsusu.title}`,
      metadata: {
        esusuId: esusu.id,
      },
    });

    return updatedEsusu;
  }

  // ========== RESPOND TO INVITATION ==========

  async respondToInvitation(esusuId: string, userId: string, dto: RespondToInvitationDto) {
    const esusu = await this.prisma.esusu.findUnique({
      where: { id: esusuId },
      include: {
        members: {
          where: {
            status: 'accepted',
          },
        },
      },
    });

    if (!esusu) {
      throw new NotFoundException('Esusu not found');
    }

    if (esusu.status !== 'pending') {
      throw new BadRequestException('Cannot respond to invitation after Esusu has started');
    }

    if (new Date() > esusu.invitationDeadline) {
      throw new BadRequestException('Invitation deadline has passed');
    }

    // Validate preferred order for first_come type
    if (dto.status === 'accepted' && esusu.orderType === 'first_come') {
      if (!dto.preferredOrder) {
        throw new BadRequestException('Preferred order is required for first-come Esusu');
      }

      if (dto.preferredOrder < 1 || dto.preferredOrder > esusu.totalCycles) {
        throw new BadRequestException(`Preferred order must be between 1 and ${esusu.totalCycles}`);
      }

      // Check if the slot is already taken
      const slotTaken = esusu.members.some(
        m => m.collectionOrder === dto.preferredOrder,
      );

      if (slotTaken) {
        throw new BadRequestException(`Slot ${dto.preferredOrder} is already taken`);
      }
    }

    // Get member record
    const member = await this.prisma.member.findFirst({
      where: { cooperativeId: esusu.cooperativeId, userId },
      include: {
        user: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Get esusu member record
    const esusuMember = await this.prisma.esusuMember.findUnique({
      where: {
        esusuId_memberId: {
          esusuId,
          memberId: member.id,
        },
      },
    });

    if (!esusuMember) {
      throw new NotFoundException('Esusu member invitation not found');
    }

    if (esusuMember.status !== 'pending') {
      throw new BadRequestException('You have already responded to this invitation');
    }

    // Update member status
    const updatedMember = await this.prisma.esusuMember.update({
      where: { id: esusuMember.id },
      data: {
        status: dto.status,
        acceptedAt: dto.status === 'accepted' ? new Date() : null,
        collectionOrder: dto.status === 'accepted' && esusu.orderType === 'first_come' ? dto.preferredOrder : null,
      },
      include: {
        esusu: true,
      },
    });

    const memberName = member.user
      ? `${member.user.firstName} ${member.user.lastName}`
      : `${member.firstName} ${member.lastName}`;

    // Log activity
    await this.activitiesService.create({
      cooperativeId: esusu.cooperativeId,
      userId: member.userId || member.id,
      action: `esusu_invitation_${dto.status}`,
      description: `${memberName} ${dto.status === 'accepted' ? 'accepted' : 'declined'} Esusu: ${esusu.title}`,
      metadata: {
        esusuId,
        memberId: member.id,
        status: dto.status,
      },
    });

    // If declined, update totalCycles and notify admins
    if (dto.status === 'declined') {
      const acceptedCount = await this.prisma.esusuMember.count({
        where: {
          esusuId,
          status: 'accepted',
        },
      });

      await this.prisma.esusu.update({
        where: { id: esusuId },
        data: {
          totalCycles: acceptedCount,
        },
      });
    }

    // Notify cooperative admins
    const cooperative = await this.prisma.cooperative.findUnique({
      where: { id: esusu.cooperativeId },
      include: {
        members: {
          where: {
            role: 'admin',
          },
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
      },
    });

    if (cooperative) {
      for (const admin of cooperative.members) {
        if (admin.userId && admin.userId !== userId) {
          await this.notificationsService.createNotification({
            userId: admin.userId,
            cooperativeId: esusu.cooperativeId,
            type: 'esusu',
            title: 'Esusu Invitation Response',
            body: `${memberName} ${dto.status === 'accepted' ? 'accepted' : 'declined'} the invitation to ${esusu.title}`,
            data: {
              esusuId: esusu.id,
              action: 'response',
            },
          });

          if (admin.user) {
            await sendEmail(
              admin.user.email,
              `Esusu Invitation Response: ${esusu.title}`,
              `
                <h2>Esusu Invitation Response</h2>
                <p>Dear ${admin.user.firstName},</p>
                <p><strong>${memberName}</strong> has <strong>${dto.status === 'accepted' ? 'accepted' : 'declined'}</strong> the invitation to participate in <strong>${esusu.title}</strong>.</p>
                <p>Please check the app for more details.</p>
              `,
            );
          }
        }
      }
    }

    return updatedMember;
  }

  // ========== DETERMINE ORDER ==========

  async determineOrder(esusuId: string, userId: string) {
    const esusu = await this.prisma.esusu.findUnique({
      where: { id: esusuId },
      include: {
        members: {
          where: {
            status: 'accepted',
          },
        },
      },
    });

    if (!esusu) {
      throw new NotFoundException('Esusu not found');
    }

    if (esusu.createdBy !== userId) {
      throw new ForbiddenException('Only the creator can determine the order');
    }

    if (esusu.isOrderDetermined) {
      throw new BadRequestException('Order has already been determined');
    }

    //if invitation deadline has not passed but all members have accepted, allow order determination
    if (new Date() < esusu.invitationDeadline && esusu.members.length < esusu.totalCycles) {
      throw new BadRequestException('Cannot determine order before invitation deadline, all members have not accepted yet');
    }

    const acceptedMembers = esusu.members.filter(m => m.status === 'accepted');

    if (acceptedMembers.length < 3) {
      throw new BadRequestException('Need at least 3 accepted members to start Esusu');
    }

    let orderedMembers = [...acceptedMembers];

    if (esusu.orderType === 'random') {
      // Shuffle randomly
      for (let i = orderedMembers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedMembers[i], orderedMembers[j]] = [orderedMembers[j], orderedMembers[i]];
      }
    } else if (esusu.orderType === 'first_come') {
      // Members have already selected their slots during acceptance
      // Just sort by collectionOrder (which should already be set)
      orderedMembers.sort((a, b) => (a.collectionOrder || 0) - (b.collectionOrder || 0));
      
      // Skip the order assignment since it's already done
      const updatedEsusu = await this.prisma.esusu.update({
        where: { id: esusuId },
        data: {
          isOrderDetermined: true,
          status: 'active',
          currentCycle: 1,
          totalCycles: acceptedMembers.length,
        },
        include: {
          members: {
            where: {
              status: 'accepted',
            },
            include: {
              member: {
                include: {
                  user: true,
                },
              },
            },
            orderBy: {
              collectionOrder: 'asc',
            },
          },
        },
      });

      // Log activity
      await this.activitiesService.create({
        cooperativeId: esusu.cooperativeId,
        userId,
        action: 'esusu_order_determined',
        description: `Order determined for Esusu: ${esusu.title}`,
        metadata: {
          esusuId: esusu.id,
          orderType: esusu.orderType,
        },
      });

      // Notify all members of their position
      for (const esusuMember of updatedEsusu.members) {
        if (esusuMember.member.user) {
          const memberName = `${esusuMember.member.user.firstName} ${esusuMember.member.user.lastName}`;

          await this.notificationsService.createNotification({
            userId: esusuMember.member.user.id,
            cooperativeId: esusu.cooperativeId,
            type: 'esusu',
            title: 'Esusu Collection Order',
            body: `Your collection position in ${esusu.title} is #${esusuMember.collectionOrder}`,
            data: {
              esusuId: esusu.id,
              action: 'order_determined',
            },
          });

          await sendEmail(
            esusuMember.member.user.email,
            'Esusu Activated',
            `
            <h2>Esusu Plan Activated</h2>
            <p>Hello ${memberName},</p>
            <p>The Esusu plan "${esusu.title}" has been activated.</p>
            <p><strong>Your collection position: #${esusuMember.collectionOrder}</strong></p>
            <p>Start Date: ${new Date(esusu.startDate).toLocaleDateString()}</p>
            <p>Contribution Amount: ₦${esusu.contributionAmount.toLocaleString()}</p>
            <p>Frequency: ${esusu.frequency}</p>
          `,
          );
        }
      }

      return updatedEsusu;
    } else if (esusu.orderType === 'selection') {
      throw new BadRequestException('Selection order type requires manual ordering via setOrder endpoint');
    }

    // Update members with their collection order
    await Promise.all(
      orderedMembers.map((member, index) =>
        this.prisma.esusuMember.update({
          where: { id: member.id },
          data: {
            collectionOrder: index + 1,
          },
        }),
      ),
    );

    // Update Esusu status
    const updatedEsusu = await this.prisma.esusu.update({
      where: { id: esusuId },
      data: {
        isOrderDetermined: true,
        status: 'active',
        currentCycle: 1,
        totalCycles: acceptedMembers.length,
      },
      include: {
        members: {
          where: {
            status: 'accepted',
          },
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            collectionOrder: 'asc',
          },
        },
      },
    });

    // Log activity
    await this.activitiesService.create({
      cooperativeId: esusu.cooperativeId,
      userId,
      action: 'esusu_order_determined',
      description: `Order determined for Esusu: ${esusu.title}`,
      metadata: {
        esusuId: esusu.id,
        orderType: esusu.orderType,
      },
    });

    // Notify all members of their position
    for (const esusuMember of updatedEsusu.members) {
      if (esusuMember.member.user) {
        const memberName = `${esusuMember.member.user.firstName} ${esusuMember.member.user.lastName}`;

        await this.notificationsService.createNotification({
          userId: esusuMember.member.user.id,
          cooperativeId: esusu.cooperativeId,
          type: 'esusu',
          title: 'Esusu Collection Order',
          body: `Your collection position in ${esusu.title} is #${esusuMember.collectionOrder}`,
          data: {
            esusuId: esusu.id,
            action: 'order_determined',
          },
        });

        await sendEmail(
          esusuMember.member.user.email,
          `Your Collection Order: ${esusu.title}`,
          `
            <h2>Esusu Collection Order</h2>
            <p>Dear ${memberName},</p>
            <p>The collection order for <strong>${esusu.title}</strong> has been determined.</p>
            <p><strong>Your Position:</strong> #${esusuMember.collectionOrder} of ${updatedEsusu.members.length}</p>
            <p>You will collect the pot in cycle ${esusuMember.collectionOrder}.</p>
            
            <h3>Full Order:</h3>
            <ol>
              ${updatedEsusu.members
                .map(
                  m =>
                    `<li>${m.member.user ? `${m.member.user.firstName} ${m.member.user.lastName}` : `${m.member.firstName} ${m.member.lastName}`}</li>`,
                )
                .join('')}
            </ol>
            
            <p>The Esusu will start on ${esusu.startDate.toLocaleDateString()}. Please ensure you make your contribution on time each ${esusu.frequency === 'weekly' ? 'week' : 'month'}.</p>
          `,
        );
      }
    }

    return updatedEsusu;
  }

  // ========== SET ORDER (MANUAL) ==========

  async setOrder(esusuId: string, userId: string, dto: SetOrderDto) {
    const esusu = await this.prisma.esusu.findUnique({
      where: { id: esusuId },
      include: {
        members: {
          where: {
            status: 'accepted',
          },
        },
      },
    });

    if (!esusu) {
      throw new NotFoundException('Esusu not found');
    }

    // Get user's member record to check role
    const userMember = await this.prisma.member.findFirst({
      where: { cooperativeId: esusu.cooperativeId, userId },
    });

    if (!userMember) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const isAdminOrModerator = userMember.role === 'admin' || userMember.role === 'moderator';
    const isCreator = esusu.createdBy === userId;

    if (!isCreator && !isAdminOrModerator) {
      throw new ForbiddenException('Only the creator or admins can set the order');
    }

    if (esusu.orderType !== 'selection') {
      throw new BadRequestException('Can only manually set order for selection type Esusu');
    }

    if (esusu.isOrderDetermined) {
      throw new BadRequestException('Order has already been determined');
    }

    const acceptedMembers = esusu.members.filter(m => m.status === 'accepted');

    if (dto.memberOrders.length !== acceptedMembers.length) {
      throw new BadRequestException('Must provide order for all accepted members');
    }

    // Validate all member IDs exist and orders are sequential
    const memberIds = new Set(acceptedMembers.map(m => m.memberId));
    const orders = new Set<number>();

    for (const { memberId, order } of dto.memberOrders) {
      if (!memberIds.has(memberId)) {
        throw new BadRequestException(`Invalid member ID: ${memberId}`);
      }
      if (order < 1 || order > acceptedMembers.length) {
        throw new BadRequestException(`Invalid order: ${order}`);
      }
      if (orders.has(order)) {
        throw new BadRequestException(`Duplicate order: ${order}`);
      }
      orders.add(order);
    }

    // Update members with their collection order
    await Promise.all(
      dto.memberOrders.map(({ memberId, order }) =>
        this.prisma.esusuMember.updateMany({
          where: {
            esusuId,
            memberId,
          },
          data: {
            collectionOrder: order,
          },
        }),
      ),
    );

    // Update Esusu status
    const updatedEsusu = await this.prisma.esusu.update({
      where: { id: esusuId },
      data: {
        isOrderDetermined: true,
        status: 'active',
        currentCycle: 1,
        totalCycles: acceptedMembers.length,
      },
      include: {
        members: {
          where: {
            status: 'accepted',
          },
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            collectionOrder: 'asc',
          },
        },
      },
    });

    // Log activity
    await this.activitiesService.create({
      cooperativeId: esusu.cooperativeId,
      userId,
      action: 'esusu_order_set',
      description: `Manually set order for Esusu: ${esusu.title}`,
      metadata: {
        esusuId: esusu.id,
      },
    });

    // Notify all members
    for (const esusuMember of updatedEsusu.members) {
      if (esusuMember.member.user) {
        const memberName = `${esusuMember.member.user.firstName} ${esusuMember.member.user.lastName}`;

        await this.notificationsService.createNotification({
          userId: esusuMember.member.user.id,
          cooperativeId: esusu.cooperativeId,
          type: 'esusu',
          title: 'Esusu Collection Order',
          body: `Your collection position in ${esusu.title} is #${esusuMember.collectionOrder}`,
          data: {
            esusuId: esusu.id,
            action: 'order_set',
          },
        });

        await sendEmail(
          esusuMember.member.user.email,
          `Your Collection Order: ${esusu.title}`,
          `
            <h2>Esusu Collection Order</h2>
            <p>Dear ${memberName},</p>
            <p>The collection order for <strong>${esusu.title}</strong> has been set.</p>
            <p><strong>Your Position:</strong> #${esusuMember.collectionOrder} of ${updatedEsusu.members.length}</p>
            
            <p>The Esusu will start on ${esusu.startDate.toLocaleDateString()}.</p>
          `,
        );
      }
    }

    return updatedEsusu;
  }

  // ========== RECORD CONTRIBUTION ==========

  async recordContribution(esusuId: string, userId: string, dto: RecordContributionDto) {
    const esusu = await this.prisma.esusu.findUnique({
      where: { id: esusuId },
    });

    if (!esusu) {
      throw new NotFoundException('Esusu not found');
    }

    if (esusu.status !== 'active') {
      throw new BadRequestException('Esusu is not active');
    }

    // Get the user's member record to check role
    const userMember = await this.prisma.member.findFirst({
      where: { cooperativeId: esusu.cooperativeId, userId },
    });

    if (!userMember) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const isAdminOrModerator = userMember.role === 'admin' || userMember.role === 'moderator';

    // Verify target member exists
    const member = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
      include: {
        user: true,
      },
    });

    if (!member || member.cooperativeId !== esusu.cooperativeId) {
      throw new NotFoundException('Member not found');
    }

    // Verify member is part of this Esusu
    const esusuMember = await this.prisma.esusuMember.findUnique({
      where: {
        esusuId_memberId: {
          esusuId,
          memberId: dto.memberId,
        },
      },
    });

    if (!esusuMember || esusuMember.status !== 'accepted') {
      throw new NotFoundException('Member is not part of this Esusu');
    }

    // Regular members can only record their own contributions unless they're admin/moderator
    if (!isAdminOrModerator && dto.memberId !== userMember.id) {
      throw new ForbiddenException('You can only record your own contributions');
    }

    // Check if already contributed for this cycle
    const existingContribution = await this.prisma.esusuContribution.findUnique({
      where: {
        esusuId_memberId_cycleNumber: {
          esusuId,
          memberId: dto.memberId,
          cycleNumber: esusu.currentCycle,
        },
      },
    });

    if (existingContribution) {
      throw new BadRequestException('Member has already contributed for this cycle');
    }

    // Validate contribution amount matches
    if (dto.amount !== esusu.contributionAmount) {
      throw new BadRequestException(`Contribution amount must be ₦${esusu.contributionAmount}`);
    }

    // Record contribution
    const contribution = await this.prisma.esusuContribution.create({
      data: {
        esusuId,
        memberId: dto.memberId,
        cycleNumber: esusu.currentCycle,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
        recordedBy: userId,
        notes: dto.notes,
      },
    });

    const memberName = member.user
      ? `${member.user.firstName} ${member.user.lastName}`
      : `${member.firstName} ${member.lastName}`;

    // Log activity
    await this.activitiesService.create({
      cooperativeId: esusu.cooperativeId,
      userId,
      action: 'esusu_contribution_recorded',
      description: `Recorded contribution for ${memberName} in ${esusu.title} - Cycle ${esusu.currentCycle}`,
      metadata: {
        esusuId,
        contributionId: contribution.id,
        amount: dto.amount,
        cycleNumber: esusu.currentCycle,
      },
    });

    // Send email notification to member if recorded by someone else
    if (member.userId && member.userId !== userId && member.user) {
      await sendEmail(
        member.user.email,
        `Contribution Recorded: ${esusu.title}`,
        `
          <h2>Contribution Recorded</h2>
          <p>Dear ${memberName},</p>
          <p>Your contribution for <strong>${esusu.title}</strong> has been recorded.</p>
          
          <h3>Payment Details:</h3>
          <ul>
            <li><strong>Amount:</strong> ₦${dto.amount.toLocaleString()}</li>
            <li><strong>Cycle:</strong> ${esusu.currentCycle} of ${esusu.totalCycles}</li>
            <li><strong>Payment Method:</strong> ${dto.paymentMethod}</li>
            ${dto.referenceNumber ? `<li><strong>Reference:</strong> ${dto.referenceNumber}</li>` : ''}
            <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
          
          ${dto.notes ? `<p><strong>Notes:</strong> ${dto.notes}</p>` : ''}
          
          <p>Thank you for your contribution!</p>
        `,
      );

      await this.notificationsService.createNotification({
        userId: member.user.id,
        cooperativeId: esusu.cooperativeId,
        type: 'esusu',
        title: 'Contribution Recorded',
        body: `Your contribution of ₦${dto.amount.toLocaleString()} for ${esusu.title} has been recorded`,
        data: {
          esusuId: esusu.id,
          action: 'contribution',
        },
      });
    }

    return contribution;
  }

  // ========== PROCESS COLLECTION ==========

  async processCollection(esusuId: string, userId: string, dto: ProcessCollectionDto) {
    const esusu = await this.prisma.esusu.findUnique({
      where: { id: esusuId },
      include: {
        members: {
          where: {
            status: 'accepted',
          },
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!esusu) {
      throw new NotFoundException('Esusu not found');
    }

    if (esusu.status !== 'active') {
      throw new BadRequestException('Esusu is not active');
    }

    // Check if collection already exists for this cycle
    const existingCollection = await this.prisma.esusuCollection.findUnique({
      where: {
        esusuId_cycleNumber: {
          esusuId,
          cycleNumber: esusu.currentCycle,
        },
      },
    });

    if (existingCollection) {
      throw new BadRequestException('Collection has already been processed for this cycle');
    }

    // Find who should collect this cycle
    const collector = esusu.members.find(m => m.collectionOrder === esusu.currentCycle);

    if (!collector) {
      throw new NotFoundException('Collector not found for this cycle');
    }

    // Verify all members have contributed for this cycle
    const contributions = await this.prisma.esusuContribution.findMany({
      where: {
        esusuId,
        cycleNumber: esusu.currentCycle,
      },
    });

    const acceptedMemberIds = esusu.members.map(m => m.memberId);
    const contributedMemberIds = contributions.map(c => c.memberId);

    const missingContributions = acceptedMemberIds.filter(id => !contributedMemberIds.includes(id));

    if (missingContributions.length > 0) {
      throw new BadRequestException(
        `Cannot process collection. ${missingContributions.length} member(s) have not contributed yet.`,
      );
    }

    // Get settings for commission calculation
    const settings = await this.getSettings(esusu.cooperativeId);

    // Calculate amounts
    const totalAmount = esusu.contributionAmount * esusu.members.length;
    const commission = Math.round((totalAmount * settings.commissionRate) / 100);
    const netAmount = totalAmount - commission;

    // Create collection record
    const collection = await this.prisma.esusuCollection.create({
      data: {
        esusuId,
        memberId: collector.id,
        cycleNumber: esusu.currentCycle,
        totalAmount,
        commission,
        netAmount,
        disbursedBy: userId,
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
        notes: dto.notes,
      },
    });

    // Update esusu member
    await this.prisma.esusuMember.update({
      where: { id: collector.id },
      data: {
        hasCollected: true,
        collectionCycle: esusu.currentCycle,
      },
    });

    const collectorName = collector.member.user
      ? `${collector.member.user.firstName} ${collector.member.user.lastName}`
      : `${collector.member.firstName} ${collector.member.lastName}`;

    // Log activity
    await this.activitiesService.create({
      cooperativeId: esusu.cooperativeId,
      userId,
      action: 'esusu_collection_processed',
      description: `${collectorName} collected ₦${netAmount.toLocaleString()} from ${esusu.title} - Cycle ${esusu.currentCycle}`,
      metadata: {
        esusuId,
        collectionId: collection.id,
        totalAmount,
        commission,
        netAmount,
        cycleNumber: esusu.currentCycle,
      },
    });

    // Send email to collector
    if (collector.member.user) {
      await sendEmail(
        collector.member.user.email,
        `Collection Ready: ${esusu.title}`,
        `
          <h2>Your Esusu Collection is Ready!</h2>
          <p>Dear ${collectorName},</p>
          <p>Your collection for <strong>${esusu.title}</strong> is ready for pickup/disbursement.</p>
          
          <h3>Collection Details:</h3>
          <ul>
            <li><strong>Cycle:</strong> ${esusu.currentCycle} of ${esusu.totalCycles}</li>
            <li><strong>Total Contributions:</strong> ₦${totalAmount.toLocaleString()}</li>
            ${commission > 0 ? `<li><strong>Commission (${settings.commissionRate}%):</strong> -₦${commission.toLocaleString()}</li>` : ''}
            <li><strong>Net Amount:</strong> ₦${netAmount.toLocaleString()}</li>
            <li><strong>Payment Method:</strong> ${dto.paymentMethod}</li>
            ${dto.referenceNumber ? `<li><strong>Reference:</strong> ${dto.referenceNumber}</li>` : ''}
          </ul>
          
          ${dto.notes ? `<p><strong>Notes:</strong> ${dto.notes}</p>` : ''}
          
          <p>Congratulations!</p>
        `,
      );

      await this.notificationsService.createNotification({
        userId: collector.member.user.id,
        cooperativeId: esusu.cooperativeId,
        type: 'esusu',
        title: 'Collection Ready',
        body: `Your collection of ₦${netAmount.toLocaleString()} for ${esusu.title} is ready`,
        data: {
          esusuId: esusu.id,
          action: 'collection',
        },
      });
    }

    // Notify all other members
    for (const member of esusu.members) {
      if (member.id !== collector.id && member.member.user) {
        await this.notificationsService.createNotification({
          userId: member.member.user.id,
          cooperativeId: esusu.cooperativeId,
          type: 'esusu',
          title: 'Esusu Collection Completed',
          body: `${collectorName} collected ₦${netAmount.toLocaleString()} from ${esusu.title} - Cycle ${esusu.currentCycle}`,
          data: {
            esusuId: esusu.id,
            action: 'collection_completed',
          },
        });
      }
    }

    // Check if Esusu is complete
    if (esusu.currentCycle >= esusu.totalCycles) {
      await this.prisma.esusu.update({
        where: { id: esusuId },
        data: {
          status: 'completed',
        },
      });

      // Notify all members of completion
      for (const member of esusu.members) {
        if (member.member.user) {
          await this.notificationsService.createNotification({
            userId: member.member.user.id,
            cooperativeId: esusu.cooperativeId,
            type: 'esusu',
            title: 'Esusu Completed',
            body: `${esusu.title} has been completed successfully! All members have collected.`,
            data: {
              esusuId: esusu.id,
              action: 'completed',
            },
          });

          await sendEmail(
            member.member.user.email,
            `Esusu Completed: ${esusu.title}`,
            `
              <h2>Esusu Completed!</h2>
              <p>Dear ${member.member.user.firstName},</p>
              <p><strong>${esusu.title}</strong> has been completed successfully!</p>
              <p>All ${esusu.totalCycles} members have collected their share.</p>
              <p>Thank you for your participation!</p>
            `,
          );
        }
      }
    } else {
      // Advance to next cycle
      await this.prisma.esusu.update({
        where: { id: esusuId },
        data: {
          currentCycle: esusu.currentCycle + 1,
        },
      });

      // Notify next collector
      const nextCollector = esusu.members.find(m => m.collectionOrder === esusu.currentCycle + 1);
      if (nextCollector && nextCollector.member.user) {
        const nextCollectorName = `${nextCollector.member.user.firstName} ${nextCollector.member.user.lastName}`;

        await this.notificationsService.createNotification({
          userId: nextCollector.member.user.id,
          cooperativeId: esusu.cooperativeId,
          type: 'esusu',
          title: 'Your Turn to Collect',
          body: `Cycle ${esusu.currentCycle + 1}: You will collect next in ${esusu.title}. Ensure all members contribute!`,
          data: {
            esusuId: esusu.id,
            action: 'next_cycle',
          },
        });

        await sendEmail(
          nextCollector.member.user.email,
          `Your Turn Next: ${esusu.title}`,
          `
            <h2>Your Turn to Collect is Coming!</h2>
            <p>Dear ${nextCollectorName},</p>
            <p>In the next cycle (Cycle ${esusu.currentCycle + 1}), you will collect the pot from <strong>${esusu.title}</strong>.</p>
            <p><strong>Expected Amount:</strong> ₦${netAmount.toLocaleString()}</p>
            <p>Please ensure all members have contributed before collection can be processed.</p>
          `,
        );
      }
    }

    return collection;
  }

  // ========== GET CYCLE STATUS ==========

  async getCycleStatus(esusuId: string, userId: string) {
    const esusu = await this.prisma.esusu.findUnique({
      where: { id: esusuId },
      include: {
        members: {
          where: {
            status: 'accepted',
          },
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!esusu) {
      throw new NotFoundException('Esusu not found');
    }

    // Get contributions for current cycle
    const contributions = await this.prisma.esusuContribution.findMany({
      where: {
        esusuId,
        cycleNumber: esusu.currentCycle,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });

    const contributedMemberIds = contributions.map(c => c.memberId);
    const pendingMembers = esusu.members.filter(m => !contributedMemberIds.includes(m.memberId));

    // Find current collector
    const currentCollector = esusu.members.find(m => m.collectionOrder === esusu.currentCycle);

    return {
      esusu,
      currentCycle: esusu.currentCycle,
      totalCycles: esusu.totalCycles,
      contributions,
      contributedCount: contributions.length,
      totalMembers: esusu.members.length,
      pendingMembers,
      currentCollector,
      isComplete: contributions.length === esusu.members.length,
    };
  }

  // ========== GET MEMBER STATEMENT ==========

  async getMemberStatement(esusuId: string, memberId: string, userId: string) {
    const esusu = await this.prisma.esusu.findUnique({
      where: { id: esusuId },
    });

    if (!esusu) {
      throw new NotFoundException('Esusu not found');
    }

    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        user: true,
      },
    });

    if (!member || member.cooperativeId !== esusu.cooperativeId) {
      throw new NotFoundException('Member not found');
    }

    // Get all contributions by this member
    const contributions = await this.prisma.esusuContribution.findMany({
      where: {
        esusuId,
        memberId,
      },
      orderBy: {
        cycleNumber: 'asc',
      },
    });

    // Get collection by this member (if any)
    const collection = await this.prisma.esusuCollection.findFirst({
      where: {
        esusuId,
        member: {
          memberId,
        },
      },
    });

    // Get esusu member record
    const esusuMember = await this.prisma.esusuMember.findUnique({
      where: {
        esusuId_memberId: {
          esusuId,
          memberId,
        },
      },
    });

    const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);

    return {
      member,
      esusuMember,
      contributions,
      collection,
      totalContributed,
      netReceived: collection ? collection.netAmount : 0,
      balance: totalContributed - (collection ? collection.netAmount : 0),
    };
  }

  // ========== GET PENDING INVITATIONS ==========

  async getPendingInvitations(userId: string) {
    const member = await this.prisma.member.findFirst({
      where: { userId },
    });

    if (!member) {
      return [];
    }

    const invitations = await this.prisma.esusuMember.findMany({
      where: {
        memberId: member.id,
        status: 'pending',
      },
      include: {
        esusu: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
    });

    return invitations;
  }
}
