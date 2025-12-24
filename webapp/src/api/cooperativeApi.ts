import apiClient from './client';

export interface Cooperative {
  id: string;
  name: string;
  description?: string;
  code: string;
  gradientStart?: string;
  gradientEnd?: string;
  memberCount: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  cooperativeId: string;
  userId?: string;
  role: 'admin' | 'moderator' | 'member';
  roleTitle?: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
  isOfflineMember: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  joinedAt: string;
}

export interface CreateCooperativeData {
  name: string;
  description?: string;
}

export interface JoinCooperativeData {
  code: string;
}

export const cooperativeApi = {
  // Get all cooperatives for the user
  getAll: async (): Promise<Cooperative[]> => {
    const response = await apiClient.get<Cooperative[]>('/cooperatives');
    return response.data;
  },

  // Get a single cooperative
  getById: async (id: string): Promise<Cooperative> => {
    const response = await apiClient.get<Cooperative>(`/cooperatives/${id}`);
    return response.data;
  },

  // Create a new cooperative
  create: async (data: CreateCooperativeData): Promise<Cooperative> => {
    const response = await apiClient.post<Cooperative>('/cooperatives', data);
    return response.data;
  },

  // Join a cooperative by code
  join: async (data: JoinCooperativeData): Promise<{ cooperative: Cooperative; member: Member }> => {
    const response = await apiClient.post<{ cooperative: Cooperative; member: Member }>(
      '/cooperatives/join',
      data
    );
    return response.data;
  },

  // Get cooperative members
  getMembers: async (cooperativeId: string): Promise<Member[]> => {
    const response = await apiClient.get<Member[]>(`/cooperatives/${cooperativeId}/members`);
    return response.data;
  },

  // Get current user's membership
  getMyMembership: async (cooperativeId: string): Promise<Member> => {
    const response = await apiClient.get<Member>(`/cooperatives/${cooperativeId}/my-membership`);
    return response.data;
  },

  // Update cooperative settings
  update: async (id: string, data: Partial<Cooperative>): Promise<Cooperative> => {
    const response = await apiClient.patch<Cooperative>(`/cooperatives/${id}`, data);
    return response.data;
  },

  // Update member role
  updateMemberRole: async (
    cooperativeId: string,
    memberId: string,
    role: string,
    roleTitle?: string,
    permissions?: string[]
  ): Promise<Member> => {
    const response = await apiClient.patch<Member>(
      `/cooperatives/${cooperativeId}/members/${memberId}/role`,
      { role, roleTitle, permissions }
    );
    return response.data;
  },

  // Remove member
  removeMember: async (cooperativeId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/cooperatives/${cooperativeId}/members/${memberId}`);
  },

  // Leave cooperative
  leave: async (cooperativeId: string): Promise<void> => {
    await apiClient.post(`/cooperatives/${cooperativeId}/leave`);
  },
};

export default cooperativeApi;
