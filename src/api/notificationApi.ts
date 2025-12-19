import apiClient from './client';
import { Notification, NotificationPreferences, ApiResponse } from '../models';

export const notificationApi = {
  // Get all notifications for the current user
  getAll: async (
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<{ notifications: Notification[]; unreadCount: number; total: number }>> => {
    const response = await apiClient.get<ApiResponse<{ notifications: Notification[]; unreadCount: number; total: number }>>(
      '/notifications',
      { params: { page, limit } }
    );
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<ApiResponse<Notification>> => {
    const response = await apiClient.patch<ApiResponse<Notification>>(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await apiClient.patch<ApiResponse<{ count: number }>>('/notifications/read-all');
    return response.data;
  },

  // Delete a notification
  delete: async (notificationId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(`/notifications/${notificationId}`);
    return response.data;
  },

  // Clear all notifications
  clearAll: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await apiClient.delete<ApiResponse<{ count: number }>>('/notifications');
    return response.data;
  },

  // Register FCM token
  registerFcmToken: async (token: string, platform: 'ios' | 'android'): Promise<ApiResponse<null>> => {
    const response = await apiClient.post<ApiResponse<null>>('/notifications/register-token', {
      token,
      platform,
    });
    return response.data;
  },

  // Unregister FCM token
  unregisterFcmToken: async (token: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post<ApiResponse<null>>('/notifications/unregister-token', { token });
    return response.data;
  },

  // Get notification preferences
  getPreferences: async (): Promise<ApiResponse<NotificationPreferences>> => {
    const response = await apiClient.get<ApiResponse<NotificationPreferences>>(
      '/notifications/preferences'
    );
    return response.data;
  },

  // Update notification preferences
  updatePreferences: async (
    preferences: Partial<NotificationPreferences>
  ): Promise<ApiResponse<NotificationPreferences>> => {
    const response = await apiClient.patch<ApiResponse<NotificationPreferences>>(
      '/notifications/preferences',
      preferences
    );
    return response.data;
  },
};

export default notificationApi;
