import apiClient from './client';
import { Cooperative, CooperativeMember, ApiResponse } from '../models';

export const cooperativeApi = {
  getAll: async (): Promise<ApiResponse<Cooperative[]>> => {
    const response = await apiClient.get<ApiResponse<Cooperative[]>>('/cooperatives');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Cooperative>> => {
    const response = await apiClient.get<ApiResponse<Cooperative>>(`/cooperatives/${id}`);
    return response.data;
  },

  create: async (data: Partial<Cooperative>): Promise<ApiResponse<Cooperative>> => {
    const response = await apiClient.post<ApiResponse<Cooperative>>('/cooperatives', data);
    return response.data;
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
