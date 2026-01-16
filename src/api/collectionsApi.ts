import apiClient from './client';
import { ApiResponse } from '../models';

export interface DailyCollection {
  id: string;
  organizationId: string;
  staffId: string;
  collectionDate: string;
  totalAmount: number;
  transactionCount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'partially_posted';
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  approvalNotes?: string;
  staff?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  transactions?: CollectionTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionTransaction {
  id: string;
  dailyCollectionId: string;
  cooperativeId: string;
  memberId: string;
  type: 'contribution' | 'loan_repayment' | 'ajo_payment' | 'esusu_contribution' | 'share_purchase';
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'check';
  reference?: string;
  notes?: string;
  metadata?: any;
  status: 'pending' | 'posted' | 'rejected' | 'failed';
  postedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionStats {
  totalCollections: number;
  approvedCollections: number;
  pendingCollections: number;
  rejectedCollections: number;
  draftCollections: number;
  totalAmountCollected: number;
}

export interface CreateCollectionDto {
  collectionDate: string;
}

export interface AddTransactionDto {
  cooperativeId: string;
  memberId: string;
  type: 'contribution' | 'loan_repayment' | 'ajo_payment' | 'esusu_contribution' | 'share_purchase';
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'check';
  reference?: string;
  notes?: string;
  metadata?: any;
}

export interface UpdateTransactionDto {
  cooperativeId?: string;
  memberId?: string;
  type?: 'contribution' | 'loan_repayment' | 'ajo_payment' | 'esusu_contribution' | 'share_purchase';
  amount?: number;
  paymentMethod?: 'cash' | 'bank_transfer' | 'mobile_money' | 'check';
  reference?: string;
  notes?: string;
  metadata?: any;
}

export interface ApproveCollectionDto {
  approvalNotes?: string;
}

export interface RejectCollectionDto {
  rejectionReason: string;
}

export const collectionsApi = {
  // Create new collection
  create: async (organizationId: string, data: CreateCollectionDto): Promise<ApiResponse<DailyCollection>> => {
    const response = await apiClient.post<ApiResponse<DailyCollection>>(
      `/organizations/${organizationId}/collections`,
      data
    );
    return response.data;
  },

  // Get all collections with filters
  getAll: async (
    organizationId: string,
    filters?: {
      staffId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      cooperativeId?: string;
    }
  ): Promise<ApiResponse<DailyCollection[]>> => {
    const params = new URLSearchParams();
    if (filters?.staffId) params.append('staffId', filters.staffId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.cooperativeId) params.append('cooperativeId', filters.cooperativeId);

    const response = await apiClient.get<ApiResponse<DailyCollection[]>>(
      `/organizations/${organizationId}/collections?${params.toString()}`
    );
    return response.data;
  },

  // Get pending approvals
  getPendingApprovals: async (
    organizationId: string,
    staffId?: string
  ): Promise<ApiResponse<DailyCollection[]>> => {
    const params = staffId ? `?staffId=${staffId}` : '';
    const response = await apiClient.get<ApiResponse<DailyCollection[]>>(
      `/organizations/${organizationId}/collections/pending${params}`
    );
    return response.data;
  },

  // Get statistics
  getStats: async (
    organizationId: string,
    filters?: {
      staffId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<CollectionStats>> => {
    const params = new URLSearchParams();
    if (filters?.staffId) params.append('staffId', filters.staffId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get<ApiResponse<CollectionStats>>(
      `/organizations/${organizationId}/collections/stats?${params.toString()}`
    );
    return response.data;
  },

  // Get single collection
  getById: async (organizationId: string, collectionId: string): Promise<ApiResponse<DailyCollection>> => {
    const response = await apiClient.get<ApiResponse<DailyCollection>>(
      `/organizations/${organizationId}/collections/${collectionId}`
    );
    return response.data;
  },

  // Submit collection for approval
  submit: async (organizationId: string, collectionId: string): Promise<ApiResponse<DailyCollection>> => {
    const response = await apiClient.post<ApiResponse<DailyCollection>>(
      `/organizations/${organizationId}/collections/${collectionId}/submit`
    );
    return response.data;
  },

  // Approve collection
  approve: async (
    organizationId: string,
    collectionId: string,
    data: ApproveCollectionDto
  ): Promise<ApiResponse<DailyCollection>> => {
    const response = await apiClient.post<ApiResponse<DailyCollection>>(
      `/organizations/${organizationId}/collections/${collectionId}/approve`,
      data
    );
    return response.data;
  },

  // Reject collection
  reject: async (
    organizationId: string,
    collectionId: string,
    data: RejectCollectionDto
  ): Promise<ApiResponse<DailyCollection>> => {
    const response = await apiClient.post<ApiResponse<DailyCollection>>(
      `/organizations/${organizationId}/collections/${collectionId}/reject`,
      data
    );
    return response.data;
  },

  // Add transaction
  addTransaction: async (
    organizationId: string,
    collectionId: string,
    data: AddTransactionDto
  ): Promise<ApiResponse<CollectionTransaction>> => {
    const response = await apiClient.post<ApiResponse<CollectionTransaction>>(
      `/organizations/${organizationId}/collections/${collectionId}/transactions`,
      data
    );
    return response.data;
  },

  // Update transaction
  updateTransaction: async (
    organizationId: string,
    collectionId: string,
    transactionId: string,
    data: UpdateTransactionDto
  ): Promise<ApiResponse<CollectionTransaction>> => {
    const response = await apiClient.patch<ApiResponse<CollectionTransaction>>(
      `/organizations/${organizationId}/collections/${collectionId}/transactions/${transactionId}`,
      data
    );
    return response.data;
  },

  // Delete transaction
  deleteTransaction: async (
    organizationId: string,
    collectionId: string,
    transactionId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/organizations/${organizationId}/collections/${collectionId}/transactions/${transactionId}`
    );
    return response.data;
  },
};
