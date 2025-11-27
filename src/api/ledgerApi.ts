import apiClient from './client';
import { LedgerEntry, VirtualBalance, ApiResponse } from '../models';

export const ledgerApi = {
  getEntries: async (
    cooperativeId: string,
    memberId?: string
  ): Promise<ApiResponse<LedgerEntry[]>> => {
    const params = memberId ? { memberId } : {};
    const response = await apiClient.get<ApiResponse<LedgerEntry[]>>(
      `/cooperatives/${cooperativeId}/ledger`,
      { params }
    );
    return response.data;
  },

  getVirtualBalance: async (
    cooperativeId: string,
    memberId: string
  ): Promise<ApiResponse<VirtualBalance>> => {
    const response = await apiClient.get<ApiResponse<VirtualBalance>>(
      `/cooperatives/${cooperativeId}/members/${memberId}/balance`
    );
    return response.data;
  },

  getAllBalances: async (cooperativeId: string): Promise<ApiResponse<VirtualBalance[]>> => {
    const response = await apiClient.get<ApiResponse<VirtualBalance[]>>(
      `/cooperatives/${cooperativeId}/balances`
    );
    return response.data;
  },

  addManualEntry: async (
    cooperativeId: string,
    entry: {
      memberId: string;
      type: 'manual_credit' | 'manual_debit';
      amount: number;
      description: string;
    }
  ): Promise<ApiResponse<LedgerEntry>> => {
    const response = await apiClient.post<ApiResponse<LedgerEntry>>(
      `/cooperatives/${cooperativeId}/ledger`,
      entry
    );
    return response.data;
  },

  getReport: async (
    cooperativeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<
    ApiResponse<{
      totalContributions: number;
      totalLoans: number;
      totalGroupBuys: number;
      netBalance: number;
      entries: LedgerEntry[];
    }>
  > => {
    const params = { startDate, endDate };
    const response = await apiClient.get(`/cooperatives/${cooperativeId}/ledger/report`, {
      params,
    });
    return response.data;
  },
};
