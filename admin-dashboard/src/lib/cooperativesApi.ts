import { api } from './api';

export interface Cooperative {
  id: string;
  name: string;
  code: string;
  description?: string;
  imageUrl?: string;
  status: string;
  memberCount: number;
  totalContributions: number;
  totalExpenses: number;
  organizationId?: string;
  organizationName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCooperatives {
  cooperatives: Cooperative[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const cooperativesApi = {
  /**
   * Get paginated list of cooperatives
   */
  getCooperatives: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    organizationId?: string;
  } = {}): Promise<PaginatedCooperatives> => {
    const response = await api.get('/admin/cooperatives', { params });
    return response.data;
  },

  /**
   * Get cooperative by ID
   */
  getCooperativeById: async (id: string): Promise<Cooperative> => {
    const response = await api.get(`/admin/cooperatives/${id}`);
    return response.data;
  },

  /**
   * Update cooperative status
   */
  updateCooperativeStatus: async (id: string, status: string): Promise<void> => {
    await api.patch(`/admin/cooperatives/${id}/status`, { status });
  },

  /**
   * Delete cooperative
   */
  deleteCooperative: async (id: string): Promise<void> => {
    await api.delete(`/admin/cooperatives/${id}`);
  },

  /**
   * Get cooperative statistics
   */
  getCooperativeStats: async (id: string) => {
    const response = await api.get(`/admin/cooperatives/${id}/stats`);
    return response.data;
  },
};