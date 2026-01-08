import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAjoDto, UpdateAjoDto, RecordAjoPaymentDto, AjoSettingsDto } from './dto/ajo.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivitiesService } from '../activities/activities.service';
import { sendEmail } from '../services/mailer';

@Injectable()
export class AjoService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private activitiesService: ActivitiesService,
  ) {}

  // Get or create Ajo settings for a cooperative
  async getSettings(cooperativeId: string) {
    let settings = await this.prisma.ajoSettings.findUnique({
      where: { cooperativeId },
    });

    if (!settings) {
      settings = await this.prisma.ajoSettings.create({
        data: {
          cooperativeId,
          commissionRate: 0,
          interestRate: 0,
        },
      });
    }

    return settings;
  }

  // Update Ajo settings
  async updateSettings(cooperativeId: string, userId: string, dto: AjoSettingsDto) {
    const settings = await this.prisma.ajoSettings.upsert({
      where: { cooperativeId },
      update: {
        commissionRate: dto.commissionRate,
        interestRate: dto.interestRate,
      },
      create: {
        cooperativeId,
        commissionRate: dto.commissionRate,
        interestRate: dto.interestRate,
      },
    });

    await this.activitiesService.create({
      cooperativeId,
      userId,
      action: 'ajo_settings_updated',
      description: `Updated Ajo settings: ${dto.commissionRate}% commission, ${dto.interestRate}% interest`,
      metadata: {
        settingsId: settings.id,
        commissionRate: dto.commissionRate,
        interestRate: dto.interestRate,
      },
    });

    return settings;
  }

  // Create a new Ajo
  async create(cooperativeId: string, userId: string, dto: CreateAjoDto) {
    // Verify all member IDs belong to this cooperative
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

    // Create the Ajo
    const ajo = await this.prisma.ajo.create({
      data: {
        cooperativeId,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        frequency: dto.frequency,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isContinuous: dto.isContinuous,
        createdBy: userId,
        members: {
          create: members.map((member) => ({
            memberId: member.id,
            status: member.isOfflineMember ? 'accepted' : 'pending', // Offline members auto-accept
          })),
        },
      },
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
                  },
                },
              },
            },
          },
        },
      },
    });

    // Send notifications to online members
    const onlineMembers = members.filter((m) => !m.isOfflineMember && m.userId);
    for (const member of onlineMembers) {
      if (member.userId) {
        await this.notificationsService.createNotification({
          userId: member.userId,
          cooperativeId,
          type: 'ajo_invitation',
          title: 'New Ajo Invitation',
          body: `You have been invited to join "${dto.title}" Ajo. Tap to view details and respond.`,
          data: {
            ajoId: ajo.id,
            ajoTitle: dto.title,
          },
        });

        // Send email notification
        if (member.user?.email) {
          const memberName = `${member.user.firstName} ${member.user.lastName}`;
          await sendEmail(
            member.user.email,
            `New Ajo Invitation: ${dto.title}`,
            `<p>Hi ${memberName},</p>
            <p>You have been invited to join <strong>${dto.title}</strong> Ajo.</p>
            <p><strong>Details:</strong></p>
            <ul>
              <li>Amount per payment: ₦${dto.amount.toLocaleString()}</li>
              <li>Frequency: ${dto.frequency}</li>
              ${dto.description ? `<li>Description: ${dto.description}</li>` : ''}
            </ul>
            <p>Please log in to your CoopManager account to accept or decline this invitation.</p>
            <p>Best regards,<br/>CoopManager Team</p>`,
          );
        }
      }
    }

    // Create activity
    await this.activitiesService.create({
      cooperativeId,
      userId,
      action: 'ajo_created',
      description: `Created Ajo: ${dto.title} with ${members.length} members`,
      metadata: {
        ajoId: ajo.id,
        ajoTitle: dto.title,
        memberCount: members.length,
      },
    });

    return ajo;
  }

  // Get all Ajos for a cooperative
  async findAll(cooperativeId: string, userId: string) {
    // Get user's member record
    const member = await this.prisma.member.findFirst({
      where: { cooperativeId, userId },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const ajos = await this.prisma.ajo.findMany({
      where: {
        cooperativeId,
      },
      include: {
        members: {
          where: {
            memberId: member.id,
          },
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return ajos;
  }

  // Get a single Ajo with details
  async findOne(ajoId: string, userId: string) {
    const ajo = await this.prisma.ajo.findUnique({
      where: { id: ajoId },
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
                    phone: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        payments: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    });

    if (!ajo) {
      throw new NotFoundException('Ajo not found');
    }

    // Verify user has access to this Ajo
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId: ajo.cooperativeId,
        userId,
      },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this Ajo');
    }

    return ajo;
  }

  // Update an Ajo
  async update(ajoId: string, userId: string, dto: UpdateAjoDto) {
    const ajo = await this.prisma.ajo.findUnique({
      where: { id: ajoId },
    });

    if (!ajo) {
      throw new NotFoundException('Ajo not found');
    }

    const updated = await this.prisma.ajo.update({
      where: { id: ajoId },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
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
                  },
                },
              },
            },
          },
        },
      },
    });

    await this.activitiesService.create({
      cooperativeId: ajo.cooperativeId,
      userId,
      action: 'ajo_updated',
      description: `Updated Ajo: ${updated.title}`,
      metadata: {
        ajoId,
        ajoTitle: updated.title,
      },
    });

    return updated;
  }

  // Member responds to Ajo invitation
  async respondToInvitation(ajoId: string, userId: string, status: 'accepted' | 'declined') {
    const member = await this.prisma.member.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const ajoMember = await this.prisma.ajoMember.findUnique({
      where: {
        ajoId_memberId: {
          ajoId,
          memberId: member.id,
        },
      },
      include: {
        ajo: true,
      },
    });

    if (!ajoMember) {
      throw new NotFoundException('You are not invited to this Ajo');
    }

    const updated = await this.prisma.ajoMember.update({
      where: {
        id: ajoMember.id,
      },
      data: {
        status,
        respondedAt: new Date(),
      },
    });

    // Notify cooperative members about response (simplified - can be enhanced to notify just admins)
    const memberName = `${member.user?.firstName || member.firstName} ${member.user?.lastName || member.lastName}`;

    await this.activitiesService.create({
      cooperativeId: ajoMember.ajo.cooperativeId,
      userId,
      action: status === 'accepted' ? 'ajo_accepted' : 'ajo_declined',
      description: `${memberName} ${status === 'accepted' ? 'accepted' : 'declined'} Ajo: ${ajoMember.ajo.title}`,
      metadata: {
        ajoId,
        memberId: member.id,
        status,
      },
    });

    // Notify cooperative admins about the response
    const cooperative = await this.prisma.cooperative.findUnique({
      where: { id: ajoMember.ajo.cooperativeId },
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
            cooperativeId: ajoMember.ajo.cooperativeId,
            type: status === 'accepted' ? 'ajo_accepted' : 'ajo_declined',
            title: `Ajo ${status === 'accepted' ? 'Accepted' : 'Declined'}`,
            body: `${memberName} has ${status === 'accepted' ? 'accepted' : 'declined'} the invitation to "${ajoMember.ajo.title}" Ajo`,
            data: {
              ajoId,
              memberId: member.id,
              status,
            },
          });

          // Send email to admin
          if (admin.user?.email) {
            await sendEmail(
              admin.user.email,
              `Ajo ${status === 'accepted' ? 'Accepted' : 'Declined'}: ${ajoMember.ajo.title}`,
              `<p>Hi ${admin.user.firstName},</p>
              <p>${memberName} has <strong>${status === 'accepted' ? 'accepted' : 'declined'}</strong> the invitation to join <strong>${ajoMember.ajo.title}</strong> Ajo.</p>
              <p>Best regards,<br/>CoopManager Team</p>`,
            );
          }
        }
      }
    }

    return updated;
  }

  // Record a payment for Ajo
  async recordPayment(ajoId: string, userId: string, dto: RecordAjoPaymentDto) {
    const ajo = await this.prisma.ajo.findUnique({
      where: { id: ajoId },
    });

    if (!ajo) {
      throw new NotFoundException('Ajo not found');
    }

    if (ajo.status !== 'active') {
      throw new BadRequestException('Ajo is not active');
    }

    // Verify member is part of this Ajo
    const ajoMember = await this.prisma.ajoMember.findUnique({
      where: {
        ajoId_memberId: {
          ajoId,
          memberId: dto.memberId,
        },
      },
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
    });

    if (!ajoMember) {
      throw new NotFoundException('Member is not part of this Ajo');
    }

    if (ajoMember.status !== 'accepted') {
      throw new BadRequestException('Member has not accepted the Ajo invitation');
    }

    // Record payment
    const payment = await this.prisma.ajoPayment.create({
      data: {
        ajoId,
        memberId: dto.memberId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        referenceNumber: dto.referenceNumber,
        recordedBy: userId,
        notes: dto.notes,
      },
    });

    // Update member's total paid
    await this.prisma.ajoMember.update({
      where: { id: ajoMember.id },
      data: {
        totalPaid: {
          increment: dto.amount,
        },
      },
    });

    // Notify member if payment was recorded by someone else
    if (ajoMember.member.userId && ajoMember.member.userId !== userId) {
      await this.notificationsService.createNotification({
        userId: ajoMember.member.userId,
        cooperativeId: ajo.cooperativeId,
        type: 'ajo_payment',
        title: 'Ajo Payment Recorded',
        body: `₦${dto.amount.toLocaleString()} payment has been recorded for "${ajo.title}" Ajo`,
        data: {
          ajoId,
          paymentId: payment.id,
          amount: dto.amount,
        },
      });

      // Send email notification
      if (ajoMember.member.user?.email) {
        const memberName = `${ajoMember.member.user.firstName} ${ajoMember.member.user.lastName}`;
        await sendEmail(
          ajoMember.member.user.email,
          `Payment Recorded: ${ajo.title}`,
          `<p>Hi ${memberName},</p>
          <p>A payment of <strong>₦${dto.amount.toLocaleString()}</strong> has been recorded for your participation in <strong>${ajo.title}</strong> Ajo.</p>
          <p><strong>Payment Details:</strong></p>
          <ul>
            <li>Amount: ₦${dto.amount.toLocaleString()}</li>
            <li>Payment Method: ${dto.paymentMethod.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</li>
            ${dto.referenceNumber ? `<li>Reference: ${dto.referenceNumber}</li>` : ''}
            <li>Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>Thank you for your contribution!</p>
          <p>Best regards,<br/>CoopManager Team</p>`,
        );
      }
    }

    await this.activitiesService.create({
      cooperativeId: ajo.cooperativeId,
      userId,
      action: 'ajo_payment',
      description: `Recorded ₦${dto.amount.toLocaleString()} payment for ${ajoMember.member.user?.firstName || ajoMember.member.firstName} in Ajo: ${ajo.title}`,
      metadata: {
        ajoId,
        paymentId: payment.id,
        memberId: dto.memberId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
      },
    });

    return payment;
  }

  // Get member's Ajo statement
  async getMemberStatement(ajoId: string, memberId: string, userId: string) {
    const ajo = await this.prisma.ajo.findUnique({
      where: { id: ajoId },
    });

    if (!ajo) {
      throw new NotFoundException('Ajo not found');
    }

    const ajoMember = await this.prisma.ajoMember.findUnique({
      where: {
        ajoId_memberId: {
          ajoId,
          memberId,
        },
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!ajoMember) {
      throw new NotFoundException('Member is not part of this Ajo');
    }

    const payments = await this.prisma.ajoPayment.findMany({
      where: {
        ajoId,
        memberId,
      },
      orderBy: {
        paymentDate: 'asc',
      },
    });

    const settings = await this.getSettings(ajo.cooperativeId);

    // Calculate expected payments based on frequency
    let expectedPayments = 0;
    let totalExpected = 0;

    if (!ajo.isContinuous && ajo.endDate) {
      const start = new Date(ajo.startDate);
      const end = new Date(ajo.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (ajo.frequency) {
        case 'daily':
          expectedPayments = diffDays;
          break;
        case 'weekly':
          expectedPayments = Math.ceil(diffDays / 7);
          break;
        case 'monthly':
          expectedPayments = Math.ceil(diffDays / 30);
          break;
      }

      totalExpected = expectedPayments * ajo.amount;
    }

    const commission = (ajoMember.totalPaid * settings.commissionRate) / 100;
    const interest = (ajoMember.totalPaid * settings.interestRate) / 100;
    const netAmount = ajoMember.totalPaid - commission + interest;

    return {
      ajo: {
        id: ajo.id,
        title: ajo.title,
        description: ajo.description,
        amount: ajo.amount,
        frequency: ajo.frequency,
        startDate: ajo.startDate,
        endDate: ajo.endDate,
        isContinuous: ajo.isContinuous,
        status: ajo.status,
      },
      member: {
        id: ajoMember.member.id,
        firstName: ajoMember.member.user?.firstName || ajoMember.member.firstName,
        lastName: ajoMember.member.user?.lastName || ajoMember.member.lastName,
        email: ajoMember.member.user?.email || ajoMember.member.email,
        phone: ajoMember.member.user?.phone || ajoMember.member.phone,
      },
      summary: {
        totalPaid: ajoMember.totalPaid,
        expectedPayments,
        totalExpected,
        commission,
        interest,
        netAmount,
        commissionRate: settings.commissionRate,
        interestRate: settings.interestRate,
      },
      payments,
    };
  }

  // Get pending invitations for a user
  async getPendingInvitations(userId: string) {
    const member = await this.prisma.member.findFirst({
      where: { userId },
    });

    if (!member) {
      return [];
    }

    const invitations = await this.prisma.ajoMember.findMany({
      where: {
        memberId: member.id,
        status: 'pending',
      },
      include: {
        ajo: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        invitedAt: 'desc',
      },
    });

    return invitations;
  }
}
