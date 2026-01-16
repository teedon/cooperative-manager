import apiClient from './client';
import { ApiResponse } from '../models';

// ============ ORGANIZATION TYPES ============

export interface Organization {
  id: string;
  name: string;
  type: 'cooperative' | 'manager';
  userId?: string;
  cooperativeId?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
  // Computed fields (from relations count)
  cooperativesCount?: number;
  staffCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationDto {
  name: string;
  type?: 'cooperative' | 'manager';
  cooperativeId?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
}

// ============ STAFF TYPES ============

export interface Staff {
  id: string;
  organizationId: string;
  userId: string;
  role: 'admin' | 'supervisor' | 'agent';
  permissions: string[];
  isActive: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffDto {
  userId: string;
  role: 'admin' | 'supervisor' | 'agent';
  permissions: string[];
}

export interface UpdateStaffDto {
  role?: 'admin' | 'supervisor' | 'agent';
  permissions?: string[];
  isActive?: boolean;
}

export interface StaffGroupAssignment {
  id: string;
  staffId: string;
  cooperativeId: string;
  groupName: string;
  groupType: string;
  assignedBy: string;
  assignedAt: string;
  isActive: boolean;
}

// Available permissions
export const STAFF_PERMISSIONS = {
  MANAGE_COLLECTIONS: 'MANAGE_COLLECTIONS',
  APPROVE_COLLECTIONS: 'APPROVE_COLLECTIONS',
  VIEW_REPORTS: 'VIEW_REPORTS',
  MANAGE_STAFF: 'MANAGE_STAFF',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
} as const;

// ============ API METHODS ============

export const organizationsApi = {
  // ============ ORGANIZATIONS ============

  // Create organization
  create: async (data: CreateOrganizationDto): Promise<ApiResponse<Organization>> => {
    const response = await apiClient.post<ApiResponse<Organization>>(
      '/organizations',
      data
    );
    return response.data;
  },

  // Get all user's organizations
  getAll: async (): Promise<ApiResponse<Organization[]>> => {
    const response = await apiClient.get<ApiResponse<Organization[]>>(
      '/organizations'
    );
    return response.data;
  },

  // Get single organization
  getById: async (organizationId: string): Promise<ApiResponse<Organization>> => {
    const response = await apiClient.get<ApiResponse<Organization>>(
      `/organizations/${organizationId}`
    );
    return response.data;
  },

  // Update organization
  update: async (
    organizationId: string,
    data: UpdateOrganizationDto
  ): Promise<ApiResponse<Organization>> => {
    const response = await apiClient.patch<ApiResponse<Organization>>(
      `/organizations/${organizationId}`,
      data
    );
    return response.data;
  },

  // Delete organization
  delete: async (organizationId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/organizations/${organizationId}`
    );
    return response.data;
  },

  // ============ STAFF MANAGEMENT ============

  // Create staff member
  createStaff: async (
    organizationId: string,
    data: CreateStaffDto
  ): Promise<ApiResponse<Staff>> => {
    const response = await apiClient.post<ApiResponse<Staff>>(
      `/organizations/${organizationId}/staff`,
      data
    );
    return response.data;
  },

  // Get all staff in organization
  getAllStaff: async (organizationId: string): Promise<ApiResponse<Staff[]>> => {
    const response = await apiClient.get<ApiResponse<Staff[]>>(
      `/organizations/${organizationId}/staff`
    );
    return response.data;
  },

  // Get single staff member
  getStaffById: async (
    organizationId: string,
    staffId: string
  ): Promise<ApiResponse<Staff>> => {
    const response = await apiClient.get<ApiResponse<Staff>>(
      `/organizations/${organizationId}/staff/${staffId}`
    );
    return response.data;
  },

  // Update staff member
  updateStaff: async (
    organizationId: string,
    staffId: string,
    data: UpdateStaffDto
  ): Promise<ApiResponse<Staff>> => {
    const response = await apiClient.patch<ApiResponse<Staff>>(
      `/organizations/${organizationId}/staff/${staffId}`,
      data
    );
    return response.data;
  },

  // Delete staff member
  deleteStaff: async (
    organizationId: string,
    staffId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/organizations/${organizationId}/staff/${staffId}`
    );
    return response.data;
  },

  // ============ STAFF GROUP ASSIGNMENTS ============

  // Assign staff to cooperative/group
  assignStaffToGroup: async (
    organizationId: string,
    staffId: string,
    data: {
      cooperativeId: string;
      groupName?: string;
      groupType?: string;
    }
  ): Promise<ApiResponse<StaffGroupAssignment>> => {
    const response = await apiClient.post<ApiResponse<StaffGroupAssignment>>(
      `/organizations/${organizationId}/staff/${staffId}/assignments`,
      data
    );
    return response.data;
  },

  // Get staff assignments
  getStaffAssignments: async (
    organizationId: string,
    staffId: string
  ): Promise<ApiResponse<StaffGroupAssignment[]>> => {
    const response = await apiClient.get<ApiResponse<StaffGroupAssignment[]>>(
      `/organizations/${organizationId}/staff/${staffId}/assignments`
    );
    return response.data;
  },

  // Get current user's staff profile
  getMyStaffProfile: async (organizationId: string): Promise<ApiResponse<Staff>> => {
    const response = await apiClient.get<ApiResponse<Staff>>(
      `/organizations/${organizationId}/staff/me`
    );
    return response.data;
  },
};
