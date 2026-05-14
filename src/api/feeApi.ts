import apiClient from './client';
import { CooperativeFee, CooperativeFeePayment, ApiResponse } from '../models';

export interface CreateFeeData {
  name: string;
  description?: string;
  amount: number;
  isActive?: boolean;
}

export interface UpdateFeeData extends Partial<CreateFeeData> {}

export interface RecordFeePaymentData {
  memberId?: string;
  amount: number;
  paymentDate?: string;
  paymentMethod?: 'bank_transfer' | 'cash' | 'mobile_money' | 'card';
  paymentReference?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface ApproveFeePaymentData {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

export const feeApi = {
  getFees: async (cooperativeId: string): Promise<ApiResponse<CooperativeFee[]>> => {
    const response = await apiClient.get(`/fees/cooperatives/${cooperativeId}`);
    return response.data;
  },

  createFee: async (cooperativeId: string, data: CreateFeeData): Promise<ApiResponse<CooperativeFee>> => {
    const response = await apiClient.post(`/fees/cooperatives/${cooperativeId}`, data);
    return response.data;
  },

  updateFee: async (feeId: string, data: UpdateFeeData): Promise<ApiResponse<CooperativeFee>> => {
    const response = await apiClient.patch(`/fees/${feeId}`, data);
    return response.data;
  },

  recordFeePayment: async (feeId: string, data: RecordFeePaymentData): Promise<ApiResponse<CooperativeFeePayment>> => {
    const response = await apiClient.post(`/fees/${feeId}/payments`, data);
    return response.data;
  },

  getFeePayments: async (
    feeId: string,
    params?: { memberId?: string; status?: string }
  ): Promise<ApiResponse<CooperativeFeePayment[]>> => {
    const response = await apiClient.get(`/fees/${feeId}/payments`, { params });
    return response.data;
  },

  getPendingPayments: async (cooperativeId: string): Promise<ApiResponse<CooperativeFeePayment[]>> => {
    const response = await apiClient.get(`/fees/cooperatives/${cooperativeId}/pending-payments`);
    return response.data;
  },

  getMyPayments: async (cooperativeId: string): Promise<ApiResponse<CooperativeFeePayment[]>> => {
    const response = await apiClient.get(`/fees/cooperatives/${cooperativeId}/my-payments`);
    return response.data;
  },

  approveFeePayment: async (
    paymentId: string,
    data: ApproveFeePaymentData
  ): Promise<ApiResponse<CooperativeFeePayment>> => {
    const response = await apiClient.patch(`/fees/payments/${paymentId}/approve`, data);
    return response.data;
  },
};
