import apiClient from './client';
import { LoanRequest, LoanRepayment, ApiResponse } from '../models';

export const loanApi = {
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
    loan: Partial<LoanRequest>
  ): Promise<ApiResponse<LoanRequest>> => {
    const response = await apiClient.post<ApiResponse<LoanRequest>>(
      `/cooperatives/${cooperativeId}/loans`,
      loan
    );
    return response.data;
  },

  review: async (
    loanId: string,
    approved: boolean,
    reason?: string
  ): Promise<ApiResponse<LoanRequest>> => {
    const response = await apiClient.post<ApiResponse<LoanRequest>>(`/loans/${loanId}/review`, {
      approved,
      reason,
    });
    return response.data;
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

  getRepayments: async (loanId: string): Promise<ApiResponse<LoanRepayment[]>> => {
    const response = await apiClient.get<ApiResponse<LoanRepayment[]>>(
      `/loans/${loanId}/repayments`
    );
    return response.data;
  },

  recordRepayment: async (loanId: string, amount: number): Promise<ApiResponse<LoanRepayment>> => {
    const response = await apiClient.post<ApiResponse<LoanRepayment>>(
      `/loans/${loanId}/repayments`,
      { amount }
    );
    return response.data;
  },

  getMyLoans: async (): Promise<ApiResponse<LoanRequest[]>> => {
    const response = await apiClient.get<ApiResponse<LoanRequest[]>>('/loans/my-loans');
    return response.data;
  },
};
