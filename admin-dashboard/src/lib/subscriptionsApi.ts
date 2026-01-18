import { api } from './api';

export interface Subscription {
  id: string;
  cooperativeId: string;
  cooperativeName: string;
  planType: string | null;
  planName: string;
  status: 'active' | 'inactive' | 'expired' | 'cancelled' | null;
  startDate: string;
  endDate: string | null;
  amount: number;
  currency: string;
  paymentMethod?: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSubscriptions {
  subscriptions: Subscription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubscriptionStats {
  totalActive: number;
  totalRevenue: number;
  monthlyRevenue: number;
  planBreakdown: Array<{
    planType: string;
    count: number;
    revenue: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
}

export const subscriptionsApi = {
  /**
   * Get paginated list of subscriptions
   */
  getSubscriptions: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    planType?: string;
  } = {}): Promise<PaginatedSubscriptions> => {
    const response = await api.get('/admin/subscriptions', { params });
    return response.data;
  },

  /**
   * Get subscription by ID
   */
  getSubscriptionById: async (id: string): Promise<Subscription> => {
    const response = await api.get(`/admin/subscriptions/${id}`);
    return response.data;
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (id: string): Promise<void> => {
    await api.post(`/admin/subscriptions/${id}/cancel`);
  },

  /**
   * Extend subscription
   */
  extendSubscription: async (id: string, months: number): Promise<void> => {
    await api.post(`/admin/subscriptions/${id}/extend`, { months });
  },

  /**
   * Get subscription statistics
   */
  getStats: async (): Promise<SubscriptionStats> => {
    const response = await api.get('/admin/subscriptions/stats');
    return response.data;
  },
};