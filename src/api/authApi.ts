import apiClient from './client';
import { User, LoginCredentials, SignupData, ApiResponse } from '../models';

interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data;
  },

  signup: async (data: SignupData): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    // backend returns an ApiResponse but we don't need it here
    await apiClient.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken?: string): Promise<ApiResponse<{ token: string; refreshToken?: string }>> => {
    // backend expects a body with refreshToken
    const response = await apiClient.post<ApiResponse<{ token: string; refreshToken?: string }>>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<{ resetToken?: string }>> => {
    const response = await apiClient.post<ApiResponse<{ resetToken?: string }>>('/auth/forgot-password', { email });
    return response.data;
  },

  verifyResetToken: async (token: string): Promise<ApiResponse<{ valid: boolean; email: string }>> => {
    const response = await apiClient.post<ApiResponse<{ valid: boolean; email: string }>>('/auth/verify-reset-token', { token });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  getPendingInvitations: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/auth/pending-invitations');
    return response.data;
  },

  acceptInvitation: async (invitationId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(`/auth/invitations/${invitationId}/accept`);
    return response.data;
  },

  // Profile Management
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>('/users/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<ApiResponse<User>> => {
    const response = await apiClient.put<ApiResponse<User>>('/users/profile', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<ApiResponse<null>> => {
    const response = await apiClient.post<ApiResponse<null>>('/users/change-password', data);
    return response.data;
  },

  deleteAccount: async (password: string, reason?: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>('/users/account', {
      data: { password, reason },
    });
    return response.data;
  },
};
