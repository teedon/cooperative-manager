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

  joinByCode: async (code: string): Promise<ApiResponse<Cooperative>> => {
    const response = await apiClient.post<ApiResponse<Cooperative>>('/cooperatives/join', {
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
};
