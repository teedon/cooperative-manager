import axios from 'axios'
import type { Cooperative, CooperativeMember, ApiResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear tokens and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const cooperativeApi = {
  getAll: async (): Promise<ApiResponse<Cooperative[]>> => {
    const response = await apiClient.get<ApiResponse<Cooperative[]>>('/cooperatives')
    return response.data
  },

  getById: async (id: string): Promise<ApiResponse<Cooperative>> => {
    const response = await apiClient.get<ApiResponse<Cooperative>>(`/cooperatives/${id}`)
    return response.data
  },

  create: async (data: Partial<Cooperative>): Promise<ApiResponse<Cooperative>> => {
    const response = await apiClient.post<ApiResponse<Cooperative>>('/cooperatives', data)
    return response.data
  },

  joinByCode: async (code: string): Promise<ApiResponse<{ cooperative: Cooperative; member: CooperativeMember }>> => {
    const response = await apiClient.post<ApiResponse<{ cooperative: Cooperative; member: CooperativeMember }>>('/cooperatives/join', {
      code,
    })
    return response.data
  },

  getMembers: async (cooperativeId: string): Promise<ApiResponse<CooperativeMember[]>> => {
    const response = await apiClient.get<ApiResponse<CooperativeMember[]>>(
      `/cooperatives/${cooperativeId}/members`
    )
    return response.data
  },

  getPendingMembers: async (cooperativeId: string): Promise<ApiResponse<CooperativeMember[]>> => {
    const response = await apiClient.get<ApiResponse<CooperativeMember[]>>(
      `/cooperatives/${cooperativeId}/pending-members`
    )
    return response.data
  },

  approveMember: async (memberId: string): Promise<ApiResponse<CooperativeMember>> => {
    const response = await apiClient.post<ApiResponse<CooperativeMember>>(
      `/cooperatives/members/${memberId}/approve`
    )
    return response.data
  },

  rejectMember: async (memberId: string): Promise<ApiResponse<CooperativeMember>> => {
    const response = await apiClient.post<ApiResponse<CooperativeMember>>(
      `/cooperatives/members/${memberId}/reject`
    )
    return response.data
  },

  update: async (id: string, data: Partial<Cooperative>): Promise<ApiResponse<Cooperative>> => {
    const response = await apiClient.patch<ApiResponse<Cooperative>>(
      `/cooperatives/${id}`,
      data
    )
    return response.data
  },
}

export default apiClient
