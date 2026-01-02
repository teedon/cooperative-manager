import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export interface DownloadStats {
  total: number
  byPlatform: {
    android?: number
    ios?: number
    web?: number
  }
  last30Days: number
  dailyDownloads: Array<{
    date: string
    count: number
  }>
}

export const downloadsApi = {
  /**
   * Trigger app download - this will automatically track the download
   */
  downloadApp: (platform: 'android' | 'ios' | 'web') => {
    // Return the download URL - browser will handle the download
    return `${API_BASE_URL}/downloads/app/${platform}`
  },

  /**
   * Get download statistics
   */
  getStats: async (platform?: 'android' | 'ios' | 'web'): Promise<DownloadStats> => {
    const params = platform ? { platform } : {}
    const response = await axios.get(`${API_BASE_URL}/downloads/stats`, { params })
    return response.data
  },

  /**
   * Upload app file (requires authentication)
   */
  uploadApp: async (platform: 'android' | 'ios' | 'web', file: File, token: string) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post(
      `${API_BASE_URL}/downloads/upload/${platform}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return response.data
  },

  /**
   * List available app files (requires authentication)
   */
  listFiles: async (token: string) => {
    const response = await axios.get(`${API_BASE_URL}/downloads/files`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  },
}
