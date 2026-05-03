import axios from 'axios'
import type { Organization, OrganizationStaff, CreateOrganizationDto, AddStaffDto, ApiResponse } from '../types'

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
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        })

        const { accessToken } = response.data
        localStorage.setItem('token', accessToken)
        
        // Update the authorization header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
        
        processQueue(null, accessToken)
        
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        
        // Clear tokens and redirect to login
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export const organizationApi = {
  // Get all organizations
  async getAll(): Promise<ApiResponse<Organization[]>> {
    try {
      const response = await apiClient.get('/organizations')
      return { success: true, data: response.data.data || [] }
    } catch (error: any) {
      console.error('Failed to fetch organizations:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch organizations',
        data: []
      }
    }
  },

  // Get organization statistics
  async getStats(): Promise<ApiResponse<{
    totalOrganizations: number
    cooperativeOrganizations: number
    managerOrganizations: number
    averageCooperativesPerManager: number
    totalStaff: number
    organizationGrowth: number
  }>> {
    try {
      const response = await apiClient.get('/organizations/stats')
      return { success: true, data: response.data }
    } catch (error: any) {
      console.error('Failed to fetch organization stats:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch organization statistics',
        data: {
          totalOrganizations: 0,
          cooperativeOrganizations: 0,
          managerOrganizations: 0,
          averageCooperativesPerManager: 0,
          totalStaff: 0,
          organizationGrowth: 0,
        },
      }
    }
  },

  // Create organization
  async create(organizationData: CreateOrganizationDto): Promise<ApiResponse<Organization>> {
    try {
      const response = await apiClient.post('/organizations', organizationData)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      console.error('Failed to create organization:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create organization',
        data: {
          id: '',
          name: '',
          type: 'cooperative',
          cooperativesCount: 0,
          staffCount: 0,
          status: 'inactive',
          totalRevenue: 0,
          createdAt: new Date(0).toISOString(),
          contactInfo: {},
        },
      }
    }
  },

  // Get specific organization details
  async getById(organizationId: string): Promise<ApiResponse<Organization>> {
    try {
      const response = await apiClient.get(`/organizations/${organizationId}`)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      console.error('Failed to fetch organization:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch organization',
        data: {
          id: '',
          name: '',
          type: 'cooperative',
          cooperativesCount: 0,
          staffCount: 0,
          status: 'inactive',
          totalRevenue: 0,
          createdAt: new Date(0).toISOString(),
          contactInfo: {},
        },
      }
    }
  },

  // Get organization stats (per organization)
  async getOrganizationStats(organizationId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/organizations/${organizationId}/stats`)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      console.error('Failed to fetch organization stats:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch organization stats',
        data: null,
      }
    }
  },

  // Get organization staff
  async getStaff(organizationId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<{ staff: OrganizationStaff[], total: number, totalPages: number, currentPage: number }>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      
      const response = await apiClient.get(`/organizations/${organizationId}/staff?${params}`)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      console.error('Failed to fetch organization staff:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch organization staff',
        data: {
          staff: [],
          total: 0,
          totalPages: 0,
          currentPage: page,
        },
      }
    }
  },

  // Add staff to organization
  async addStaff(organizationId: string, staffData: AddStaffDto): Promise<ApiResponse<OrganizationStaff>> {
    try {
      const response = await apiClient.post(`/organizations/${organizationId}/staff`, staffData)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      console.error('Failed to add staff to organization:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to add staff to organization',
        data: {
          id: '',
          userId: '',
          organizationId: '',
          role: 'field_agent',
          permissions: [],
          hiredAt: new Date(0).toISOString(),
          user: {
            id: '',
            firstName: '',
            lastName: '',
            email: '',
          },
        },
      }
    }
  },

  // Remove staff from organization
  async removeStaff(organizationId: string, staffId: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete(`/organizations/${organizationId}/staff/${staffId}`)
      return { success: true, data: undefined }
    } catch (error: any) {
      console.error('Failed to remove staff from organization:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to remove staff from organization',
        data: undefined,
      }
    }
  },
}