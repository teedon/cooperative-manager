import apiClient from './client';
import { Cooperative, CooperativeMember, ApiResponse } from '../models';
import logger from '../utils/logger';

export const cooperativeApi = {
  getAll: async (): Promise<ApiResponse<Cooperative[]>> => {
    const response = await apiClient.get<ApiResponse<Cooperative[]>>('/cooperatives');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Cooperative>> => {
    const response = await apiClient.get<ApiResponse<Cooperative>>(`/cooperatives/${id}`);
    return response.data;
  },

  create: async (
    data: Partial<Cooperative>,
    requestId?: string
  ): Promise<ApiResponse<Cooperative>> => {
    const op = 'cooperative.create';
    const start = Date.now();
    logger.info(op, 'request', { payload: data, requestId });
    try {
      const config = requestId ? { headers: { 'X-Request-Id': requestId } } : undefined;
      const response = await apiClient.post<ApiResponse<Cooperative>>('/cooperatives', data, config);
      const duration = Date.now() - start;
      logger.info(op, 'success', {
        status: response.status,
        durationMs: duration,
        responseData: response.data,
        requestId,
      });
      return response.data;
    } catch (err: any) {
      const duration = Date.now() - start;
      logger.error(op, 'failure', {
        message: err?.message,
        durationMs: duration,
        configUrl: err?.config?.url,
        status: err?.response?.status,
        responseData: err?.response?.data,
        payload: data,
        requestId,
      });
      throw err;
    }
  },

  update: async (id: string, data: Partial<Cooperative>): Promise<ApiResponse<Cooperative>> => {
    const response = await apiClient.put<ApiResponse<Cooperative>>(`/cooperatives/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/cooperatives/${id}`);
    return response.data;
  },

  joinByCode: async (code: string): Promise<ApiResponse<{ cooperative: Cooperative; member: CooperativeMember }>> => {
    const response = await apiClient.post<ApiResponse<{ cooperative: Cooperative; member: CooperativeMember }>>('/cooperatives/join', {
      code,
    });
    return response.data;
  },

  getMembers: async (cooperativeId: string): Promise<ApiResponse<CooperativeMember[]>> => {
    const response = await apiClient.get<ApiResponse<CooperativeMember[]>>(
      `/cooperatives/${cooperativeId}/members`
    );
    return response.data;
  },

  addMember: async (
    cooperativeId: string,
    data: { userId: string; role: string }
  ): Promise<ApiResponse<CooperativeMember>> => {
    const response = await apiClient.post<ApiResponse<CooperativeMember>>(
      `/cooperatives/${cooperativeId}/members`,
      data
    );
    return response.data;
  },

  updateMemberRole: async (
    cooperativeId: string,
    memberId: string,
    role: string
  ): Promise<ApiResponse<CooperativeMember>> => {
    const response = await apiClient.put<ApiResponse<CooperativeMember>>(
      `/cooperatives/${cooperativeId}/members/${memberId}`,
      { role }
    );
    return response.data;
  },

  removeMember: async (cooperativeId: string, memberId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/cooperatives/${cooperativeId}/members/${memberId}`
    );
    return response.data;
  },

  getPendingMembers: async (cooperativeId: string): Promise<ApiResponse<CooperativeMember[]>> => {
    const response = await apiClient.get<ApiResponse<CooperativeMember[]>>(
      `/cooperatives/${cooperativeId}/pending-members`
    );
    return response.data;
  },

  approveMember: async (memberId: string): Promise<ApiResponse<CooperativeMember>> => {
    const response = await apiClient.post<ApiResponse<CooperativeMember>>(
      `/cooperatives/members/${memberId}/approve`
    );
    return response.data;
  },

  rejectMember: async (memberId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/cooperatives/members/${memberId}/reject`
    );
    return response.data;
  },

  // ==================== ADMIN MANAGEMENT ====================

  // Get all admins/moderators for a cooperative
  getAdmins: async (cooperativeId: string): Promise<ApiResponse<CooperativeMember[]>> => {
    const response = await apiClient.get<ApiResponse<CooperativeMember[]>>(
      `/cooperatives/${cooperativeId}/admins`
    );
    return response.data;
  },

  // Update member role (promote/demote)
  updateMemberRoleWithPermissions: async (
    cooperativeId: string,
    memberId: string,
    role: string,
    permissions?: string[]
  ): Promise<ApiResponse<CooperativeMember>> => {
    const response = await apiClient.put<ApiResponse<CooperativeMember>>(
      `/cooperatives/${cooperativeId}/members/${memberId}/role`,
      { role, permissions }
    );
    return response.data;
  },

  // Update member permissions (for moderators)
  updateMemberPermissions: async (
    cooperativeId: string,
    memberId: string,
    permissions: string[]
  ): Promise<ApiResponse<CooperativeMember>> => {
    const response = await apiClient.put<ApiResponse<CooperativeMember>>(
      `/cooperatives/${cooperativeId}/members/${memberId}/permissions`,
      { permissions }
    );
    return response.data;
  },

  // Remove admin status (demote to member)
  removeAdmin: async (
    cooperativeId: string,
    memberId: string
  ): Promise<ApiResponse<CooperativeMember>> => {
    const response = await apiClient.post<ApiResponse<CooperativeMember>>(
      `/cooperatives/${cooperativeId}/members/${memberId}/remove-admin`
    );
    return response.data;
  },

  // Get available permissions
  getAvailablePermissions: async (): Promise<ApiResponse<{
    permissions: string[];
    defaultRolePermissions: Record<string, string[]>;
  }>> => {
    const response = await apiClient.get<ApiResponse<{
      permissions: string[];
      defaultRolePermissions: Record<string, string[]>;
    }>>('/cooperatives/permissions/available');
    return response.data;
  },

  // ==================== OFFLINE MEMBER MANAGEMENT ====================

  // Get all offline members
  getOfflineMembers: async (cooperativeId: string): Promise<ApiResponse<CooperativeMember[]>> => {
    const response = await apiClient.get<ApiResponse<CooperativeMember[]>>(
      `/cooperatives/${cooperativeId}/offline-members`
    );
    return response.data;
  },

  // Create an offline member
  createOfflineMember: async (
    cooperativeId: string,
    data: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      initialBalance?: number;
      autoSubscribe?: boolean;
    }
  ): Promise<ApiResponse<CooperativeMember>> => {
    const response = await apiClient.post<ApiResponse<CooperativeMember>>(
      `/cooperatives/${cooperativeId}/offline-members`,
      data
    );
    return response.data;
  },

  // Update an offline member
  updateOfflineMember: async (
    cooperativeId: string,
    memberId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    }
  ): Promise<ApiResponse<CooperativeMember>> => {
    const response = await apiClient.put<ApiResponse<CooperativeMember>>(
      `/cooperatives/${cooperativeId}/offline-members/${memberId}`,
      data
    );
    return response.data;
  },

  // Delete an offline member
  deleteOfflineMember: async (
    cooperativeId: string,
    memberId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/cooperatives/${cooperativeId}/offline-members/${memberId}`
    );
    return response.data;
  },

  // Subscribe offline member to a plan
  subscribeOfflineMemberToPlan: async (
    cooperativeId: string,
    memberId: string,
    planId: string
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/cooperatives/${cooperativeId}/offline-members/${memberId}/subscribe/${planId}`
    );
    return response.data;
  },

  // Bulk create offline members
  bulkCreateOfflineMembers: async (
    cooperativeId: string,
    members: Array<{
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      memberCode?: string;
      notes?: string;
    }>
  ): Promise<ApiResponse<{
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    successful: any[];
    failed: Array<{ member: any; error: string }>;
  }>> => {
    const response = await apiClient.post<ApiResponse<{
      totalProcessed: number;
      successCount: number;
      failedCount: number;
      successful: any[];
      failed: Array<{ member: any; error: string }>;
    }>>(
      `/cooperatives/${cooperativeId}/offline-members/bulk`,
      { members }
    );
    return response.data;
  },
};
