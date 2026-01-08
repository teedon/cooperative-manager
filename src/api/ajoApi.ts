import client from './client';
import { Ajo, AjoSettings, AjoMember, AjoPayment, AjoStatement } from '../models';

export interface CreateAjoRequest {
  title: string;
  description?: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate?: string;
  isContinuous: boolean;
  memberIds: string[];
}

export interface UpdateAjoRequest {
  title?: string;
  description?: string;
  amount?: number;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  isContinuous?: boolean;
  status?: string;
}

export interface RecordAjoPaymentRequest {
  memberId: string;
  amount: number;
  paymentMethod: 'cash' | 'transfer' | 'wallet';
  referenceNumber?: string;
  notes?: string;
  paymentDate?: string;
}

export interface UpdateAjoSettingsRequest {
  commissionRate: number;
  interestRate: number;
}

export const ajoApi = {
  // Get Ajo settings
  getSettings: async (cooperativeId: string): Promise<AjoSettings> => {
    const response = await client.get(`/ajo/cooperatives/${cooperativeId}/settings`);
    return response.data;
  },

  // Update Ajo settings
  updateSettings: async (
    cooperativeId: string,
    data: UpdateAjoSettingsRequest,
  ): Promise<AjoSettings> => {
    const response = await client.put(`/ajo/cooperatives/${cooperativeId}/settings`, data);
    return response.data;
  },

  // Create a new Ajo
  create: async (cooperativeId: string, data: CreateAjoRequest): Promise<Ajo> => {
    const response = await client.post(`/ajo/cooperatives/${cooperativeId}`, data);
    return response.data;
  },

  // Get all Ajos for a cooperative
  getAll: async (cooperativeId: string): Promise<Ajo[]> => {
    const response = await client.get(`/ajo/cooperatives/${cooperativeId}`);
    return response.data;
  },

  // Get a single Ajo
  getOne: async (ajoId: string): Promise<Ajo> => {
    const response = await client.get(`/ajo/${ajoId}`);
    return response.data;
  },

  // Update an Ajo
  update: async (ajoId: string, data: UpdateAjoRequest): Promise<Ajo> => {
    const response = await client.put(`/ajo/${ajoId}`, data);
    return response.data;
  },

  // Respond to Ajo invitation
  respondToInvitation: async (ajoId: string, status: 'accepted' | 'declined'): Promise<AjoMember> => {
    const response = await client.post(`/ajo/${ajoId}/respond`, { status });
    return response.data;
  },

  // Record a payment
  recordPayment: async (ajoId: string, data: RecordAjoPaymentRequest): Promise<AjoPayment> => {
    const response = await client.post(`/ajo/${ajoId}/payments`, data);
    return response.data;
  },

  // Get member statement
  getMemberStatement: async (ajoId: string, memberId: string): Promise<AjoStatement> => {
    const response = await client.get(`/ajo/${ajoId}/members/${memberId}/statement`);
    return response.data;
  },

  // Get user's pending invitations
  getPendingInvitations: async (): Promise<AjoMember[]> => {
    const response = await client.get('/ajo/my/pending-invitations');
    return response.data;
  },
};
