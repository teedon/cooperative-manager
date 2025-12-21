import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateContributionPlanDto } from './dto/create-contribution-plan.dto';
import { SubscribeToContributionDto, UpdateSubscriptionDto } from './dto/subscription.dto';
import { RecordPaymentDto, ApprovePaymentDto } from './dto/payment.dto';
import { PERMISSIONS, Permission, hasPermission, parsePermissions } from '../common/permissions';

@Injectable()
export class ContributionsService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
    private notificationsService: NotificationsService,
  ) {}

  // Get member with permissions
  private async getMemberWithPermissions(cooperativeId: string, userId: string) {
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId,
        status: 'active',
      },
      select: {
        id: true,
        role: true,
        permissions: true,
        userId: true,
        cooperativeId: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    return {
      ...member,
      parsedPermissions: parsePermissions(member.permissions),
    };
  }

  // Check if member has a specific permission
  private checkPermission(
    member: { role: string; parsedPermissions: string[] },
    requiredPermission: Permission,
  ): boolean {
    return hasPermission(member.role, member.parsedPermissions, requiredPermission);
  }

  // Verify member has permission or throw
  private requirePermission(
    member: { role: string; parsedPermissions: string[] },
    requiredPermission: Permission,
    errorMessage?: string,
  ) {
    if (!this.checkPermission(member, requiredPermission)) {
      throw new ForbiddenException(
        errorMessage || 'You do not have permission to perform this action',
      );
    }
  }

  // Verify user is admin of the cooperative (legacy - kept for backward compatibility)
  private async verifyAdmin(cooperativeId: string, userId: string) {
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId,
        role: 'admin',
        status: 'active',
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not authorized to perform this action');
    }

    return member;
  }

  // Verify user is a member of the cooperative
  private async verifyMember(cooperativeId: string, userId: string) {
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

    return member;
  }

  // Create a new contribution plan (requires CONTRIBUTIONS_CREATE_PLAN permission)
  async createPlan(cooperativeId: string, dto: CreateContributionPlanDto, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.CONTRIBUTIONS_CREATE_PLAN, 'You do not have permission to create contribution plans');

    // Validate fixed amount is provided for fixed type
    if (dto.amountType === 'fixed' && !dto.fixedAmount) {
      throw new BadRequestException('Fixed amount is required for fixed amount type');
    }

    // Validate end date for period type
    if (dto.contributionType === 'period' && !dto.endDate) {
      throw new BadRequestException('End date is required for period-based contributions');
    }

    // Validate min/max for notional type
    if (dto.amountType === 'notional' && dto.minAmount && dto.maxAmount && dto.minAmount > dto.maxAmount) {
      throw new BadRequestException('Minimum amount cannot be greater than maximum amount');
    }

    const plan = await this.prisma.contributionPlan.create({
      data: {
        cooperativeId,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        amountType: dto.amountType,
        fixedAmount: dto.fixedAmount,
        minAmount: dto.minAmount,
        maxAmount: dto.maxAmount,
        contributionType: dto.contributionType,
        frequency: dto.frequency,
        //if no start date use, the date the plan is created
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: dto.isActive ?? true,
        createdBy: userId,
      },
    });

    // Log activity
    await this.activitiesService.log(
      userId,
      'contribution.plan.create',
      `Created contribution plan "${plan.name}"`,
      cooperativeId,
      { planId: plan.id, planName: plan.name, category: plan.category },
    );

    return plan;
  }

  // Get all contribution plans for a cooperative
  async getPlans(cooperativeId: string, userId: string) {
    await this.verifyMember(cooperativeId, userId);

    return this.prisma.contributionPlan.findMany({
      where: { cooperativeId },
      include: {
        subscriptions: {
          select: {
            id: true,
            memberId: true,
            amount: true,
            status: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get a single contribution plan
  async getPlan(planId: string, userId: string) {
    const plan = await this.prisma.contributionPlan.findUnique({
      where: { id: planId },
      include: {
        cooperative: true,
        subscriptions: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Contribution plan not found');
    }

    await this.verifyMember(plan.cooperativeId, userId);

    return plan;
  }

  // Update a contribution plan (requires CONTRIBUTIONS_EDIT_PLAN permission)
  async updatePlan(planId: string, dto: Partial<CreateContributionPlanDto>, userId: string) {
    const plan = await this.prisma.contributionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Contribution plan not found');
    }

    const member = await this.getMemberWithPermissions(plan.cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.CONTRIBUTIONS_EDIT_PLAN, 'You do not have permission to edit contribution plans');

    const updatedPlan = await this.prisma.contributionPlan.update({
      where: { id: planId },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });

    // Log activity
    await this.activitiesService.log(
      userId,
      'contribution.plan.update',
      `Updated contribution plan "${updatedPlan.name}"`,
      plan.cooperativeId,
      { planId: plan.id, planName: plan.name },
    );

    return updatedPlan;
  }

  // Delete a contribution plan (requires CONTRIBUTIONS_DELETE_PLAN permission)
  async deletePlan(planId: string, userId: string) {
    const plan = await this.prisma.contributionPlan.findUnique({
      where: { id: planId },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Contribution plan not found');
    }

    const member = await this.getMemberWithPermissions(plan.cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.CONTRIBUTIONS_DELETE_PLAN, 'You do not have permission to delete contribution plans');

    if (plan._count.subscriptions > 0) {
      throw new BadRequestException('Cannot delete a plan with active subscriptions. Deactivate it instead.');
    }

    await this.prisma.contributionPlan.delete({
      where: { id: planId },
    });

    // Log activity
    await this.activitiesService.log(
      userId,
      'contribution.plan.delete',
      `Deleted contribution plan "${plan.name}"`,
      plan.cooperativeId,
      { planId: plan.id, planName: plan.name },
    );

    return { message: 'Contribution plan deleted successfully' };
  }

  // Subscribe to a contribution plan
  async subscribeToPlan(planId: string, dto: SubscribeToContributionDto, userId: string) {
    const plan = await this.prisma.contributionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Contribution plan not found');
    }

    if (!plan.isActive) {
      throw new BadRequestException('This contribution plan is not active');
    }

    const member = await this.verifyMember(plan.cooperativeId, userId);

    // Check if already subscribed
    const existingSubscription = await this.prisma.contributionSubscription.findUnique({
      where: {
        planId_memberId: {
          planId,
          memberId: member.id,
        },
      },
    });

    if (existingSubscription) {
      throw new ConflictException('You are already subscribed to this contribution plan');
    }

    // Validate amount
    let amount = dto.amount;

    if (plan.amountType === 'fixed') {
      // For fixed plans, use the fixed amount
      amount = plan.fixedAmount!;
    } else {
      // For notional plans, validate against min/max
      if (plan.minAmount && amount < plan.minAmount) {
        throw new BadRequestException(`Amount cannot be less than ${plan.minAmount}`);
      }
      if (plan.maxAmount && amount > plan.maxAmount) {
        throw new BadRequestException(`Amount cannot be more than ${plan.maxAmount}`);
      }
    }

    const subscription = await this.prisma.contributionSubscription.create({
      data: {
        planId,
        memberId: member.id,
        amount,
        status: 'active',
      },
      include: {
        plan: true,
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
    });

    // Generate payment schedules for this subscription
    await this.generatePaymentSchedules(subscription.id, plan, amount);

    // Log activity
    await this.activitiesService.log(
      userId,
      'contribution.subscribe',
      `Subscribed to contribution plan "${plan.name}"`,
      plan.cooperativeId,
      { planId: plan.id, planName: plan.name, amount },
    );

    return subscription;
  }

  // Update subscription (pause, resume, cancel, or change amount for notional)
  // Members can only resume their own subscriptions
  // Admins can pause, cancel, or resume any subscription in their cooperative
  async updateSubscription(subscriptionId: string, dto: UpdateSubscriptionDto, userId: string) {
    const subscription = await this.prisma.contributionSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        member: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const isOwner = subscription.member.userId === userId;

    // Check if user is admin of the cooperative
    const adminMember = await this.prisma.member.findFirst({
      where: {
        cooperativeId: subscription.plan.cooperativeId,
        userId,
        role: 'admin',
        status: 'active',
      },
    });
    const isAdmin = !!adminMember;

    // Authorization logic:
    // - Owner can resume their subscription
    // - Admin can pause, cancel, or resume any subscription
    // - Owner CANNOT pause or cancel their own subscription (only admin can)
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not authorized to modify this subscription');
    }

    // Only allow members to resume, pause/cancel requires admin
    if (isOwner && !isAdmin && dto.status && dto.status !== 'active') {
      throw new ForbiddenException('Only administrators can pause or cancel subscriptions');
    }

    // Members can only resume if subscription is paused or cancelled
    if (isOwner && !isAdmin && dto.status === 'active') {
      if (subscription.status !== 'paused' && subscription.status !== 'cancelled') {
        throw new BadRequestException('Subscription is already active');
      }
    }

    const updateData: any = {};

    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === 'paused') {
        updateData.pausedAt = new Date();
      } else if (dto.status === 'cancelled') {
        updateData.cancelledAt = new Date();
      } else if (dto.status === 'active') {
        // When resuming, clear paused/cancelled timestamps
        updateData.pausedAt = null;
        updateData.cancelledAt = null;
      }
    }

    if (dto.amount !== undefined) {
      // Can only change amount for notional plans
      if (subscription.plan.amountType !== 'notional') {
        throw new BadRequestException('Cannot change amount for fixed contribution plans');
      }

      // Validate against min/max
      if (subscription.plan.minAmount && dto.amount < subscription.plan.minAmount) {
        throw new BadRequestException(`Amount cannot be less than ${subscription.plan.minAmount}`);
      }
      if (subscription.plan.maxAmount && dto.amount > subscription.plan.maxAmount) {
        throw new BadRequestException(`Amount cannot be more than ${subscription.plan.maxAmount}`);
      }

      updateData.amount = dto.amount;
    }

    const updatedSubscription = await this.prisma.contributionSubscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        plan: true,
      },
    });

    // Log activity
    await this.activitiesService.log(
      userId,
      'contribution.subscription.update',
      `Updated subscription to "${subscription.plan.name}"`,
      subscription.plan.cooperativeId,
      { subscriptionId, status: dto.status, amount: dto.amount },
    );

    return updatedSubscription;
  }

  // Get user's subscriptions for a cooperative
  async getMySubscriptions(cooperativeId: string, userId: string) {
    const member = await this.verifyMember(cooperativeId, userId);

    return this.prisma.contributionSubscription.findMany({
      where: { memberId: member.id },
      include: {
        plan: true,
      },
      orderBy: { subscribedAt: 'desc' },
    });
  }

  // Get all subscriptions for a plan (requires CONTRIBUTIONS_VIEW permission)
  async getPlanSubscriptions(planId: string, userId: string) {
    const plan = await this.prisma.contributionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Contribution plan not found');
    }

    const member = await this.getMemberWithPermissions(plan.cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.CONTRIBUTIONS_VIEW, 'You do not have permission to view plan subscriptions');

    return this.prisma.contributionSubscription.findMany({
      where: { planId },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { subscribedAt: 'desc' },
    });
  }

  // ==================== PAYMENT METHODS ====================

  // Record a payment for a subscription
  async recordPayment(subscriptionId: string, dto: RecordPaymentDto, userId: string) {
    const subscription = await this.prisma.contributionSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        member: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Verify the user owns this subscription
    if (subscription.member.userId !== userId) {
      throw new ForbiddenException('You can only record payments for your own subscriptions');
    }

    if (subscription.status !== 'active') {
      throw new BadRequestException('Cannot record payment for inactive subscription');
    }

    const payment = await this.prisma.contributionPayment.create({
      data: {
        subscriptionId,
        memberId: subscription.memberId,
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        paymentMethod: dto.paymentMethod ?? null,
        paymentReference: dto.paymentReference ?? null,
        receiptUrl: dto.receiptUrl ?? null,
        notes: dto.notes ?? null,
        status: 'pending',
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    // Log activity
    await this.activitiesService.create({
      userId,
      cooperativeId: subscription.plan.cooperativeId,
      action: 'contribution.payment.record',
      description: `Recorded payment of ₦${dto.amount.toLocaleString()} for "${subscription.plan.name}"`,
      metadata: { paymentId: payment.id, subscriptionId, amount: dto.amount },
    });

    return payment;
  }

  // Get payments for a subscription
  async getSubscriptionPayments(subscriptionId: string, userId: string) {
    const subscription = await this.prisma.contributionSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        member: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // User can view their own payments, or admin can view any
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId: subscription.plan.cooperativeId,
        userId,
        status: 'active',
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const isAdmin = member.role === 'admin';
    const isOwner = subscription.member.userId === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only view your own payments');
    }

    return this.prisma.contributionPayment.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
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
    });
  }

  // Get all my payments across all subscriptions in a cooperative
  async getMyPayments(cooperativeId: string, userId: string) {
    const member = await this.verifyMember(cooperativeId, userId);

    return this.prisma.contributionPayment.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                frequency: true,
                cooperativeId: true,
              },
            },
          },
        },
      },
    });
  }

  // Get pending payments for admin approval (requires CONTRIBUTIONS_APPROVE_PAYMENTS permission)
  async getPendingPayments(cooperativeId: string, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.CONTRIBUTIONS_APPROVE_PAYMENTS, 'You do not have permission to view pending payments');

    return this.prisma.contributionPayment.findMany({
      where: {
        status: 'pending',
        subscription: {
          plan: {
            cooperativeId,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        subscription: {
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
    });
  }

  // Approve or reject a payment (requires CONTRIBUTIONS_APPROVE_PAYMENTS permission)
  async approvePayment(paymentId: string, dto: ApprovePaymentDto, userId: string) {
    const payment = await this.prisma.contributionPayment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          include: {
            plan: true,
            member: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'pending') {
      throw new BadRequestException('Payment has already been processed');
    }

    const member = await this.getMemberWithPermissions(payment.subscription.plan.cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.CONTRIBUTIONS_APPROVE_PAYMENTS, 'You do not have permission to approve payments');

    if (dto.status === 'rejected' && !dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    // Start a transaction to update payment and balances
    const result = await this.prisma.$transaction(async (tx) => {
      // Update payment status
      const updatedPayment = await tx.contributionPayment.update({
        where: { id: paymentId },
        data: {
          status: dto.status,
          approvedBy: dto.status === 'approved' ? userId : null,
          approvedAt: dto.status === 'approved' ? new Date() : null,
          rejectionReason: dto.rejectionReason ?? null,
        },
      });

      if (dto.status === 'approved') {
        // Update subscription totalPaid
        await tx.contributionSubscription.update({
          where: { id: payment.subscriptionId },
          data: {
            totalPaid: {
              increment: payment.amount,
            },
          },
        });

        // Update member's virtual balance
        await tx.member.update({
          where: { id: payment.subscription.memberId },
          data: {
            virtualBalance: {
              increment: payment.amount,
            },
          },
        });

        // Update cooperative's total contributions
        await tx.cooperative.update({
          where: { id: payment.subscription.plan.cooperativeId },
          data: {
            totalContributions: {
              increment: payment.amount,
            },
          },
        });

        // Create ledger entry
        const paymentMember = await tx.member.findUnique({
          where: { id: payment.subscription.memberId },
        });

        await tx.ledgerEntry.create({
          data: {
            cooperativeId: payment.subscription.plan.cooperativeId,
            memberId: payment.subscription.memberId,
            type: 'contribution',
            amount: payment.amount,
            balanceAfter: paymentMember!.virtualBalance,
            referenceId: paymentId,
            referenceType: 'contribution_payment',
            description: `Contribution payment for "${payment.subscription.plan.name}"`,
            createdBy: userId,
          },
        });
      }

      return updatedPayment;
    });

    // Update linked schedule if payment is approved
    if (dto.status === 'approved') {
      await this.updateScheduleOnPaymentApproval(paymentId, payment.amount);
    }

    // Log activity
    const paymentMember = payment.subscription.member;
    const memberName = paymentMember.user 
      ? `${paymentMember.user.firstName} ${paymentMember.user.lastName}`
      : `${paymentMember.firstName ?? 'Unknown'} ${paymentMember.lastName ?? 'Member'}`;
    const actionDescription = dto.status === 'approved'
      ? `Approved payment of ₦${payment.amount.toLocaleString()} from ${memberName}`
      : `Rejected payment of ₦${payment.amount.toLocaleString()} from ${memberName}: ${dto.rejectionReason}`;

    await this.activitiesService.create({
      userId,
      cooperativeId: payment.subscription.plan.cooperativeId,
      action: `contribution.payment.${dto.status}`,
      description: actionDescription,
      metadata: { paymentId, amount: payment.amount, status: dto.status },
    });

    // Notify the member about payment approval/rejection
    if (payment.subscription.member.userId) {
      if (dto.status === 'approved') {
        await this.notificationsService.createNotification({
          userId: payment.subscription.member.userId,
          cooperativeId: payment.subscription.plan.cooperativeId,
          type: 'contribution_approved',
          title: 'Payment Approved',
          body: `Your contribution payment of ₦${payment.amount.toLocaleString()} for "${payment.subscription.plan.name}" has been approved.`,
          data: { paymentId, planId: payment.subscription.planId },
        });
      } else {
        await this.notificationsService.createNotification({
          userId: payment.subscription.member.userId,
          cooperativeId: payment.subscription.plan.cooperativeId,
          type: 'contribution_rejected',
          title: 'Payment Rejected',
          body: `Your contribution payment of ₦${payment.amount.toLocaleString()} was rejected. Reason: ${dto.rejectionReason}`,
          data: { paymentId, planId: payment.subscription.planId },
        });
      }
    }

    return result;
  }

  // Get due payments for a member based on their subscriptions
  async getDuePayments(cooperativeId: string, userId: string) {
    const member = await this.verifyMember(cooperativeId, userId);

    // Get all active subscriptions for this member
    const subscriptions = await this.prisma.contributionSubscription.findMany({
      where: {
        memberId: member.id,
        status: 'active',
        plan: {
          cooperativeId,
          isActive: true,
        },
      },
      include: {
        plan: true,
        payments: {
          where: {
            status: {
              in: ['pending', 'approved'],
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Calculate due payments based on frequency
    const now = new Date();
    const duePayments = subscriptions.map((subscription) => {
      const plan = subscription.plan;
      const lastPayment = subscription.payments[0];
      const lastPaymentDate = lastPayment?.paymentDate || subscription.subscribedAt;
      
      // Calculate next due date based on frequency
      let nextDueDate = new Date(lastPaymentDate);
      switch (plan.frequency) {
        case 'daily':
          nextDueDate.setDate(nextDueDate.getDate() + 1);
          break;
        case 'weekly':
          nextDueDate.setDate(nextDueDate.getDate() + 7);
          break;
        case 'monthly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          break;
        case 'yearly':
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
          break;
        default:
          // For continuous without frequency, assume monthly
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      const isDue = nextDueDate <= now;
      const isOverdue = nextDueDate < now;
      
      // Count pending payments
      const pendingPayments = subscription.payments.filter(p => p.status === 'pending');

      return {
        subscription: {
          id: subscription.id,
          amount: subscription.amount,
          totalPaid: subscription.totalPaid,
          status: subscription.status,
          subscribedAt: subscription.subscribedAt,
        },
        plan: {
          id: plan.id,
          name: plan.name,
          category: plan.category,
          frequency: plan.frequency,
          amountType: plan.amountType,
        },
        nextDueDate,
        isDue,
        isOverdue,
        amountDue: subscription.amount,
        pendingPaymentsCount: pendingPayments.length,
        pendingAmount: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
      };
    });

    return duePayments;
  }

  // Get a single payment by ID
  async getPayment(paymentId: string, userId: string) {
    const payment = await this.prisma.contributionPayment.findUnique({
      where: { id: paymentId },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify access
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId: payment.subscription.plan.cooperativeId,
        userId,
        status: 'active',
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const isAdmin = member.role === 'admin';
    const isOwner = payment.member.userId === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only view your own payments');
    }

    return payment;
  }

  // ==================== PAYMENT SCHEDULE METHODS ====================

  // Generate payment schedules for a subscription
  async generatePaymentSchedules(
    subscriptionId: string,
    plan: {
      frequency: string | null;
      startDate?: Date | null;
      endDate?: Date | null;
      contributionType: string;
    },
    amount: number,
    monthsAhead: number = 12
  ) {
    // Default to monthly if no frequency specified
    const frequency = plan.frequency || 'monthly';
    const startDate = plan.startDate ? new Date(plan.startDate) : new Date();
    const now = new Date();
    
    // Start from subscription date or plan start date, whichever is later
    const scheduleStart = startDate > now ? startDate : now;
    
    // Determine end date
    let scheduleEnd: Date;
    if (plan.contributionType === 'period' && plan.endDate) {
      scheduleEnd = new Date(plan.endDate);
    } else {
      // For continuous plans, generate schedules for X months ahead
      scheduleEnd = new Date(scheduleStart);
      scheduleEnd.setMonth(scheduleEnd.getMonth() + monthsAhead);
    }

    const schedules: {
      subscriptionId: string;
      dueDate: Date;
      amount: number;
      periodNumber: number;
      periodLabel: string;
      status: string;
    }[] = [];

    let currentDate = new Date(scheduleStart);
    let periodNumber = 1;

    while (currentDate <= scheduleEnd) {
      const periodLabel = this.getPeriodLabel(currentDate, frequency);
      
      schedules.push({
        subscriptionId,
        dueDate: new Date(currentDate),
        amount,
        periodNumber,
        periodLabel,
        status: 'pending',
      });

      // Move to next period based on frequency
      currentDate = this.getNextDueDate(currentDate, frequency);
      periodNumber++;

      // Safety limit to prevent infinite loops
      if (periodNumber > 365) break;
    }

    // Bulk create schedules
    if (schedules.length > 0) {
      await this.prisma.paymentSchedule.createMany({
        data: schedules,
        skipDuplicates: true,
      });
    }

    return schedules.length;
  }

  // Get the next due date based on frequency
  private getNextDueDate(currentDate: Date, frequency: string): Date {
    const nextDate = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
    }
    
    return nextDate;
  }

  // Generate a human-readable period label
  private getPeriodLabel(date: Date, frequency: string): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    switch (frequency) {
      case 'daily':
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      case 'weekly':
      case 'biweekly':
        const weekNum = this.getWeekNumber(date);
        return `Week ${weekNum}, ${date.getFullYear()}`;
      case 'monthly':
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      case 'yearly':
        return `Year ${date.getFullYear()}`;
      default:
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
  }

  // Get ISO week number
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Get payment schedules for a subscription
  async getSubscriptionSchedules(subscriptionId: string, userId: string) {
    const subscription = await this.prisma.contributionSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        member: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Verify access
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId: subscription.plan.cooperativeId,
        userId,
        status: 'active',
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    const isAdmin = member.role === 'admin';
    const isOwner = subscription.member.userId === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only view your own schedules');
    }

    // Get schedules with on-demand overdue calculation
    const schedules = await this.prisma.paymentSchedule.findMany({
      where: { subscriptionId },
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            status: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Update overdue status on-demand
    const now = new Date();
    return schedules.map((schedule) => ({
      ...schedule,
      // Calculate real-time overdue status
      isOverdue: schedule.status === 'pending' && new Date(schedule.dueDate) < now,
      daysOverdue: schedule.status === 'pending' && new Date(schedule.dueDate) < now
        ? Math.floor((now.getTime() - new Date(schedule.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    }));
  }

  // Get all schedules for a member in a cooperative (with overdue calculation)
  async getMemberSchedules(cooperativeId: string, userId: string, status?: string) {
    const member = await this.verifyMember(cooperativeId, userId);

    const whereClause: any = {
      subscription: {
        memberId: member.id,
        plan: {
          cooperativeId,
        },
      },
    };

    if (status) {
      whereClause.status = status;
    }

    const schedules = await this.prisma.paymentSchedule.findMany({
      where: whereClause,
      include: {
        subscription: {
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
        payment: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            status: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Update overdue status on-demand
    const now = new Date();
    return schedules.map((schedule) => ({
      ...schedule,
      isOverdue: schedule.status === 'pending' && new Date(schedule.dueDate) < now,
      daysOverdue: schedule.status === 'pending' && new Date(schedule.dueDate) < now
        ? Math.floor((now.getTime() - new Date(schedule.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    }));
  }

  // Get overdue schedules for a cooperative (requires CONTRIBUTIONS_VIEW permission)
  async getOverdueSchedules(cooperativeId: string, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.CONTRIBUTIONS_VIEW, 'You do not have permission to view overdue schedules');

    const now = new Date();

    const schedules = await this.prisma.paymentSchedule.findMany({
      where: {
        status: 'pending',
        dueDate: { lt: now },
        subscription: {
          status: 'active',
          plan: {
            cooperativeId,
          },
        },
      },
      include: {
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                frequency: true,
              },
            },
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
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return schedules.map((schedule) => ({
      ...schedule,
      daysOverdue: Math.floor((now.getTime() - new Date(schedule.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  // Extend schedules for continuous subscriptions (can be called periodically or on-demand)
  async extendSchedulesIfNeeded(subscriptionId: string) {
    const subscription = await this.prisma.contributionSubscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription || subscription.status !== 'active') {
      return 0;
    }

    // Only extend for continuous plans
    if (subscription.plan.contributionType !== 'continuous') {
      return 0;
    }

    // Find the latest schedule
    const latestSchedule = await this.prisma.paymentSchedule.findFirst({
      where: { subscriptionId },
      orderBy: { dueDate: 'desc' },
    });

    if (!latestSchedule) {
      // No schedules exist, generate from scratch
      return this.generatePaymentSchedules(
        subscriptionId,
        subscription.plan,
        subscription.amount,
        12
      );
    }

    // Check if we need to extend (if latest schedule is within 3 months)
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    if (new Date(latestSchedule.dueDate) < threeMonthsFromNow) {
      // Default to monthly if no frequency specified
      const frequency = subscription.plan.frequency || 'monthly';
      // Generate more schedules starting from the last one
      const startDate = this.getNextDueDate(new Date(latestSchedule.dueDate), frequency);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 12);

      const schedules: any[] = [];
      let currentDate = new Date(startDate);
      let periodNumber = latestSchedule.periodNumber + 1;

      while (currentDate <= endDate) {
        schedules.push({
          subscriptionId,
          dueDate: new Date(currentDate),
          amount: subscription.amount,
          periodNumber,
          periodLabel: this.getPeriodLabel(currentDate, frequency),
          status: 'pending',
        });

        currentDate = this.getNextDueDate(currentDate, frequency);
        periodNumber++;

        if (periodNumber > latestSchedule.periodNumber + 365) break;
      }

      if (schedules.length > 0) {
        await this.prisma.paymentSchedule.createMany({
          data: schedules,
          skipDuplicates: true,
        });
      }

      return schedules.length;
    }

    return 0;
  }

  // Record payment against a schedule
  async recordSchedulePayment(
    scheduleId: string,
    dto: RecordPaymentDto,
    userId: string
  ) {
    const schedule = await this.prisma.paymentSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        subscription: {
          include: {
            plan: true,
            member: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Payment schedule not found');
    }

    // Verify the user owns this subscription
    if (schedule.subscription.member.userId !== userId) {
      throw new ForbiddenException('You can only record payments for your own subscriptions');
    }

    if (schedule.subscription.status !== 'active') {
      throw new BadRequestException('Cannot record payment for an inactive subscription');
    }

    if (schedule.status === 'paid') {
      throw new BadRequestException('This schedule has already been paid');
    }

    // Create payment linked to this schedule
    const payment = await this.prisma.contributionPayment.create({
      data: {
        subscriptionId: schedule.subscriptionId,
        memberId: schedule.subscription.memberId,
        amount: dto.amount,
        paymentDate: new Date(),
        dueDate: schedule.dueDate,
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference,
        receiptUrl: dto.receiptUrl,
        notes: dto.notes,
        status: 'pending',
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
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
    });

    // Link payment to schedule (update schedule status when payment is approved)
    await this.prisma.paymentSchedule.update({
      where: { id: scheduleId },
      data: {
        paymentId: payment.id,
        // Don't mark as paid yet - wait for approval
      },
    });

    // Log activity
    await this.activitiesService.log(
      userId,
      'contribution.payment.record',
      `Recorded payment of ${dto.amount} for ${schedule.subscription.plan.name} (${schedule.periodLabel})`,
      schedule.subscription.plan.cooperativeId,
      { paymentId: payment.id, scheduleId, amount: dto.amount, periodLabel: schedule.periodLabel },
    );

    return payment;
  }

  // Update schedule status when payment is approved (called from approvePayment)
  private async updateScheduleOnPaymentApproval(paymentId: string, amount: number) {
    const schedule = await this.prisma.paymentSchedule.findFirst({
      where: { paymentId },
    });

    if (schedule) {
      const newPaidAmount = schedule.paidAmount + amount;
      const isPaid = newPaidAmount >= schedule.amount;

      await this.prisma.paymentSchedule.update({
        where: { id: schedule.id },
        data: {
          paidAmount: newPaidAmount,
          status: isPaid ? 'paid' : 'partial',
          paidAt: isPaid ? new Date() : null,
        },
      });
    }
  }

  // ==================== BULK APPROVAL METHODS ====================

  // Get schedules for bulk approval preview (requires CONTRIBUTIONS_BULK_APPROVE permission)
  async getBulkApprovalPreview(
    cooperativeId: string,
    month: number,
    year: number,
    userId: string,
    planId?: string,
  ) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.CONTRIBUTIONS_BULK_APPROVE, 'You do not have permission to access bulk approval');

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const whereClause: any = {
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
      status: { in: ['pending', 'overdue'] },
      subscription: {
        plan: {
          cooperativeId,
        },
        status: 'active',
      },
    };

    if (planId) {
      whereClause.subscription.planId = planId;
    }

    const schedules = await this.prisma.paymentSchedule.findMany({
      where: whereClause,
      include: {
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { subscription: { member: { user: { firstName: 'asc' } } } },
        { dueDate: 'asc' },
      ],
    });

    // Group by member for easier viewing
    const groupedByMember = schedules.reduce((acc, schedule) => {
      const memberId = schedule.subscription.memberId;
      if (!acc[memberId]) {
        acc[memberId] = {
          member: schedule.subscription.member,
          schedules: [],
          totalAmount: 0,
        };
      }
      acc[memberId].schedules.push(schedule);
      acc[memberId].totalAmount += schedule.amount;
      return acc;
    }, {} as Record<string, { member: any; schedules: any[]; totalAmount: number }>);

    return {
      month,
      year,
      monthLabel: new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
      totalSchedules: schedules.length,
      totalAmount: schedules.reduce((sum, s) => sum + s.amount, 0),
      memberCount: Object.keys(groupedByMember).length,
      members: Object.values(groupedByMember),
    };
  }

  // Bulk approve schedules for a month (requires CONTRIBUTIONS_BULK_APPROVE permission)
  async bulkApproveSchedules(
    cooperativeId: string,
    dto: {
      month: number;
      year: number;
      planId?: string;
      excludeMemberIds?: string[];
      paymentMethod?: string;
      notes?: string;
    },
    userId: string,
  ) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.CONTRIBUTIONS_BULK_APPROVE, 'You do not have permission to bulk approve payments');

    // Calculate date range for the month
    const startDate = new Date(dto.year, dto.month - 1, 1);
    const endDate = new Date(dto.year, dto.month, 0, 23, 59, 59, 999);

    const whereClause: any = {
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
      status: { in: ['pending', 'overdue'] },
      subscription: {
        plan: {
          cooperativeId,
        },
        status: 'active',
      },
    };

    if (dto.planId) {
      whereClause.subscription.planId = dto.planId;
    }

    if (dto.excludeMemberIds && dto.excludeMemberIds.length > 0) {
      whereClause.subscription.memberId = {
        notIn: dto.excludeMemberIds,
      };
    }

    const schedules = await this.prisma.paymentSchedule.findMany({
      where: whereClause,
      include: {
        subscription: {
          include: {
            plan: true,
            member: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (schedules.length === 0) {
      return {
        success: true,
        message: 'No pending schedules found for the specified criteria',
        approvedCount: 0,
        totalAmount: 0,
      };
    }

    const monthLabel = new Date(dto.year, dto.month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    let approvedCount = 0;
    let totalAmount = 0;

    // Process each schedule in a transaction
    for (const schedule of schedules) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Create payment record
          const payment = await tx.contributionPayment.create({
            data: {
              subscriptionId: schedule.subscriptionId,
              memberId: schedule.subscription.memberId,
              amount: schedule.amount,
              paymentDate: new Date(),
              dueDate: schedule.dueDate,
              paymentMethod: dto.paymentMethod || 'bulk_approval',
              notes: dto.notes || `Bulk approved for ${monthLabel}`,
              status: 'approved',
              approvedBy: userId,
              approvedAt: new Date(),
            },
          });

          // Update schedule
          await tx.paymentSchedule.update({
            where: { id: schedule.id },
            data: {
              status: 'paid',
              paidAmount: schedule.amount,
              paidAt: new Date(),
              paymentId: payment.id,
            },
          });

          // Update subscription totalPaid
          await tx.contributionSubscription.update({
            where: { id: schedule.subscriptionId },
            data: {
              totalPaid: {
                increment: schedule.amount,
              },
            },
          });

          // Update member's virtual balance
          await tx.member.update({
            where: { id: schedule.subscription.memberId },
            data: {
              virtualBalance: {
                increment: schedule.amount,
              },
            },
          });

          // Update cooperative's total contributions
          await tx.cooperative.update({
            where: { id: cooperativeId },
            data: {
              totalContributions: {
                increment: schedule.amount,
              },
            },
          });

          // Get updated member for ledger
          const member = await tx.member.findUnique({
            where: { id: schedule.subscription.memberId },
          });

          // Create ledger entry
          await tx.ledgerEntry.create({
            data: {
              cooperativeId,
              memberId: schedule.subscription.memberId,
              type: 'contribution',
              amount: schedule.amount,
              balanceAfter: member!.virtualBalance,
              referenceId: payment.id,
              referenceType: 'contribution_payment',
              description: `Bulk approved contribution for "${schedule.subscription.plan.name}" - ${schedule.periodLabel || monthLabel}`,
              createdBy: userId,
            },
          });

          approvedCount++;
          totalAmount += schedule.amount;
        });
      } catch (error) {
        // Log error but continue with other schedules
        console.error(`Failed to approve schedule ${schedule.id}:`, error);
      }
    }

    // Log activity
    await this.activitiesService.log(
      userId,
      'contribution.bulk_approve',
      `Bulk approved ${approvedCount} contribution schedules for ${monthLabel} (₦${totalAmount.toLocaleString()})`,
      cooperativeId,
      { month: dto.month, year: dto.year, approvedCount, totalAmount, excludedMembers: dto.excludeMemberIds?.length || 0 },
    );

    return {
      success: true,
      message: `Successfully approved ${approvedCount} schedules`,
      approvedCount,
      totalAmount,
      monthLabel,
    };
  }

  // ==================== DATE-BASED BULK APPROVAL METHODS ====================

  // Get unique schedule dates for a specific plan
  async getPlanScheduleDates(
    cooperativeId: string,
    planId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.CONTRIBUTIONS_BULK_APPROVE, 'You do not have permission to access bulk approval');

    // Verify plan belongs to cooperative
    const plan = await this.prisma.contributionPlan.findFirst({
      where: { id: planId, cooperativeId },
    });

    if (!plan) {
      throw new NotFoundException('Contribution plan not found in this cooperative');
    }

    // Default date range: 6 months back to 6 months ahead
    const now = new Date();
    const defaultStart = startDate || new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const defaultEnd = endDate || new Date(now.getFullYear(), now.getMonth() + 6, 0, 23, 59, 59, 999);

    // Get unique schedule dates with their status counts
    const scheduleDates = await this.prisma.paymentSchedule.groupBy({
      by: ['dueDate'],
      where: {
        subscription: {
          planId,
          status: 'active',
        },
        dueDate: {
          gte: defaultStart,
          lte: defaultEnd,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Get more details for each date
    const datesWithDetails = await Promise.all(
      scheduleDates.map(async (dateGroup) => {
        const [pendingCount, paidCount] = await Promise.all([
          this.prisma.paymentSchedule.count({
            where: {
              subscription: { planId, status: 'active' },
              dueDate: dateGroup.dueDate,
              status: { in: ['pending', 'overdue'] },
            },
          }),
          this.prisma.paymentSchedule.count({
            where: {
              subscription: { planId, status: 'active' },
              dueDate: dateGroup.dueDate,
              status: 'paid',
            },
          }),
        ]);

        const totalAmount = await this.prisma.paymentSchedule.aggregate({
          where: {
            subscription: { planId, status: 'active' },
            dueDate: dateGroup.dueDate,
            status: { in: ['pending', 'overdue'] },
          },
          _sum: {
            amount: true,
          },
        });

        return {
          date: dateGroup.dueDate,
          totalMembers: dateGroup._count.id,
          pendingCount,
          paidCount,
          pendingAmount: totalAmount._sum.amount || 0,
          isPast: dateGroup.dueDate < now,
          isToday: dateGroup.dueDate.toDateString() === now.toDateString(),
        };
      })
    );

    return {
      plan: {
        id: plan.id,
        name: plan.name,
        frequency: plan.frequency,
        amount: plan.fixedAmount,
        amountType: plan.amountType,
      },
      scheduleDates: datesWithDetails,
    };
  }

  // Get members for a specific schedule date
  async getMembersForScheduleDate(
    cooperativeId: string,
    planId: string,
    scheduleDate: Date,
    userId: string,
  ) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.CONTRIBUTIONS_BULK_APPROVE, 'You do not have permission to access bulk approval');

    // Verify plan belongs to cooperative
    const plan = await this.prisma.contributionPlan.findFirst({
      where: { id: planId, cooperativeId },
    });

    if (!plan) {
      throw new NotFoundException('Contribution plan not found in this cooperative');
    }

    // Set time range for the date (start of day to end of day)
    const startOfDay = new Date(scheduleDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduleDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all active subscriptions for this plan
    const activeSubscriptions = await this.prisma.contributionSubscription.findMany({
      where: {
        planId,
        status: 'active',
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
                avatarUrl: true,
              },
            },
          },
        },
        schedules: {
          where: {
            dueDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      },
    });

    // Build member list including those with and without schedules
    const membersWithSchedules: any[] = [];
    const membersWithoutSchedules: any[] = [];

    for (const subscription of activeSubscriptions) {
      const schedule = subscription.schedules[0]; // Should be at most one per date
      const memberInfo = {
        id: subscription.member.id,
        firstName: subscription.member.isOfflineMember 
          ? subscription.member.firstName 
          : subscription.member.user?.firstName,
        lastName: subscription.member.isOfflineMember 
          ? subscription.member.lastName 
          : subscription.member.user?.lastName,
        email: subscription.member.isOfflineMember 
          ? subscription.member.email 
          : subscription.member.user?.email,
        avatarUrl: subscription.member.user?.avatarUrl,
        isOfflineMember: subscription.member.isOfflineMember,
      };

      if (schedule) {
        // Member has a schedule for this date
        membersWithSchedules.push({
          scheduleId: schedule.id,
          subscriptionId: subscription.id,
          memberId: subscription.memberId,
          member: memberInfo,
          amount: schedule.amount,
          status: schedule.status,
          paidAmount: schedule.paidAmount,
          paidAt: schedule.paidAt,
          hasSchedule: true,
        });
      } else {
        // Member has active subscription but no schedule for this date
        // Use subscription amount or plan's fixed amount
        const amount = subscription.amount || plan.fixedAmount || 0;
        membersWithoutSchedules.push({
          scheduleId: null,
          subscriptionId: subscription.id,
          memberId: subscription.memberId,
          member: memberInfo,
          amount: amount,
          status: 'missing', // Special status for missing schedules
          paidAmount: 0,
          paidAt: null,
          hasSchedule: false,
        });
      }
    }

    // Combine and sort by name
    const allMembers = [...membersWithSchedules, ...membersWithoutSchedules].sort((a, b) => {
      const nameA = `${a.member.firstName || ''} ${a.member.lastName || ''}`.toLowerCase();
      const nameB = `${b.member.firstName || ''} ${b.member.lastName || ''}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const pendingMembers = allMembers.filter(m => m.status === 'pending' || m.status === 'overdue' || m.status === 'missing');
    const paidMembers = allMembers.filter(m => m.status === 'paid');
    const missingScheduleCount = membersWithoutSchedules.length;

    return {
      plan: {
        id: plan.id,
        name: plan.name,
        frequency: plan.frequency,
        amount: plan.fixedAmount,
        amountType: plan.amountType,
      },
      scheduleDate: startOfDay,
      periodLabel: membersWithSchedules[0]?.periodLabel || null,
      totalMembers: allMembers.length,
      pendingCount: pendingMembers.length,
      paidCount: paidMembers.length,
      missingScheduleCount,
      totalPendingAmount: pendingMembers.reduce((sum, m) => sum + m.amount, 0),
      members: allMembers,
    };
  }

  // Bulk approve schedules for a specific date
  async bulkApproveByDate(
    cooperativeId: string,
    dto: {
      planId: string;
      scheduleDate: string;
      excludeMemberIds?: string[];
      includeMissingSchedules?: boolean; // New option to include members without schedules
      paymentMethod?: string;
      notes?: string;
    },
    userId: string,
  ) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.CONTRIBUTIONS_BULK_APPROVE, 'You do not have permission to bulk approve payments');

    // Verify plan belongs to cooperative
    const plan = await this.prisma.contributionPlan.findFirst({
      where: { id: dto.planId, cooperativeId },
    });

    if (!plan) {
      throw new NotFoundException('Contribution plan not found in this cooperative');
    }

    const scheduleDate = new Date(dto.scheduleDate);
    const startOfDay = new Date(scheduleDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduleDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build where clause for existing schedules
    const whereClause: any = {
      dueDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: { in: ['pending', 'overdue'] },
      subscription: {
        planId: dto.planId,
        status: 'active',
      },
    };

    if (dto.excludeMemberIds && dto.excludeMemberIds.length > 0) {
      whereClause.subscription.memberId = {
        notIn: dto.excludeMemberIds,
      };
    }

    const existingSchedules = await this.prisma.paymentSchedule.findMany({
      where: whereClause,
      include: {
        subscription: {
          include: {
            plan: true,
            member: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Get members with active subscriptions but no schedule for this date (missing schedules)
    let membersWithMissingSchedules: any[] = [];
    if (dto.includeMissingSchedules !== false) {
      // Get all active subscriptions for this plan
      const subscriptionsWithoutSchedule = await this.prisma.contributionSubscription.findMany({
        where: {
          planId: dto.planId,
          status: 'active',
          ...(dto.excludeMemberIds && dto.excludeMemberIds.length > 0 
            ? { memberId: { notIn: dto.excludeMemberIds } } 
            : {}),
          // Exclude subscriptions that already have a schedule for this date
          schedules: {
            none: {
              dueDate: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
          },
        },
        include: {
          plan: true,
          member: {
            include: {
              user: true,
            },
          },
        },
      });

      membersWithMissingSchedules = subscriptionsWithoutSchedule;
    }

    const totalToProcess = existingSchedules.length + membersWithMissingSchedules.length;

    if (totalToProcess === 0) {
      return {
        success: true,
        message: 'No pending schedules or members found for the specified date',
        approvedCount: 0,
        createdSchedulesCount: 0,
        totalAmount: 0,
      };
    }

    const dateLabel = scheduleDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    // Generate period label based on frequency
    let periodLabel = dateLabel;
    if (plan.frequency === 'monthly') {
      periodLabel = scheduleDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (plan.frequency === 'weekly') {
      const weekNumber = Math.ceil(scheduleDate.getDate() / 7);
      periodLabel = `Week ${weekNumber}, ${scheduleDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    } else if (plan.frequency === 'yearly') {
      periodLabel = scheduleDate.getFullYear().toString();
    }

    // Calculate next period number for new schedules
    const maxPeriodNumber = await this.prisma.paymentSchedule.aggregate({
      where: {
        subscription: {
          planId: dto.planId,
        },
      },
      _max: {
        periodNumber: true,
      },
    });
    let nextPeriodNumber = (maxPeriodNumber._max.periodNumber || 0) + 1;
    
    let approvedCount = 0;
    let createdSchedulesCount = 0;
    let totalAmount = 0;

    // Process existing schedules
    for (const schedule of existingSchedules) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Create payment record
          const payment = await tx.contributionPayment.create({
            data: {
              subscriptionId: schedule.subscriptionId,
              memberId: schedule.subscription.memberId,
              amount: schedule.amount,
              paymentDate: new Date(),
              dueDate: schedule.dueDate,
              paymentMethod: dto.paymentMethod || 'bulk_approval',
              notes: dto.notes || `Bulk approved for ${plan.name} - ${dateLabel}`,
              status: 'approved',
              approvedBy: userId,
              approvedAt: new Date(),
            },
          });

          // Update schedule
          await tx.paymentSchedule.update({
            where: { id: schedule.id },
            data: {
              status: 'paid',
              paidAmount: schedule.amount,
              paidAt: new Date(),
              paymentId: payment.id,
            },
          });

          // Update subscription totalPaid
          await tx.contributionSubscription.update({
            where: { id: schedule.subscriptionId },
            data: {
              totalPaid: {
                increment: schedule.amount,
              },
            },
          });

          // Update member's virtual balance
          await tx.member.update({
            where: { id: schedule.subscription.memberId },
            data: {
              virtualBalance: {
                increment: schedule.amount,
              },
            },
          });

          // Update cooperative's total contributions
          await tx.cooperative.update({
            where: { id: cooperativeId },
            data: {
              totalContributions: {
                increment: schedule.amount,
              },
            },
          });

          // Get updated member for ledger
          const memberRecord = await tx.member.findUnique({
            where: { id: schedule.subscription.memberId },
          });

          // Create ledger entry
          await tx.ledgerEntry.create({
            data: {
              cooperativeId,
              memberId: schedule.subscription.memberId,
              type: 'contribution',
              amount: schedule.amount,
              balanceAfter: memberRecord!.virtualBalance,
              referenceId: payment.id,
              referenceType: 'contribution_payment',
              description: `Bulk approved contribution for "${plan.name}" - ${schedule.periodLabel || dateLabel}`,
              createdBy: userId,
            },
          });

          approvedCount++;
          totalAmount += schedule.amount;
        });
      } catch (error) {
        // Log error but continue with other schedules
        console.error(`Failed to approve schedule ${schedule.id}:`, error);
      }
    }

    // Process members with missing schedules - create schedule and approve
    for (const subscription of membersWithMissingSchedules) {
      try {
        const amount = subscription.amount || plan.fixedAmount || 0;
        
        await this.prisma.$transaction(async (tx) => {
          // Create the missing schedule
          const newSchedule = await tx.paymentSchedule.create({
            data: {
              subscriptionId: subscription.id,
              dueDate: scheduleDate,
              amount: amount,
              periodNumber: nextPeriodNumber,
              periodLabel: periodLabel,
              status: 'paid', // Mark as paid immediately
              paidAmount: amount,
              paidAt: new Date(),
            },
          });

          // Create payment record
          const payment = await tx.contributionPayment.create({
            data: {
              subscriptionId: subscription.id,
              memberId: subscription.memberId,
              amount: amount,
              paymentDate: new Date(),
              dueDate: scheduleDate,
              paymentMethod: dto.paymentMethod || 'bulk_approval',
              notes: dto.notes || `Bulk approved (schedule created) for ${plan.name} - ${dateLabel}`,
              status: 'approved',
              approvedBy: userId,
              approvedAt: new Date(),
            },
          });

          // Link payment to schedule
          await tx.paymentSchedule.update({
            where: { id: newSchedule.id },
            data: { paymentId: payment.id },
          });

          // Update subscription totalPaid
          await tx.contributionSubscription.update({
            where: { id: subscription.id },
            data: {
              totalPaid: {
                increment: amount,
              },
            },
          });

          // Update member's virtual balance
          await tx.member.update({
            where: { id: subscription.memberId },
            data: {
              virtualBalance: {
                increment: amount,
              },
            },
          });

          // Update cooperative's total contributions
          await tx.cooperative.update({
            where: { id: cooperativeId },
            data: {
              totalContributions: {
                increment: amount,
              },
            },
          });

          // Get updated member for ledger
          const memberRecord = await tx.member.findUnique({
            where: { id: subscription.memberId },
          });

          // Create ledger entry
          await tx.ledgerEntry.create({
            data: {
              cooperativeId,
              memberId: subscription.memberId,
              type: 'contribution',
              amount: amount,
              balanceAfter: memberRecord!.virtualBalance,
              referenceId: payment.id,
              referenceType: 'contribution_payment',
              description: `Bulk approved contribution (schedule created) for "${plan.name}" - ${periodLabel}`,
              createdBy: userId,
            },
          });

          approvedCount++;
          createdSchedulesCount++;
          totalAmount += amount;
          nextPeriodNumber++;
        });
      } catch (error) {
        // Log error but continue with other members
        console.error(`Failed to create and approve schedule for subscription ${subscription.id}:`, error);
      }
    }

    // Log activity
    await this.activitiesService.log(
      userId,
      'contribution.bulk_approve',
      `Bulk approved ${approvedCount} contribution schedules for "${plan.name}" on ${dateLabel} (₦${totalAmount.toLocaleString()})${createdSchedulesCount > 0 ? ` - ${createdSchedulesCount} schedules created` : ''}`,
      cooperativeId,
      { 
        planId: dto.planId, 
        scheduleDate: dto.scheduleDate, 
        approvedCount, 
        createdSchedulesCount,
        totalAmount, 
        excludedMembers: dto.excludeMemberIds?.length || 0 
      },
    );

    return {
      success: true,
      message: `Successfully approved ${approvedCount} schedules${createdSchedulesCount > 0 ? ` (${createdSchedulesCount} new schedules created)` : ''}`,
      approvedCount,
      createdSchedulesCount,
      totalAmount,
      planName: plan.name,
      dateLabel,
    };
  }
}
