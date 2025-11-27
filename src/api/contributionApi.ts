import apiClient from './client';
import { ContributionPlan, ContributionPeriod, ContributionRecord, ApiResponse } from '../models';

export const contributionApi = {
  // Plans
  getPlans: async (cooperativeId: string): Promise<ApiResponse<ContributionPlan[]>> => {
    const response = await apiClient.get<ApiResponse<ContributionPlan[]>>(
      `/cooperatives/${cooperativeId}/contribution-plans`
    );
    return response.data;
  },

  getPlan: async (planId: string): Promise<ApiResponse<ContributionPlan>> => {
    const response = await apiClient.get<ApiResponse<ContributionPlan>>(
      `/contribution-plans/${planId}`
    );
    return response.data;
  },

  createPlan: async (
    cooperativeId: string,
    plan: Partial<ContributionPlan>
  ): Promise<ApiResponse<ContributionPlan>> => {
    const response = await apiClient.post<ApiResponse<ContributionPlan>>(
      `/cooperatives/${cooperativeId}/contribution-plans`,
      plan
    );
    return response.data;
  },

  updatePlan: async (
    planId: string,
    plan: Partial<ContributionPlan>
  ): Promise<ApiResponse<ContributionPlan>> => {
    const response = await apiClient.put<ApiResponse<ContributionPlan>>(
      `/contribution-plans/${planId}`,
      plan
    );
    return response.data;
  },

  // Periods
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

  // Records
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
};
