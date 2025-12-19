import apiClient from './client';
import { ApiResponse } from '../models';

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  maxMembers: number;
  maxContributionPlans: number;
  maxLoansPerMonth: number;
  maxGroupBuys: number;
  features?: string[];
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
}

export interface Subscription {
  id: string;
  cooperativeId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing' | 'pending';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  payments?: SubscriptionPayment[];
}

export interface SubscriptionPayment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  paystackReference: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  cardLast4?: string;
  cardBrand?: string;
}

export interface SubscriptionUsage {
  plan: {
    name: string;
    displayName: string;
  };
  subscription: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  usage: {
    members: { used: number; limit: number };
    contributionPlans: { used: number; limit: number };
    groupBuys: { used: number; limit: number };
    loansThisMonth: { used: number; limit: number };
  };
  limits: {
    maxMembers: number;
    maxContributionPlans: number;
    maxGroupBuys: number;
    maxLoansPerMonth: number;
  };
}

export interface InitializePaymentResponse {
  requiresPayment: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference?: string;
  subscription?: Subscription;
  message?: string;
}

export const subscriptionApi = {
  // Get all available plans
  getPlans: async (): Promise<ApiResponse<SubscriptionPlan[]>> => {
    const response = await apiClient.get<ApiResponse<SubscriptionPlan[]>>('/subscriptions/plans');
    return response.data;
  },

  // Get Paystack public key
  getPaystackPublicKey: async (): Promise<ApiResponse<{ publicKey: string }>> => {
    const response = await apiClient.get<ApiResponse<{ publicKey: string }>>(
      '/subscriptions/paystack/public-key'
    );
    return response.data;
  },

  // Get subscription for a cooperative
  getSubscription: async (cooperativeId: string): Promise<ApiResponse<Subscription | null>> => {
    const response = await apiClient.get<ApiResponse<Subscription | null>>(
      `/subscriptions/cooperative/${cooperativeId}`
    );
    return response.data;
  },

  // Get subscription usage
  getUsage: async (cooperativeId: string): Promise<ApiResponse<SubscriptionUsage>> => {
    const response = await apiClient.get<ApiResponse<SubscriptionUsage>>(
      `/subscriptions/cooperative/${cooperativeId}/usage`
    );
    return response.data;
  },

  // Initialize subscription payment
  initializeSubscription: async (params: {
    cooperativeId: string;
    planId: string;
    billingCycle?: 'monthly' | 'yearly';
    callbackUrl?: string;
  }): Promise<ApiResponse<InitializePaymentResponse>> => {
    const response = await apiClient.post<ApiResponse<InitializePaymentResponse>>(
      '/subscriptions/initialize',
      params
    );
    return response.data;
  },

  // Verify payment
  verifyPayment: async (reference: string): Promise<ApiResponse<{
    subscription: Subscription;
    payment: { amount: number; reference: string; paidAt: string };
  }>> => {
    const response = await apiClient.post('/subscriptions/verify', { reference });
    return response.data;
  },

  // Change plan
  changePlan: async (
    cooperativeId: string,
    params: { newPlanId: string; billingCycle?: 'monthly' | 'yearly' }
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(
      `/subscriptions/cooperative/${cooperativeId}/change-plan`,
      params
    );
    return response.data;
  },

  // Cancel subscription
  cancelSubscription: async (
    cooperativeId: string,
    params?: { reason?: string; cancelImmediately?: boolean }
  ): Promise<ApiResponse<null>> => {
    const response = await apiClient.post(
      `/subscriptions/cooperative/${cooperativeId}/cancel`,
      params || {}
    );
    return response.data;
  },

  // Check a specific limit
  checkLimit: async (
    cooperativeId: string,
    limitType: 'members' | 'contributionPlans' | 'groupBuys' | 'loans'
  ): Promise<ApiResponse<{ allowed: boolean; message?: string }>> => {
    const response = await apiClient.get<ApiResponse<{ allowed: boolean; message?: string }>>(
      `/subscriptions/cooperative/${cooperativeId}/check-limit/${limitType}`
    );
    return response.data;
  },
};
