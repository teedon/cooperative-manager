import apiClient from './client';
import { Activity, ApiResponse } from '../models';

export const activityApi = {
  getMyActivities: async (limit?: number): Promise<ApiResponse<Activity[]>> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<ApiResponse<Activity[]>>(`/activities${params}`);
    return response.data;
  },

  getRecentActivities: async (limit?: number): Promise<ApiResponse<Activity[]>> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<ApiResponse<Activity[]>>(`/activities/recent${params}`);
    return response.data;
  },

  getCooperativeActivities: async (
    cooperativeId: string,
    limit?: number
  ): Promise<ApiResponse<Activity[]>> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<ApiResponse<Activity[]>>(
      `/activities/cooperative/${cooperativeId}${params}`
    );
    return response.data;
  },
};
