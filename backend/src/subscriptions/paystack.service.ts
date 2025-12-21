import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    channel: string;
    paid_at: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
      first_name: string;
      last_name: string;
    };
    authorization: {
      authorization_code: string;
      card_type: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      bin: string;
      bank: string;
      channel: string;
      signature: string;
      reusable: boolean;
      country_code: string;
    };
    metadata: any;
  };
}

interface PaystackCustomerResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    customer_code: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface PaystackSubscriptionResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    subscription_code: string;
    email_token: string;
    status: string;
    next_payment_date: string;
  };
}

interface PaystackPlanResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    plan_code: string;
    name: string;
    amount: number;
    interval: string;
  };
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly client: AxiosInstance;
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY || '';

    if (!this.secretKey) {
      this.logger.warn('PAYSTACK_SECRET_KEY not configured');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Initialize a transaction for subscription payment
   */
  async initializeTransaction(params: {
    email: string;
    amount: number; // Amount in kobo
    reference: string;
    metadata?: Record<string, any>;
    callbackUrl?: string;
    planCode?: string;
  }): Promise<PaystackInitializeResponse['data']> {
    try {
      const payload: any = {
        email: params.email,
        amount: params.amount,
        reference: params.reference,
        currency: 'NGN',
        metadata: params.metadata || {},
      };

      if (params.callbackUrl) {
        payload.callback_url = params.callbackUrl;
      }

      // If plan code is provided, create subscription instead
      if (params.planCode) {
        payload.plan = params.planCode;
      }

      const response = await this.client.post<PaystackInitializeResponse>(
        '/transaction/initialize',
        payload
      );

      if (!response.data.status) {
        throw new BadRequestException(response.data.message);
      }
      // console.log('Paystack initialize response data:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to initialize transaction', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to initialize payment'
      );
    }
  }

  /**
   * Verify a transaction
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse['data']> {
    try {
      const response = await this.client.get<PaystackVerifyResponse>(
        `/transaction/verify/${reference}`
      );

      if (!response.data.status) {
        throw new BadRequestException(response.data.message);
      }

      console.log('Paystack verify response data:', response.data);

      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to verify transaction', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to verify payment'
      );
    }
  }

  /**
   * Create or get a customer
   */
  async createCustomer(params: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<PaystackCustomerResponse['data']> {
    try {
      const response = await this.client.post<PaystackCustomerResponse>('/customer', {
        email: params.email,
        first_name: params.firstName,
        last_name: params.lastName,
        phone: params.phone,
      });

      return response.data.data;
    } catch (error: any) {
      // If customer already exists, fetch them
      if (error.response?.status === 400) {
        return this.getCustomerByEmail(params.email);
      }
      this.logger.error('Failed to create customer', error.response?.data || error.message);
      throw new BadRequestException('Failed to create customer');
    }
  }

  /**
   * Get customer by email
   */
  async getCustomerByEmail(email: string): Promise<PaystackCustomerResponse['data']> {
    try {
      const response = await this.client.get<PaystackCustomerResponse>(
        `/customer/${encodeURIComponent(email)}`
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to get customer', error.response?.data || error.message);
      throw new BadRequestException('Customer not found');
    }
  }

  /**
   * Create a subscription plan on Paystack
   */
  async createPlan(params: {
    name: string;
    amount: number; // Amount in kobo
    interval: 'monthly' | 'yearly' | 'weekly' | 'daily';
    description?: string;
  }): Promise<PaystackPlanResponse['data']> {
    try {
      const response = await this.client.post<PaystackPlanResponse>('/plan', {
        name: params.name,
        amount: params.amount,
        interval: params.interval,
        description: params.description,
        currency: 'NGN',
      });

      if (!response.data.status) {
        throw new BadRequestException(response.data.message);
      }

      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to create plan', error.response?.data || error.message);
      throw new BadRequestException('Failed to create subscription plan');
    }
  }

  /**
   * Create a subscription for a customer
   */
  async createSubscription(params: {
    customerCode: string;
    planCode: string;
    authorizationCode?: string;
    startDate?: string;
  }): Promise<PaystackSubscriptionResponse['data']> {
    try {
      const payload: any = {
        customer: params.customerCode,
        plan: params.planCode,
      };

      if (params.authorizationCode) {
        payload.authorization = params.authorizationCode;
      }

      if (params.startDate) {
        payload.start_date = params.startDate;
      }

      const response = await this.client.post<PaystackSubscriptionResponse>(
        '/subscription',
        payload
      );

      if (!response.data.status) {
        throw new BadRequestException(response.data.message);
      }

      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to create subscription', error.response?.data || error.message);
      throw new BadRequestException('Failed to create subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionCode: string, emailToken: string): Promise<void> {
    try {
      await this.client.post('/subscription/disable', {
        code: subscriptionCode,
        token: emailToken,
      });
    } catch (error: any) {
      this.logger.error('Failed to cancel subscription', error.response?.data || error.message);
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionCode: string): Promise<any> {
    try {
      const response = await this.client.get(`/subscription/${subscriptionCode}`);
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to get subscription', error.response?.data || error.message);
      throw new BadRequestException('Failed to get subscription details');
    }
  }

  /**
   * Charge authorization (for recurring payments)
   */
  async chargeAuthorization(params: {
    email: string;
    amount: number;
    authorizationCode: string;
    reference: string;
    metadata?: Record<string, any>;
  }): Promise<PaystackVerifyResponse['data']> {
    try {
      const response = await this.client.post<PaystackVerifyResponse>(
        '/transaction/charge_authorization',
        {
          email: params.email,
          amount: params.amount,
          authorization_code: params.authorizationCode,
          reference: params.reference,
          currency: 'NGN',
          metadata: params.metadata,
        }
      );

      if (!response.data.status) {
        throw new BadRequestException(response.data.message);
      }

      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to charge authorization', error.response?.data || error.message);
      throw new BadRequestException('Failed to process recurring payment');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }

  /**
   * Get public key for frontend
   */
  getPublicKey(): string {
    return this.publicKey;
  }
}
