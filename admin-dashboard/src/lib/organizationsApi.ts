import { api } from './api';

export interface Organization {
  id: string;
  name: string;
  type: 'cooperative' | 'manager';
  description?: string;
  cooperativesCount: number;
  staffCount: number;
  status: 'active' | 'inactive';
  totalRevenue: number;
  createdAt: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

export interface OrganizationStats {
  totalOrganizations: number;
  cooperativeOrganizations: number;
  managerOrganizations: number;
  averageCooperativesPerManager: number;
  totalStaff: number;
  organizationGrowth: number;
}

export interface OrganizationStaff {
  id: string;
  userId: string;
  role: string;
  permissions: string[];
  employeeCode?: string;
  isActive: boolean;
  hiredAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
}

export interface CreateOrganizationData {
  name: string;
  type: 'cooperative' | 'manager';
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface AddUserData {
  userId: string;
  role: 'admin' | 'supervisor' | 'field_agent' | 'accountant';
  permissions: string[];
  employeeCode?: string;
}

export interface OrganizationsResponse {
  organizations: Organization[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface OrganizationStaffResponse {
  staff: OrganizationStaff[];
  total: number;
  totalPages: number;
  currentPage: number;
}

class OrganizationsApi {
  async getOrganizations(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: 'cooperative' | 'manager';
  }): Promise<OrganizationsResponse> {
    const response = await api.get('/admin/organizations', { params });
    return response.data;
  }

  async getOrganizationStats(): Promise<OrganizationStats> {
    const response = await api.get('/admin/organizations/stats');
    return response.data;
  }

  async createOrganization(data: CreateOrganizationData): Promise<{
    success: boolean;
    message: string;
    organization?: Organization;
  }> {
    const response = await api.post('/admin/organizations', data);
    return response.data;
  }

  async updateOrganizationStatus(
    organizationId: string,
    status: 'active' | 'inactive'
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/admin/organizations/${organizationId}/status`, null, {
      params: { status }
    });
    return response.data;
  }

  async getOrganizationStaff(
    organizationId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<OrganizationStaffResponse> {
    const response = await api.get(`/admin/organizations/${organizationId}/staff`, { params });
    return response.data;
  }

  async addUserToOrganization(
    organizationId: string,
    data: AddUserData
  ): Promise<{ success: boolean; message: string; staff?: OrganizationStaff }> {
    const response = await api.post(`/admin/organizations/${organizationId}/staff`, data);
    return response.data;
  }
}

export const organizationsApi = new OrganizationsApi();