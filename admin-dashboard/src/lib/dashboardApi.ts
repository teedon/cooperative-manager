import { api } from './api';

// Types for dashboard statistics
export interface DashboardStats {
  totalUsers: number;
  totalCooperatives: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  userGrowth: number;
  cooperativeGrowth: number;
  subscriptionGrowth: number;
  revenueGrowth: number;
}

export interface RecentActivity {
  id: string;
  type: 'user_registered' | 'cooperative_created' | 'subscription_upgraded' | 'support_ticket' | 'cooperative_verified';
  description: string;
  entityName: string;
  timestamp: string;
}

// Dashboard API
export const dashboardApi = {
  /**
   * Get dashboard statistics
   */
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  /**
   * Get recent activity
   */
  getRecentActivity: async (): Promise<RecentActivity[]> => {
    const response = await api.get('/admin/dashboard/recent-activity');
    return response.data;
  },
};