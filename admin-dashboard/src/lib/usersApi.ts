import { api } from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  status: 'active' | 'inactive' | 'suspended';
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreateAdminUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedAdminUsers {
  admins: AdminUser[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export const usersApi = {
  /**
   * Get paginated list of users
   */
  getUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}): Promise<PaginatedUsers> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  /**
   * Update user status
   */
  updateUserStatus: async (id: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> => {
    await api.patch(`/admin/users/${id}/status`, { status });
  },

  /**
   * Delete user
   */
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  /**
   * Create admin user
   */
  createAdminUser: async (data: CreateAdminUserData): Promise<AdminUser> => {
    const response = await api.post('/admin/users/admins', data);
    return response.data.data;
  },

  /**
   * Get paginated list of admin users
   */
  getAdminUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedAdminUsers> => {
    const response = await api.get('/admin/users/admins', { params });
    return response.data;
  },

  /**
   * Update admin user status
   */
  updateAdminStatus: async (id: string, status: 'active' | 'inactive'): Promise<void> => {
    await api.put(`/admin/users/admins/${id}/status?status=${status}`);
  },
};