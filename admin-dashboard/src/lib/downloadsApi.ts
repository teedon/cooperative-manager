import { api } from './api';

export interface AppFile {
  platform: string;
  fileName: string;
  exists: boolean;
  size?: number;
  lastModified?: string;
}

export interface DownloadStats {
  total: number;
  byPlatform: {
    android?: number;
    ios?: number;
  };
  last30Days: number;
  dailyDownloads: Array<{
    date: string;
    count: number;
  }>;
  totalDownloads?: number;
  recentDownloads?: Array<{
    platform: string;
    version: string;
    downloadedAt: string;
    ipAddress?: string;
  }>;
}

export const downloadsApi = {
  /**
   * Get download statistics
   */
  getStats: async (): Promise<DownloadStats> => {
    const response = await api.get('/downloads/stats');
    return response.data;
  },

  /**
   * Upload app file (requires authentication)
   */
  uploadApp: async (platform: 'android' | 'ios', file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(
      `/downloads/upload/${platform}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * List available app files (requires authentication)
   */
  listFiles: async (): Promise<{ files: AppFile[] }> => {
    const response = await api.get('/downloads/files');
    return response.data;
  },

  /**
   * Delete app file (requires authentication)
   */
  deleteApp: async (platform: 'android' | 'ios') => {
    const response = await api.delete(`/downloads/app/${platform}`);
    return response.data;
  },

  /**
   * Send update notification
   */
  sendUpdateNotification: async (
    platform: 'android' | 'ios' | 'all',
    version: string,
    forceUpdate: boolean = false
  ) => {
    const response = await api.post(
      `/downloads/notify-update/${platform}?version=${version}&forceUpdate=${forceUpdate}`
    );
    return response.data;
  },
};
