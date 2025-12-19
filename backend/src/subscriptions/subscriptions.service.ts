import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { 
  InitializeSubscriptionDto, 
  VerifyPaymentDto, 
  ChangePlanDto, 
  CancelSubscriptionDto,
  BillingCycle 
} from './dto/subscription.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private paystackService: PaystackService,
    private activitiesService: ActivitiesService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Get all available subscription plans
   */
  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get a single plan by ID
   */
  async getPlan(planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  /**
   * Get subscription for a cooperative
   */
  async getSubscription(cooperativeId: string, userId: string) {
    // Verify user is admin of the cooperative
    await this.verifyCooperativeAdmin(cooperativeId, userId);

    const subscription = await this.prisma.subscription.findUnique({
      where: { cooperativeId },
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return subscription;
  }

  /**
   * Initialize subscription payment
   */
  async initializeSubscription(dto: InitializeSubscriptionDto, userId: string) {
    // Verify user is admin of the cooperative
    const adminMember = await this.verifyCooperativeAdmin(dto.cooperativeId, userId);

    // Get the plan
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan not found or not active');
    }

    // Check if cooperative already has an active subscription
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { cooperativeId: dto.cooperativeId },
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      throw new BadRequestException(
        'Cooperative already has an active subscription. Please upgrade or cancel first.'
      );
    }

    // Get user details for payment
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate amount based on billing cycle
    const billingCycle = dto.billingCycle || BillingCycle.MONTHLY;
    const amount = billingCycle === BillingCycle.YEARLY ? plan.yearlyPrice : plan.monthlyPrice;

    // If it's a free plan, just create the subscription
    if (amount === 0) {
      return this.createFreeSubscription(dto.cooperativeId, plan.id, userId);
    }

    // Generate unique reference
    const reference = `sub_${randomBytes(16).toString('hex')}`;

    // Initialize Paystack transaction
    const cooperative = await this.prisma.cooperative.findUnique({
      where: { id: dto.cooperativeId },
    });

    const transaction = await this.paystackService.initializeTransaction({
      email: user.email,
      amount,
      reference,
      metadata: {
        cooperativeId: dto.cooperativeId,
        cooperativeName: cooperative?.name,
        planId: plan.id,
        planName: plan.name,
        billingCycle,
        userId,
        type: 'subscription',
      },
      callbackUrl: dto.callbackUrl,
    });

    // Store pending payment record
    const periodStart = new Date();
    const periodEnd = this.calculatePeriodEnd(periodStart, billingCycle);

    // Create or update subscription as pending
    await this.prisma.subscription.upsert({
      where: { cooperativeId: dto.cooperativeId },
      create: {
        cooperativeId: dto.cooperativeId,
        planId: plan.id,
        status: 'pending',
        billingCycle,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        createdBy: userId,
      },
      update: {
        planId: plan.id,
        status: 'pending',
        billingCycle,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    });

    // Create payment record
    await this.prisma.subscriptionPayment.create({
      data: {
        subscription: {
          connect: { cooperativeId: dto.cooperativeId },
        },
        amount,
        paystackReference: reference,
        periodStart,
        periodEnd,
        metadata: {
          planName: plan.displayName,
          billingCycle,
        },
      },
    });

    return {
      requiresPayment: true,
      authorizationUrl: transaction.authorization_url,
      accessCode: transaction.access_code,
      reference: transaction.reference,
    };
  }

  /**
   * Create a free subscription
   */
  private async createFreeSubscription(cooperativeId: string, planId: string, userId: string) {
    const periodStart = new Date();
    const periodEnd = new Date('2099-12-31'); // Effectively no expiry for free

    const subscription = await this.prisma.subscription.upsert({
      where: { cooperativeId },
      create: {
        cooperativeId,
        planId,
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        createdBy: userId,
      },
      update: {
        planId,
        status: 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true },
    });

    // Log activity
    await this.activitiesService.log(
      userId,
      'subscription.created',
      `Activated free subscription plan`,
      cooperativeId,
      { planName: subscription.plan.displayName },
    );

    return {
      requiresPayment: false,
      subscription,
      message: 'Free plan activated successfully',
    };
  }

  /**
   * Verify payment and activate subscription
   */
  async verifyPayment(dto: VerifyPaymentDto, userId: string) {
    // Find the payment record
    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { paystackReference: dto.reference },
      include: {
        subscription: {
          include: { plan: true, cooperative: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify with Paystack
    const transaction = await this.paystackService.verifyTransaction(dto.reference);

    if (transaction.status !== 'success') {
      // Update payment as failed
      await this.prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          failureReason: `Payment ${transaction.status}`,
        },
      });

      throw new BadRequestException('Payment was not successful');
    }

    // Verify amount matches
    if (transaction.amount !== payment.amount) {
      throw new BadRequestException('Payment amount mismatch');
    }

    // Update payment record
    await this.prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: {
        status: 'success',
        paystackTransactionId: transaction.id.toString(),
        paystackPaidAt: new Date(transaction.paid_at),
        paystackChannel: transaction.channel,
        cardLast4: transaction.authorization?.last4,
        cardBrand: transaction.authorization?.card_type,
        cardExpMonth: transaction.authorization?.exp_month,
        cardExpYear: transaction.authorization?.exp_year,
      },
    });

    // Activate subscription
    const subscription = await this.prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        status: 'active',
        paystackCustomerCode: transaction.customer.customer_code,
      },
      include: { plan: true, cooperative: true },
    });

    // Log activity
    await this.activitiesService.log(
      userId,
      'subscription.activated',
      `Subscription activated: ${subscription.plan.displayName}`,
      subscription.cooperativeId,
      { planName: subscription.plan.displayName, amount: payment.amount },
    );

    // Notify cooperative admins
    await this.notificationsService.notifyCooperativeAdmins(
      subscription.cooperativeId,
      'subscription_activated',
      'Subscription Activated',
      `Your ${subscription.plan.displayName} subscription is now active until ${subscription.currentPeriodEnd.toLocaleDateString()}.`,
      { subscriptionId: subscription.id },
    );

    return {
      subscription,
      payment: {
        amount: payment.amount,
        reference: payment.paystackReference,
        paidAt: transaction.paid_at,
      },
    };
  }

  /**
   * Handle Paystack webhook events
   */
  async handleWebhook(event: string, data: any, eventId: string) {
    // Check if event already processed (idempotency)
    const existingEvent = await this.prisma.paystackWebhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent?.processed) {
      this.logger.log(`Webhook event ${eventId} already processed`);
      return { message: 'Event already processed' };
    }

    // Store the event
    await this.prisma.paystackWebhookEvent.upsert({
      where: { eventId },
      create: {
        eventId,
        eventType: event,
        payload: data,
      },
      update: {
        payload: data,
      },
    });

    try {
      switch (event) {
        case 'charge.success':
          await this.handleChargeSuccess(data);
          break;
        case 'subscription.create':
          await this.handleSubscriptionCreate(data);
          break;
        case 'subscription.disable':
          await this.handleSubscriptionDisable(data);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(data);
          break;
        default:
          this.logger.log(`Unhandled webhook event: ${event}`);
      }

      // Mark as processed
      await this.prisma.paystackWebhookEvent.update({
        where: { eventId },
        data: { processed: true, processedAt: new Date() },
      });

      return { message: 'Webhook processed successfully' };
    } catch (error: any) {
      // Log error but don't throw (to acknowledge receipt)
      await this.prisma.paystackWebhookEvent.update({
        where: { eventId },
        data: { error: error.message },
      });
      this.logger.error(`Webhook processing error: ${error.message}`);
      return { message: 'Webhook received with errors' };
    }
  }

  private async handleChargeSuccess(data: any) {
    const reference = data.reference;
    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { paystackReference: reference },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for reference: ${reference}`);
      return;
    }

    if (payment.status === 'success') {
      return; // Already processed
    }

    // Update payment
    await this.prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: {
        status: 'success',
        paystackTransactionId: data.id?.toString(),
        paystackPaidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
        paystackChannel: data.channel,
        cardLast4: data.authorization?.last4,
        cardBrand: data.authorization?.card_type,
      },
    });

    // Activate subscription
    await this.prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        status: 'active',
        paystackCustomerCode: data.customer?.customer_code,
      },
    });
  }

  private async handleSubscriptionCreate(data: any) {
    this.logger.log('Subscription created via webhook', data);
  }

  private async handleSubscriptionDisable(data: any) {
    const subscriptionCode = data.subscription_code;
    
    const subscription = await this.prisma.subscription.findFirst({
      where: { paystackSubscriptionCode: subscriptionCode },
    });

    if (subscription) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });
    }
  }

  private async handlePaymentFailed(data: any) {
    const reference = data.reference;
    
    await this.prisma.subscriptionPayment.updateMany({
      where: { paystackReference: reference },
      data: {
        status: 'failed',
        failureReason: data.gateway_response || 'Payment failed',
      },
    });

    // Update subscription status
    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { paystackReference: reference },
      include: { subscription: { include: { cooperative: true } } },
    });

    if (payment) {
      await this.prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: { status: 'past_due' },
      });

      // Notify admins
      await this.notificationsService.notifyCooperativeAdmins(
        payment.subscription.cooperativeId,
        'payment_failed',
        'Subscription Payment Failed',
        'Your subscription payment failed. Please update your payment method to continue using premium features.',
        { subscriptionId: payment.subscriptionId },
      );
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(cooperativeId: string, dto: CancelSubscriptionDto, userId: string) {
    await this.verifyCooperativeAdmin(cooperativeId, userId);

    const subscription = await this.prisma.subscription.findUnique({
      where: { cooperativeId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === 'cancelled') {
      throw new BadRequestException('Subscription is already cancelled');
    }

    // If canceling immediately or it's a free plan
    if (dto.cancelImmediately || subscription.plan.monthlyPrice === 0) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: dto.reason,
        },
      });

      // Downgrade to free plan
      const freePlan = await this.prisma.subscriptionPlan.findUnique({
        where: { name: 'free' },
      });

      if (freePlan) {
        await this.createFreeSubscription(cooperativeId, freePlan.id, userId);
      }
    } else {
      // Cancel at period end
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: true,
          cancelReason: dto.reason,
        },
      });
    }

    // Log activity
    await this.activitiesService.log(
      userId,
      'subscription.cancelled',
      `Cancelled subscription${dto.cancelImmediately ? '' : ' (at period end)'}`,
      cooperativeId,
      { reason: dto.reason },
    );

    return { message: 'Subscription cancelled successfully' };
  }

  /**
   * Change subscription plan (upgrade/downgrade)
   */
  async changePlan(cooperativeId: string, dto: ChangePlanDto, userId: string) {
    await this.verifyCooperativeAdmin(cooperativeId, userId);

    const subscription = await this.prisma.subscription.findUnique({
      where: { cooperativeId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    const newPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.newPlanId },
    });

    if (!newPlan || !newPlan.isActive) {
      throw new NotFoundException('Plan not found or not active');
    }

    if (subscription.planId === dto.newPlanId) {
      throw new BadRequestException('You are already on this plan');
    }

    // For downgrades or free plan, process immediately
    const billingCycle = dto.billingCycle || subscription.billingCycle as BillingCycle;
    const currentAmount = billingCycle === 'yearly' ? subscription.plan.yearlyPrice : subscription.plan.monthlyPrice;
    const newAmount = billingCycle === 'yearly' ? newPlan.yearlyPrice : newPlan.monthlyPrice;

    if (newAmount === 0 || newAmount <= currentAmount) {
      // Downgrade - apply at end of period or immediately for free
      if (newAmount === 0) {
        return this.createFreeSubscription(cooperativeId, newPlan.id, userId);
      }

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: newPlan.id,
          // Keep current period, new plan applies at renewal
        },
      });

      return {
        message: `Plan changed to ${newPlan.displayName}. Changes will apply at next billing period.`,
        subscription: await this.getSubscription(cooperativeId, userId),
      };
    }

    // Upgrade - requires payment for difference
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Calculate prorated amount
    const now = new Date();
    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;
    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const proratedAmount = Math.ceil(((newAmount - currentAmount) * remainingDays) / totalDays);

    const reference = `upgrade_${randomBytes(16).toString('hex')}`;

    const transaction = await this.paystackService.initializeTransaction({
      email: user.email,
      amount: proratedAmount,
      reference,
      metadata: {
        cooperativeId,
        type: 'upgrade',
        fromPlanId: subscription.planId,
        toPlanId: newPlan.id,
        billingCycle,
        userId,
      },
    });

    return {
      authorizationUrl: transaction.authorization_url,
      reference: transaction.reference,
      amount: proratedAmount,
      message: `Pay ₦${(proratedAmount / 100).toLocaleString()} to upgrade to ${newPlan.displayName}`,
    };
  }

  /**
   * Get subscription usage/limits for a cooperative
   */
  async getUsage(cooperativeId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { cooperativeId },
      include: { plan: true },
    });

    // Default to free plan limits if no subscription
    const plan = subscription?.plan || await this.prisma.subscriptionPlan.findUnique({
      where: { name: 'free' },
    });

    if (!plan) {
      throw new NotFoundException('No plan configuration found');
    }

    // Get current usage
    const memberCount = await this.prisma.member.count({
      where: { cooperativeId, status: 'active' },
    });

    const contributionPlanCount = await this.prisma.contributionPlan.count({
      where: { cooperativeId, isActive: true },
    });

    const activeGroupBuys = await this.prisma.groupBuy.count({
      where: { cooperativeId, status: 'active' },
    });

    // Loans this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const loansThisMonth = await this.prisma.loan.count({
      where: {
        cooperativeId,
        requestedAt: { gte: startOfMonth },
      },
    });

    return {
      plan: {
        name: plan.name,
        displayName: plan.displayName,
      },
      subscription: subscription ? {
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      } : null,
      usage: {
        members: { used: memberCount, limit: plan.maxMembers },
        contributionPlans: { used: contributionPlanCount, limit: plan.maxContributionPlans },
        groupBuys: { used: activeGroupBuys, limit: plan.maxGroupBuys },
        loansThisMonth: { used: loansThisMonth, limit: plan.maxLoansPerMonth },
      },
      limits: {
        maxMembers: plan.maxMembers,
        maxContributionPlans: plan.maxContributionPlans,
        maxGroupBuys: plan.maxGroupBuys,
        maxLoansPerMonth: plan.maxLoansPerMonth,
      },
    };
  }

  /**
   * Check if an action is allowed based on subscription limits
   */
  async checkLimit(cooperativeId: string, limitType: 'members' | 'contributionPlans' | 'groupBuys' | 'loans'): Promise<{ allowed: boolean; message?: string }> {
    const usage = await this.getUsage(cooperativeId);

    switch (limitType) {
      case 'members':
        if (usage.usage.members.used >= usage.limits.maxMembers) {
          return { allowed: false, message: `Member limit reached (${usage.limits.maxMembers}). Upgrade to add more members.` };
        }
        break;
      case 'contributionPlans':
        if (usage.usage.contributionPlans.used >= usage.limits.maxContributionPlans) {
          return { allowed: false, message: `Contribution plan limit reached (${usage.limits.maxContributionPlans}). Upgrade to add more plans.` };
        }
        break;
      case 'groupBuys':
        if (usage.limits.maxGroupBuys === 0) {
          return { allowed: false, message: 'Group buys are not available on your current plan. Upgrade to enable this feature.' };
        }
        if (usage.usage.groupBuys.used >= usage.limits.maxGroupBuys) {
          return { allowed: false, message: `Active group buy limit reached (${usage.limits.maxGroupBuys}). Upgrade to create more.` };
        }
        break;
      case 'loans':
        if (usage.limits.maxLoansPerMonth === 0) {
          return { allowed: false, message: 'Loans are not available on your current plan. Upgrade to enable this feature.' };
        }
        if (usage.usage.loansThisMonth.used >= usage.limits.maxLoansPerMonth) {
          return { allowed: false, message: `Monthly loan limit reached (${usage.limits.maxLoansPerMonth}). Upgrade to process more loans.` };
        }
        break;
    }

    return { allowed: true };
  }

  /**
   * Get Paystack public key for frontend
   */
  getPaystackPublicKey() {
    return {
      publicKey: this.paystackService.getPublicKey(),
    };
  }

  // Helper methods
  private calculatePeriodEnd(startDate: Date, billingCycle: BillingCycle): Date {
    const endDate = new Date(startDate);
    if (billingCycle === BillingCycle.YEARLY) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    return endDate;
  }

  private async verifyCooperativeAdmin(cooperativeId: string, userId: string) {
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId,
        role: 'admin',
        status: 'active',
      },
    });

    if (!member) {
      throw new ForbiddenException('Only cooperative admins can manage subscriptions');
    }

    return member;
  }
}
