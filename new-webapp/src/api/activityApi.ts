import apiClient from './cooperativeApi'
import type { Activity, ApiResponse } from '../types'

export const activityApi = {
  getAll: async (cooperativeId?: string): Promise<ApiResponse<Activity[]>> => {
    const url = cooperativeId ? `/activities?cooperativeId=${cooperativeId}` : '/activities'
    const response = await apiClient.get<ApiResponse<Activity[]>>(url)
    return response.data
  },

  getRecent: async (limit: number = 10): Promise<ApiResponse<Activity[]>> => {
    const response = await apiClient.get<ApiResponse<Activity[]>>(`/activities?limit=${limit}`)
    return response.data
  },
}
