import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContributionsService } from './contributions.service';
import { CreateContributionPlanDto, SubscribeToContributionDto, UpdateSubscriptionDto, RecordPaymentDto, ApprovePaymentDto } from './dto';

@Controller('contributions')
@UseGuards(AuthGuard('jwt'))
export class ContributionsController {
  constructor(private readonly service: ContributionsService) {}

  // Create a contribution plan (admin only)
  @Post('cooperatives/:cooperativeId/plans')
  async createPlan(
    @Param('cooperativeId') cooperativeId: string,
    @Body() dto: CreateContributionPlanDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.createPlan(cooperativeId, dto, req.user.id);
      return { success: true, message: 'Contribution plan created successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to create contribution plan', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get all contribution plans for a cooperative
  @Get('cooperatives/:cooperativeId/plans')
  async getPlans(
    @Param('cooperativeId') cooperativeId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.getPlans(cooperativeId, req.user.id);
      return { success: true, message: 'Contribution plans retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch contribution plans', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get a single contribution plan
  @Get('plans/:planId')
  async getPlan(
    @Param('planId') planId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.getPlan(planId, req.user.id);
      return { success: true, message: 'Contribution plan retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch contribution plan', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Update a contribution plan (admin only)
  @Put('plans/:planId')
  async updatePlan(
    @Param('planId') planId: string,
    @Body() dto: Partial<CreateContributionPlanDto>,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.updatePlan(planId, dto, req.user.id);
      return { success: true, message: 'Contribution plan updated successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update contribution plan', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Delete a contribution plan (admin only)
  @Delete('plans/:planId')
  async deletePlan(
    @Param('planId') planId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.deletePlan(planId, req.user.id);
      return { success: true, message: 'Contribution plan deleted successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to delete contribution plan', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Subscribe to a contribution plan
  @Post('plans/:planId/subscribe')
  async subscribeToPlan(
    @Param('planId') planId: string,
    @Body() dto: SubscribeToContributionDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.subscribeToPlan(planId, dto, req.user.id);
      return { success: true, message: 'Subscribed to contribution plan successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to subscribe to contribution plan', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Update subscription (pause, resume, cancel, change amount)
  @Put('subscriptions/:subscriptionId')
  async updateSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: UpdateSubscriptionDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.updateSubscription(subscriptionId, dto, req.user.id);
      return { success: true, message: 'Subscription updated successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update subscription', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get my subscriptions for a cooperative
  @Get('cooperatives/:cooperativeId/my-subscriptions')
  async getMySubscriptions(
    @Param('cooperativeId') cooperativeId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.getMySubscriptions(cooperativeId, req.user.id);
      return { success: true, message: 'Subscriptions retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch subscriptions', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get all subscriptions for a plan (admin only)
  @Get('plans/:planId/subscriptions')
  async getPlanSubscriptions(
    @Param('planId') planId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.getPlanSubscriptions(planId, req.user.id);
      return { success: true, message: 'Plan subscriptions retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch plan subscriptions', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ==================== PAYMENT ENDPOINTS ====================

  // Record a payment for a subscription
  @Post('subscriptions/:subscriptionId/payments')
  async recordPayment(
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: RecordPaymentDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.recordPayment(subscriptionId, dto, req.user.id);
      return { success: true, message: 'Payment recorded successfully. Awaiting admin approval.', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to record payment', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get payments for a subscription
  @Get('subscriptions/:subscriptionId/payments')
  async getSubscriptionPayments(
    @Param('subscriptionId') subscriptionId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.getSubscriptionPayments(subscriptionId, req.user.id);
      return { success: true, message: 'Payments retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch payments', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get all my payments in a cooperative
  @Get('cooperatives/:cooperativeId/my-payments')
  async getMyPayments(
    @Param('cooperativeId') cooperativeId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.getMyPayments(cooperativeId, req.user.id);
      return { success: true, message: 'Payments retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch payments', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get due payments for a member
  @Get('cooperatives/:cooperativeId/due-payments')
  async getDuePayments(
    @Param('cooperativeId') cooperativeId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.getDuePayments(cooperativeId, req.user.id);
      return { success: true, message: 'Due payments retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch due payments', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get pending payments for admin approval
  @Get('cooperatives/:cooperativeId/pending-payments')
  async getPendingPayments(
    @Param('cooperativeId') cooperativeId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.getPendingPayments(cooperativeId, req.user.id);
      return { success: true, message: 'Pending payments retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch pending payments', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get a single payment
  @Get('payments/:paymentId')
  async getPayment(
    @Param('paymentId') paymentId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.getPayment(paymentId, req.user.id);
      return { success: true, message: 'Payment retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch payment', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Approve or reject a payment (admin only)
  @Put('payments/:paymentId/approve')
  async approvePayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: ApprovePaymentDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.approvePayment(paymentId, dto, req.user.id);
      const message = dto.status === 'approved' 
        ? 'Payment approved successfully' 
        : 'Payment rejected';
      return { success: true, message, data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to process payment', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ==================== SCHEDULE ENDPOINTS ====================

  // Get schedules for a subscription
  @Get('subscriptions/:subscriptionId/schedules')
  async getSubscriptionSchedules(
    @Param('subscriptionId') subscriptionId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.getSubscriptionSchedules(subscriptionId, req.user.id);
      return { success: true, message: 'Schedules retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch schedules', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get member's schedules for a cooperative
  @Get('cooperatives/:cooperativeId/my-schedules')
  async getMySchedules(
    @Param('cooperativeId') cooperativeId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.getMemberSchedules(cooperativeId, req.user.id);
      return { success: true, message: 'Schedules retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch schedules', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get overdue schedules for a cooperative (admin only)
  @Get('cooperatives/:cooperativeId/overdue-schedules')
  async getOverdueSchedules(
    @Param('cooperativeId') cooperativeId: string,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.getOverdueSchedules(cooperativeId, req.user.id);
      return { success: true, message: 'Overdue schedules retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch overdue schedules', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Record payment for a schedule
  @Post('schedules/:scheduleId/payments')
  async recordSchedulePayment(
    @Param('scheduleId') scheduleId: string,
    @Body() dto: RecordPaymentDto,
    @Request() req: any,
  ) {
    try {
      const data = await this.service.recordSchedulePayment(scheduleId, dto, req.user.id);
      return { success: true, message: 'Payment recorded successfully. Awaiting admin approval.', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to record payment', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Extend schedules for a subscription (useful for continuous plans)
  @Post('subscriptions/:subscriptionId/extend-schedules')
  async extendSchedules(
    @Param('subscriptionId') subscriptionId: string,
    @Request() req: any,
  ) {
    try {
      const count = await this.service.extendSchedulesIfNeeded(subscriptionId);
      return { 
        success: true, 
        message: count > 0 ? `Generated ${count} new schedules` : 'No new schedules needed',
        data: { schedulesGenerated: count },
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to extend schedules', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
