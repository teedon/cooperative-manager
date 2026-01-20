import axios from 'axios'
import type { User, ApiResponse } from '../types'

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

// Admin User Management API
export const adminUserApi = {
  // Get all users with pagination and filtering
  getUsers: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: 'active' | 'inactive'
  }): Promise<ApiResponse<{
    users: User[]
    total: number
    totalPages: number
    currentPage: number
  }>> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.status) queryParams.append('status', params.status)

    const response = await apiClient.get(`/admin/users?${queryParams}`)
    return response.data
  },

  // Create a new user
  createUser: async (userData: {
    email: string
    password: string
    firstName?: string
    lastName?: string
    phone?: string
    avatarUrl?: string
  }): Promise<ApiResponse<User>> => {
    const response = await apiClient.post('/admin/users', userData)
    return response.data
  },

  // Update user status
  updateUserStatus: async (userId: string, status: 'active' | 'inactive'): Promise<ApiResponse<void>> => {
    const response = await apiClient.put(`/admin/users/${userId}/status?status=${status}`)
    return response.data
  },

  // Get user details
  getUser: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/admin/users/${userId}`)
    return response.data
  },

  // Update user
  updateUser: async (userId: string, userData: Partial<{
    firstName: string
    lastName: string
    phone: string
    avatarUrl: string
  }>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put(`/admin/users/${userId}`, userData)
    return response.data
  },

  // Delete user
  deleteUser: async (userId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/admin/users/${userId}`)
    return response.data
  }
}