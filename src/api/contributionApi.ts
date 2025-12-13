import apiClient from './client';
import { ContributionPlan, ContributionPeriod, ContributionRecord, ContributionSubscription, ContributionPayment, DuePayment, PaymentSchedule, ApiResponse } from '../models';

export interface CreateContributionPlanData {
  name: string;
  description?: string;
  category: 'compulsory' | 'optional';
  amountType: 'fixed' | 'notional';
  fixedAmount?: number;
  minAmount?: number;
  maxAmount?: number;
  contributionType: 'continuous' | 'period';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface SubscribeData {
  amount: number;
}

export interface UpdateSubscriptionData {
  status?: 'active' | 'paused' | 'cancelled';
  amount?: number;
}

export interface RecordPaymentData {
  amount: number;
  dueDate?: string;
  paymentMethod?: 'bank_transfer' | 'cash' | 'mobile_money' | 'card';
  paymentReference?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface ApprovePaymentData {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

export const contributionApi = {
  // Plans
  getPlans: async (cooperativeId: string): Promise<ApiResponse<ContributionPlan[]>> => {
    const response = await apiClient.get<ApiResponse<ContributionPlan[]>>(
      `/contributions/cooperatives/${cooperativeId}/plans`
    );
    return response.data;
  },

  getPlan: async (planId: string): Promise<ApiResponse<ContributionPlan>> => {
    const response = await apiClient.get<ApiResponse<ContributionPlan>>(
      `/contributions/plans/${planId}`
    );
    return response.data;
  },

  createPlan: async (
    cooperativeId: string,
    plan: CreateContributionPlanData
  ): Promise<ApiResponse<ContributionPlan>> => {
    const response = await apiClient.post<ApiResponse<ContributionPlan>>(
      `/contributions/cooperatives/${cooperativeId}/plans`,
      plan
    );
    return response.data;
  },

  updatePlan: async (
    planId: string,
    plan: Partial<CreateContributionPlanData>
  ): Promise<ApiResponse<ContributionPlan>> => {
    const response = await apiClient.put<ApiResponse<ContributionPlan>>(
      `/contributions/plans/${planId}`,
      plan
    );
    return response.data;
  },

  deletePlan: async (planId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/contributions/plans/${planId}`
    );
    return response.data;
  },

  // Subscriptions
  subscribeToPlan: async (
    planId: string,
    data: SubscribeData
  ): Promise<ApiResponse<ContributionSubscription>> => {
    const response = await apiClient.post<ApiResponse<ContributionSubscription>>(
      `/contributions/plans/${planId}/subscribe`,
      data
    );
    return response.data;
  },

  updateSubscription: async (
    subscriptionId: string,
    data: UpdateSubscriptionData
  ): Promise<ApiResponse<ContributionSubscription>> => {
    const response = await apiClient.put<ApiResponse<ContributionSubscription>>(
      `/contributions/subscriptions/${subscriptionId}`,
      data
    );
    return response.data;
  },

  getMySubscriptions: async (cooperativeId: string): Promise<ApiResponse<ContributionSubscription[]>> => {
    const response = await apiClient.get<ApiResponse<ContributionSubscription[]>>(
      `/contributions/cooperatives/${cooperativeId}/my-subscriptions`
    );
    return response.data;
  },

  getPlanSubscriptions: async (planId: string): Promise<ApiResponse<ContributionSubscription[]>> => {
    const response = await apiClient.get<ApiResponse<ContributionSubscription[]>>(
      `/contributions/plans/${planId}/subscriptions`
    );
    return response.data;
  },

  // Periods (legacy - may need backend implementation)
  getPeriods: async (planId: string): Promise<ApiResponse<ContributionPeriod[]>> => {
    const response = await apiClient.get<ApiResponse<ContributionPeriod[]>>(
      `/contribution-plans/${planId}/periods`
    );
    return response.data;
  },

  getPeriod: async (periodId: string): Promise<ApiResponse<ContributionPeriod>> => {
    const response = await apiClient.get<ApiResponse<ContributionPeriod>>(
      `/contribution-periods/${periodId}`
    );
    return response.data;
  },

  // Records (legacy - may need backend implementation)
  getRecords: async (periodId: string): Promise<ApiResponse<ContributionRecord[]>> => {
    const response = await apiClient.get<ApiResponse<ContributionRecord[]>>(
      `/contribution-periods/${periodId}/records`
    );
    return response.data;
  },

  recordPayment: async (
    periodId: string,
    record: Partial<ContributionRecord>
  ): Promise<ApiResponse<ContributionRecord>> => {
    const response = await apiClient.post<ApiResponse<ContributionRecord>>(
      `/contribution-periods/${periodId}/records`,
      record
    );
    return response.data;
  },

  verifyPayment: async (
    recordId: string,
    approved: boolean,
    reason?: string
  ): Promise<ApiResponse<ContributionRecord>> => {
    const response = await apiClient.post<ApiResponse<ContributionRecord>>(
      `/contribution-records/${recordId}/verify`,
      { approved, reason }
    );
    return response.data;
  },

  getPendingVerifications: async (
    cooperativeId: string
  ): Promise<ApiResponse<ContributionRecord[]>> => {
    const response = await apiClient.get<ApiResponse<ContributionRecord[]>>(
      `/cooperatives/${cooperativeId}/pending-verifications`
    );
    return response.data;
  },

  // Upload receipt
  uploadReceipt: async (
    recordId: string,
    file: FormData
  ): Promise<ApiResponse<{ url: string }>> => {
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      `/contribution-records/${recordId}/receipt`,
      file,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // ==================== PAYMENT METHODS ====================

  // Record a payment for a subscription
  recordSubscriptionPayment: async (
    subscriptionId: string,
    data: RecordPaymentData
  ): Promise<ApiResponse<ContributionPayment>> => {
    const response = await apiClient.post<ApiResponse<ContributionPayment>>(
      `/contributions/subscriptions/${subscriptionId}/payments`,
      data
    );
    return response.data;
  },

  // Get payments for a subscription
  getSubscriptionPayments: async (
    subscriptionId: string
  ): Promise<ApiResponse<ContributionPayment[]>> => {
    const response = await apiClient.get<ApiResponse<ContributionPayment[]>>(
      `/contributions/subscriptions/${subscriptionId}/payments`
    );
    return response.data;
  },

  // Get all my payments in a cooperative
  getMyPayments: async (
    cooperativeId: string
  ): Promise<ApiResponse<ContributionPayment[]>> => {
    const response = await apiClient.get<ApiResponse<ContributionPayment[]>>(
      `/contributions/cooperatives/${cooperativeId}/my-payments`
    );
    return response.data;
  },

  // Get due payments for the current user
  getDuePayments: async (
    cooperativeId: string
  ): Promise<ApiResponse<DuePayment[]>> => {
    const response = await apiClient.get<ApiResponse<DuePayment[]>>(
      `/contributions/cooperatives/${cooperativeId}/due-payments`
    );
    return response.data;
  },

  // Get pending payments for admin approval
  getPendingPayments: async (
    cooperativeId: string
  ): Promise<ApiResponse<ContributionPayment[]>> => {
    const response = await apiClient.get<ApiResponse<ContributionPayment[]>>(
      `/contributions/cooperatives/${cooperativeId}/pending-payments`
    );
    return response.data;
  },

  // Get a single payment
  getPayment: async (
    paymentId: string
  ): Promise<ApiResponse<ContributionPayment>> => {
    const response = await apiClient.get<ApiResponse<ContributionPayment>>(
      `/contributions/payments/${paymentId}`
    );
    return response.data;
  },

  // Approve or reject a payment (admin only)
  approvePayment: async (
    paymentId: string,
    data: ApprovePaymentData
  ): Promise<ApiResponse<ContributionPayment>> => {
    const response = await apiClient.put<ApiResponse<ContributionPayment>>(
      `/contributions/payments/${paymentId}/approve`,
      data
    );
    return response.data;
  },

  // ==================== SCHEDULE API ====================

  // Get schedules for a subscription
  getSubscriptionSchedules: async (
    subscriptionId: string
  ): Promise<ApiResponse<PaymentSchedule[]>> => {
    const response = await apiClient.get<ApiResponse<PaymentSchedule[]>>(
      `/contributions/subscriptions/${subscriptionId}/schedules`
    );
    return response.data;
  },

  // Get member's schedules for a cooperative
  getMySchedules: async (
    cooperativeId: string
  ): Promise<ApiResponse<PaymentSchedule[]>> => {
    const response = await apiClient.get<ApiResponse<PaymentSchedule[]>>(
      `/contributions/cooperatives/${cooperativeId}/my-schedules`
    );
    return response.data;
  },

  // Get overdue schedules for a cooperative (admin only)
  getOverdueSchedules: async (
    cooperativeId: string
  ): Promise<ApiResponse<PaymentSchedule[]>> => {
    const response = await apiClient.get<ApiResponse<PaymentSchedule[]>>(
      `/contributions/cooperatives/${cooperativeId}/overdue-schedules`
    );
    return response.data;
  },

  // Record payment for a schedule
  recordSchedulePayment: async (
    scheduleId: string,
    data: RecordPaymentData
  ): Promise<ApiResponse<ContributionPayment>> => {
    const response = await apiClient.post<ApiResponse<ContributionPayment>>(
      `/contributions/schedules/${scheduleId}/payments`,
      data
    );
    return response.data;
  },

  // Extend schedules for a subscription
  extendSchedules: async (
    subscriptionId: string
  ): Promise<ApiResponse<{ schedulesGenerated: number }>> => {
    const response = await apiClient.post<ApiResponse<{ schedulesGenerated: number }>>(
      `/contributions/subscriptions/${subscriptionId}/extend-schedules`
    );
    return response.data;
  },
};
