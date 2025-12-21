import apiClient from './client';
import { ApiResponse } from '../models';

// ==================== TYPES ====================

export interface ExpenseCategory {
  id: string;
  cooperativeId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    expenses: number;
  };
}

export interface Expense {
  id: string;
  cooperativeId: string;
  categoryId?: string;
  category?: ExpenseCategory;
  title: string;
  description?: string;
  amount: number;
  expenseDate: string;
  vendorName?: string;
  vendorContact?: string;
  receiptUrl?: string;
  receiptNumber?: string;
  paymentMethod?: string;
  paymentReference?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // User info for display
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateExpenseData {
  title: string;
  description?: string;
  amount: number;
  expenseDate: string;
  categoryId?: string;
  vendorName?: string;
  vendorContact?: string;
  receiptUrl?: string;
  receiptNumber?: string;
  paymentMethod?: string;
  paymentReference?: string;
}

export interface UpdateExpenseData {
  title?: string;
  description?: string;
  amount?: number;
  expenseDate?: string;
  categoryId?: string;
  vendorName?: string;
  vendorContact?: string;
  receiptUrl?: string;
  receiptNumber?: string;
  paymentMethod?: string;
  paymentReference?: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface ApproveExpenseData {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface ExpensePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExpenseListResponse {
  expenses: Expense[];
  pagination: ExpensePagination;
}

export interface ExpenseSummary {
  totalApprovedAmount: number;
  totalApprovedCount: number;
  totalPendingAmount: number;
  totalPendingCount: number;
  expensesByCategory: {
    categoryId: string | null;
    categoryName: string;
    categoryColor: string;
    totalAmount: number;
    count: number;
  }[];
  monthlyTrend: {
    month: string;
    amount: number;
  }[];
}

export interface GetExpensesOptions {
  status?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ==================== API ====================

export const expenseApi = {
  // ==================== CATEGORIES ====================

  getCategories: async (cooperativeId: string): Promise<ApiResponse<ExpenseCategory[]>> => {
    const response = await apiClient.get<ApiResponse<ExpenseCategory[]>>(
      `/expenses/cooperatives/${cooperativeId}/categories`
    );
    return response.data;
  },

  createCategory: async (
    cooperativeId: string,
    data: CreateCategoryData
  ): Promise<ApiResponse<ExpenseCategory>> => {
    const response = await apiClient.post<ApiResponse<ExpenseCategory>>(
      `/expenses/cooperatives/${cooperativeId}/categories`,
      data
    );
    return response.data;
  },

  updateCategory: async (
    cooperativeId: string,
    categoryId: string,
    data: UpdateCategoryData
  ): Promise<ApiResponse<ExpenseCategory>> => {
    const response = await apiClient.put<ApiResponse<ExpenseCategory>>(
      `/expenses/cooperatives/${cooperativeId}/categories/${categoryId}`,
      data
    );
    return response.data;
  },

  deleteCategory: async (
    cooperativeId: string,
    categoryId: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/expenses/cooperatives/${cooperativeId}/categories/${categoryId}`
    );
    return response.data;
  },

  // ==================== EXPENSES ====================

  getExpenses: async (
    cooperativeId: string,
    options?: GetExpensesOptions
  ): Promise<ApiResponse<Expense[]> & { pagination: ExpensePagination }> => {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.categoryId) params.append('categoryId', options.categoryId);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const queryString = params.toString();
    const url = `/expenses/cooperatives/${cooperativeId}${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<ApiResponse<Expense[]> & { pagination: ExpensePagination }>(url);
    return response.data;
  },

  getExpense: async (cooperativeId: string, expenseId: string): Promise<ApiResponse<Expense>> => {
    const response = await apiClient.get<ApiResponse<Expense>>(
      `/expenses/cooperatives/${cooperativeId}/${expenseId}`
    );
    return response.data;
  },

  createExpense: async (
    cooperativeId: string,
    data: CreateExpenseData
  ): Promise<ApiResponse<Expense>> => {
    const response = await apiClient.post<ApiResponse<Expense>>(
      `/expenses/cooperatives/${cooperativeId}`,
      data
    );
    return response.data;
  },

  updateExpense: async (
    cooperativeId: string,
    expenseId: string,
    data: UpdateExpenseData
  ): Promise<ApiResponse<Expense>> => {
    const response = await apiClient.put<ApiResponse<Expense>>(
      `/expenses/cooperatives/${cooperativeId}/${expenseId}`,
      data
    );
    return response.data;
  },

  deleteExpense: async (
    cooperativeId: string,
    expenseId: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/expenses/cooperatives/${cooperativeId}/${expenseId}`
    );
    return response.data;
  },

  approveExpense: async (
    cooperativeId: string,
    expenseId: string,
    data: ApproveExpenseData
  ): Promise<ApiResponse<Expense>> => {
    const response = await apiClient.put<ApiResponse<Expense>>(
      `/expenses/cooperatives/${cooperativeId}/${expenseId}/approve`,
      data
    );
    return response.data;
  },

  // ==================== SUMMARY ====================

  getExpenseSummary: async (
    cooperativeId: string,
    options?: { startDate?: string; endDate?: string }
  ): Promise<ApiResponse<ExpenseSummary>> => {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const queryString = params.toString();
    const url = `/expenses/cooperatives/${cooperativeId}/summary${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<ApiResponse<ExpenseSummary>>(url);
    return response.data;
  },
};
