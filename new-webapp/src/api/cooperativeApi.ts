import axios from 'axios'
import type { Cooperative, CooperativeMember, ApiResponse, PredefinedRole } from '../types'

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

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Add response interceptor for automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('auth_refresh_token')

      if (!refreshToken) {
        // No refresh token, redirect to login
        isRefreshing = false
        localStorage.removeItem('token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_refresh_token')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        // Try to refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        })

        const { token, refreshToken: newRefreshToken } = response.data.data

        // Update tokens in localStorage
        localStorage.setItem('token', token)
        localStorage.setItem('auth_token', token)
        if (newRefreshToken) {
          localStorage.setItem('auth_refresh_token', newRefreshToken)
        }

        // Update the authorization header
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
        originalRequest.headers.Authorization = `Bearer ${token}`

        // Process queued requests with new token
        processQueue(null, token)
        isRefreshing = false

        // Retry the original request
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        processQueue(refreshError, null)
        isRefreshing = false
        localStorage.removeItem('token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
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

  getMyPendingMemberships: async (): Promise<ApiResponse<Array<CooperativeMember & { cooperative: Cooperative }>>> => {
    const response = await apiClient.get<ApiResponse<Array<CooperativeMember & { cooperative: Cooperative }>>>('/cooperatives/my-pending')
    return response.data
  },

  cancelPendingRequest: async (cooperativeId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(`/cooperatives/pending/${cooperativeId}/cancel`)
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

  sendEmailInvites: async (cooperativeId: string, emails: string[], message?: string): Promise<ApiResponse<{
    cooperativeCode: string
    cooperativeName: string
    deepLink: string
    webLink: string
    results: Array<{ email: string; sent: boolean; message: string }>
  }>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/cooperatives/${cooperativeId}/invite/email`,
      { emails, message }
    )
    return response.data
  },

  sendWhatsAppInvites: async (cooperativeId: string, phoneNumbers: string[], message?: string): Promise<ApiResponse<{
    cooperativeCode: string
    cooperativeName: string
    deepLink: string
    webLink: string
    whatsappMessage: string
    whatsappLinks: Array<{ phone: string; originalPhone: string; whatsappUrl: string }>
  }>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/cooperatives/${cooperativeId}/invite/whatsapp`,
      { phoneNumbers, message }
    )
    return response.data
  },

  bulkCreateOfflineMembers: async (
    cooperativeId: string,
    members: Array<{
      firstName: string
      lastName: string
      email?: string
      phone?: string
      address?: string
    }>
  ): Promise<ApiResponse<{
    totalProcessed: number
    successCount: number
    failedCount: number
    successful: CooperativeMember[]
    failed: Array<{ member: any; error: string }>
  }>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/cooperatives/${cooperativeId}/offline-members/bulk`,
      { members }
    )
    return response.data
  },

  // Admin Management
  getAdmins: async (cooperativeId: string): Promise<ApiResponse<CooperativeMember[]>> => {
    const response = await apiClient.get<ApiResponse<CooperativeMember[]>>(
      `/cooperatives/${cooperativeId}/admins`
    )
    return response.data
  },

  updateMemberRoleWithPermissions: async (
    cooperativeId: string,
    memberId: string,
    role: 'admin' | 'moderator' | 'member',
    permissions?: string[],
    roleTitle?: string | null
  ): Promise<ApiResponse<CooperativeMember>> => {
    const response = await apiClient.put<ApiResponse<CooperativeMember>>(
      `/cooperatives/${cooperativeId}/members/${memberId}/role`,
      { role, permissions, roleTitle }
    )
    return response.data
  },

  updateMemberPermissions: async (
    cooperativeId: string,
    memberId: string,
    permissions: string[]
  ): Promise<ApiResponse<CooperativeMember>> => {
    const response = await apiClient.put<ApiResponse<CooperativeMember>>(
      `/cooperatives/${cooperativeId}/members/${memberId}/permissions`,
      { permissions }
    )
    return response.data
  },

  removeAdmin: async (
    cooperativeId: string,
    memberId: string
  ): Promise<ApiResponse<CooperativeMember>> => {
    const response = await apiClient.post<ApiResponse<CooperativeMember>>(
      `/cooperatives/${cooperativeId}/members/${memberId}/remove-admin`
    )
    return response.data
  },

  getPredefinedRoles: async (): Promise<ApiResponse<PredefinedRole[]>> => {
    const response = await apiClient.get<ApiResponse<PredefinedRole[]>>('/cooperatives/roles/predefined')
    return response.data
  },
}

export default apiClient
