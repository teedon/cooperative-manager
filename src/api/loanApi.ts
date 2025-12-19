import apiClient from './client';
import { LoanRequest, LoanRepayment, LoanType, LoanRepaymentSchedule, ApiResponse } from '../models';

export interface CreateLoanTypeData {
  name: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  minDuration: number;
  maxDuration: number;
  interestRate: number;
  interestType: 'flat' | 'reducing_balance';
  minMembershipDuration?: number;
  minSavingsBalance?: number;
  maxActiveLoans?: number;
  requiresGuarantor?: boolean;
  minGuarantors?: number;
  isActive?: boolean;
  requiresApproval?: boolean;
}

export interface RequestLoanData {
  loanTypeId?: string;
  amount: number;
  purpose: string;
  duration: number;
  interestRate?: number;
}

export interface InitiateLoanData {
  memberId: string;
  loanTypeId?: string;
  amount: number;
  purpose: string;
  duration: number;
  interestRate?: number;
  deductionStartDate?: string;
}

export interface ApproveLoanData {
  deductionStartDate?: string;
  notes?: string;
}

export const loanApi = {
  // ==================== LOAN TYPES ====================
  
  getLoanTypes: async (cooperativeId: string): Promise<ApiResponse<LoanType[]>> => {
    const response = await apiClient.get<ApiResponse<LoanType[]>>(
      `/cooperatives/${cooperativeId}/loan-types`
    );
    return response.data;
  },

  getLoanType: async (cooperativeId: string, loanTypeId: string): Promise<ApiResponse<LoanType>> => {
    const response = await apiClient.get<ApiResponse<LoanType>>(
      `/cooperatives/${cooperativeId}/loan-types/${loanTypeId}`
    );
    return response.data;
  },

  createLoanType: async (
    cooperativeId: string,
    data: CreateLoanTypeData
  ): Promise<ApiResponse<LoanType>> => {
    const response = await apiClient.post<ApiResponse<LoanType>>(
      `/cooperatives/${cooperativeId}/loan-types`,
      data
    );
    return response.data;
  },

  updateLoanType: async (
    cooperativeId: string,
    loanTypeId: string,
    data: Partial<CreateLoanTypeData>
  ): Promise<ApiResponse<LoanType>> => {
    const response = await apiClient.put<ApiResponse<LoanType>>(
      `/cooperatives/${cooperativeId}/loan-types/${loanTypeId}`,
      data
    );
    return response.data;
  },

  deleteLoanType: async (
    cooperativeId: string,
    loanTypeId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/cooperatives/${cooperativeId}/loan-types/${loanTypeId}`
    );
    return response.data;
  },

  // ==================== LOANS ====================

  getAll: async (cooperativeId: string): Promise<ApiResponse<LoanRequest[]>> => {
    const response = await apiClient.get<ApiResponse<LoanRequest[]>>(
      `/cooperatives/${cooperativeId}/loans`
    );
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<LoanRequest>> => {
    const response = await apiClient.get<ApiResponse<LoanRequest>>(`/loans/${id}`);
    return response.data;
  },

  request: async (
    cooperativeId: string,
    data: RequestLoanData
  ): Promise<ApiResponse<LoanRequest>> => {
    const response = await apiClient.post<ApiResponse<LoanRequest>>(
      `/cooperatives/${cooperativeId}/loans`,
      data
    );
    return response.data;
  },

  initiate: async (
    cooperativeId: string,
    data: InitiateLoanData
  ): Promise<ApiResponse<LoanRequest>> => {
    const response = await apiClient.post<ApiResponse<LoanRequest>>(
      `/cooperatives/${cooperativeId}/loans/initiate`,
      data
    );
    return response.data;
  },

  approve: async (
    loanId: string,
    data?: ApproveLoanData
  ): Promise<ApiResponse<LoanRequest>> => {
    const response = await apiClient.post<ApiResponse<LoanRequest>>(
      `/loans/${loanId}/approve`,
      data || {}
    );
    return response.data;
  },

  reject: async (
    loanId: string,
    reason: string
  ): Promise<ApiResponse<LoanRequest>> => {
    const response = await apiClient.post<ApiResponse<LoanRequest>>(`/loans/${loanId}/reject`, {
      reason,
    });
    return response.data;
  },

  // Legacy alias for review
  review: async (
    loanId: string,
    approved: boolean,
    reason?: string
  ): Promise<ApiResponse<LoanRequest>> => {
    if (approved) {
      return loanApi.approve(loanId);
    }
    return loanApi.reject(loanId, reason || 'Rejected');
  },

  disburse: async (loanId: string): Promise<ApiResponse<LoanRequest>> => {
    const response = await apiClient.post<ApiResponse<LoanRequest>>(`/loans/${loanId}/disburse`);
    return response.data;
  },

  getPending: async (cooperativeId: string): Promise<ApiResponse<LoanRequest[]>> => {
    const response = await apiClient.get<ApiResponse<LoanRequest[]>>(
      `/cooperatives/${cooperativeId}/loans/pending`
    );
    return response.data;
  },

  getMyLoans: async (cooperativeId: string): Promise<ApiResponse<LoanRequest[]>> => {
    const response = await apiClient.get<ApiResponse<LoanRequest[]>>(
      `/cooperatives/${cooperativeId}/loans/my-loans`
    );
    return response.data;
  },

  getRepayments: async (loanId: string): Promise<ApiResponse<LoanRepaymentSchedule[]>> => {
    const response = await apiClient.get<ApiResponse<LoanRepaymentSchedule[]>>(
      `/loans/${loanId}/repayments`
    );
    return response.data;
  },

  recordRepayment: async (
    loanId: string,
    amount: number,
    paymentMethod?: string,
    paymentReference?: string,
    notes?: string
  ): Promise<ApiResponse<LoanRequest>> => {
    const response = await apiClient.post<ApiResponse<LoanRequest>>(
      `/loans/${loanId}/repayments`,
      { amount, paymentMethod, paymentReference, notes }
    );
    return response.data;
  },
};
