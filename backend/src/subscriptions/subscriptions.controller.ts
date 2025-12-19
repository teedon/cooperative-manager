import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';
import { PaystackService } from './paystack.service';
import {
  InitializeSubscriptionDto,
  VerifyPaymentDto,
  ChangePlanDto,
  CancelSubscriptionDto,
} from './dto/subscription.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly paystackService: PaystackService,
  ) {}

  // ========== PUBLIC ENDPOINTS ==========

  /**
   * Get all available subscription plans
   */
  @Get('plans')
  async getPlans() {
    try {
      const plans = await this.subscriptionsService.getPlans();
      return { success: true, message: 'Plans retrieved successfully', data: plans };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to get plans', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get Paystack public key for frontend integration
   */
  @Get('paystack/public-key')
  async getPaystackPublicKey() {
    try {
      const data = this.subscriptionsService.getPaystackPublicKey();
      return { success: true, message: 'Public key retrieved', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message, data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Paystack webhook handler
   */
  @Post('webhook/paystack')
  async handlePaystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    try {
      const rawBody = req.rawBody?.toString() || JSON.stringify(req.body);
      
      // Verify signature
      if (!this.paystackService.verifyWebhookSignature(rawBody, signature)) {
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }

      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { event, data } = payload;

      // Use a unique event ID for idempotency
      const eventId = data.id?.toString() || `${event}_${Date.now()}`;

      await this.subscriptionsService.handleWebhook(event, data, eventId);

      return { status: 'success' };
    } catch (error: any) {
      // Always return 200 to Paystack to acknowledge receipt
      return { status: 'received', error: error.message };
    }
  }

  // ========== AUTHENTICATED ENDPOINTS ==========

  /**
   * Get subscription for a cooperative
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('cooperative/:cooperativeId')
  async getSubscription(
    @Param('cooperativeId') cooperativeId: string,
    @Request() req: any,
  ) {
    try {
      const subscription = await this.subscriptionsService.getSubscription(
        cooperativeId,
        req.user.id,
      );
      return { success: true, message: 'Subscription retrieved', data: subscription };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to get subscription', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get subscription usage/limits
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('cooperative/:cooperativeId/usage')
  async getUsage(
    @Param('cooperativeId') cooperativeId: string,
  ) {
    try {
      const usage = await this.subscriptionsService.getUsage(cooperativeId);
      return { success: true, message: 'Usage retrieved', data: usage };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to get usage', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Initialize subscription payment
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('initialize')
  async initializeSubscription(
    @Body() dto: InitializeSubscriptionDto,
    @Request() req: any,
  ) {
    try {
      const result = await this.subscriptionsService.initializeSubscription(dto, req.user.id);
      return { success: true, message: 'Payment initialized', data: result };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to initialize payment', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Verify payment and activate subscription
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('verify')
  async verifyPayment(
    @Body() dto: VerifyPaymentDto,
    @Request() req: any,
  ) {
    try {
      const result = await this.subscriptionsService.verifyPayment(dto, req.user.id);
      return { success: true, message: 'Payment verified and subscription activated', data: result };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to verify payment', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Change subscription plan
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('cooperative/:cooperativeId/change-plan')
  async changePlan(
    @Param('cooperativeId') cooperativeId: string,
    @Body() dto: ChangePlanDto,
    @Request() req: any,
  ) {
    try {
      const result = await this.subscriptionsService.changePlan(cooperativeId, dto, req.user.id);
      return { success: true, message: 'Plan change initiated', data: result };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to change plan', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Cancel subscription
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('cooperative/:cooperativeId/cancel')
  async cancelSubscription(
    @Param('cooperativeId') cooperativeId: string,
    @Body() dto: CancelSubscriptionDto,
    @Request() req: any,
  ) {
    try {
      const result = await this.subscriptionsService.cancelSubscription(
        cooperativeId,
        dto,
        req.user.id,
      );
      return { success: true, message: result.message, data: null };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to cancel subscription', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Check a specific limit
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('cooperative/:cooperativeId/check-limit/:limitType')
  async checkLimit(
    @Param('cooperativeId') cooperativeId: string,
    @Param('limitType') limitType: 'members' | 'contributionPlans' | 'groupBuys' | 'loans',
  ) {
    try {
      const result = await this.subscriptionsService.checkLimit(cooperativeId, limitType);
      return { success: true, message: result.allowed ? 'Action allowed' : result.message, data: result };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to check limit', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
