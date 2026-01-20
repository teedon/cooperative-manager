import axios from 'axios'

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

export const downloadsApi = {
  // Get download URL for app
  downloadApp(platform: 'ios' | 'android' | 'web'): string {
    // For now, return placeholder URLs
    // In production, these would come from the backend
    switch (platform) {
      case 'ios':
        return 'https://apps.apple.com/app/cooperative-manager'
      case 'android':
        return 'https://play.google.com/store/apps/details?id=com.cooperativemanager'
      case 'web':
        return window.location.origin
      default:
        return window.location.origin
    }
  },

  // Get app versions
  async getAppVersions(): Promise<{ success: boolean, data?: any[], message?: string }> {
    try {
      const response = await apiClient.get('/admin/app-versions')
      return { success: true, data: response.data }
    } catch (error: any) {
      console.error('Failed to fetch app versions:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch app versions'
      }
    }
  }
}