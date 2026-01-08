import apiClient from './client';

// Types
export interface EsusuSettings {
  id: string;
  cooperativeId: string;
  commissionRate: number;
  defaultFrequency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Esusu {
  id: string;
  cooperativeId: string;
  title: string;
  description?: string;
  contributionAmount: number;
  frequency: string;
  orderType: string;
  totalCycles: number;
  currentCycle: number;
  startDate: string;
  invitationDeadline: string;
  isOrderDetermined: boolean;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members?: EsusuMember[];
  contributions?: EsusuContribution[];
  collections?: EsusuCollection[];
  _count?: {
    members: number;
    contributions: number;
    collections: number;
  };
}

export interface EsusuMember {
  id: string;
  esusuId: string;
  memberId: string;
  collectionOrder?: number;
  status: string;
  hasCollected: boolean;
  collectionCycle?: number;
  invitedAt: string;
  acceptedAt?: string;
  member?: any;
  _count?: {
    contributions: number;
  };
}

export interface EsusuContribution {
  id: string;
  esusuId: string;
  memberId: string;
  cycleNumber: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
  member?: any;
}

export interface EsusuCollection {
  id: string;
  esusuId: string;
  memberId: string;
  cycleNumber: number;
  totalAmount: number;
  commission: number;
  netAmount: number;
  collectionDate: string;
  disbursedBy: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  member?: EsusuMember;
}

export interface CycleStatus {
  esusu: Esusu;
  currentCycle: number;
  totalCycles: number;
  contributions: EsusuContribution[];
  contributedCount: number;
  totalMembers: number;
  pendingMembers: EsusuMember[];
  currentCollector?: EsusuMember;
  isComplete: boolean;
}

export interface MemberStatement {
  member: any;
  esusuMember: EsusuMember;
  contributions: EsusuContribution[];
  collection?: EsusuCollection;
  totalContributed: number;
  netReceived: number;
  balance: number;
}

// API functions
export const esusuApi = {
  // Settings
  async getSettings(cooperativeId: string): Promise<EsusuSettings> {
    const response = await apiClient.get(`/esusu/cooperatives/${cooperativeId}/settings`);
    return response.data;
  },

  async updateSettings(cooperativeId: string, data: { commissionRate: number; defaultFrequency: string }): Promise<EsusuSettings> {
    const response = await apiClient.put(`/esusu/cooperatives/${cooperativeId}/settings`, data);
    return response.data;
  },

  // Esusu CRUD
  async create(
    cooperativeId: string,
    data: {
      title: string;
      description?: string;
      contributionAmount: number;
      frequency: string;
      orderType: string;
      startDate: string;
      invitationDeadline: string;
      memberIds: string[];
    },
  ): Promise<Esusu> {
    const response = await apiClient.post(`/esusu/cooperatives/${cooperativeId}`, data);
    return response.data;
  },

  async findAll(cooperativeId: string): Promise<Esusu[]> {
    const response = await apiClient.get(`/esusu/cooperatives/${cooperativeId}`);
    return response.data;
  },

  async findOne(esusuId: string): Promise<Esusu> {
    const response = await apiClient.get(`/esusu/${esusuId}`);
    return response.data;
  },

  async update(
    esusuId: string,
    data: {
      title?: string;
      description?: string;
      startDate?: string;
      invitationDeadline?: string;
    },
  ): Promise<Esusu> {
    const response = await apiClient.put(`/esusu/${esusuId}`, data);
    return response.data;
  },

  // Invitation
  async respondToInvitation(esusuId: string, status: 'accepted' | 'declined', preferredOrder?: number): Promise<EsusuMember> {
    const response = await apiClient.post(`/esusu/${esusuId}/respond`, { status, preferredOrder });
    return response.data;
  },

  async getAvailableSlots(esusuId: string): Promise<number[]> {
    const esusu = await this.findOne(esusuId);
    const takenSlots = esusu.members
      ?.filter(m => m.status === 'accepted' && m.collectionOrder)
      .map(m => m.collectionOrder!) || [];
    
    const allSlots = Array.from({ length: esusu.totalCycles }, (_, i) => i + 1);
    return allSlots.filter(slot => !takenSlots.includes(slot));
  },

  // Order determination
  async determineOrder(esusuId: string): Promise<Esusu> {
    const response = await apiClient.post(`/esusu/${esusuId}/determine-order`);
    return response.data;
  },

  async setOrder(esusuId: string, memberOrders: Array<{ memberId: string; order: number }>): Promise<Esusu> {
    const response = await apiClient.put(`/esusu/${esusuId}/set-order`, { memberOrders });
    return response.data;
  },

  // Contributions
  async recordContribution(
    esusuId: string,
    data: {
      memberId: string;
      amount: number;
      paymentMethod: string;
      referenceNumber?: string;
      notes?: string;
    },
  ): Promise<EsusuContribution> {
    const response = await apiClient.post(`/esusu/${esusuId}/contributions`, data);
    return response.data;
  },

  // Collection
  async processCollection(
    esusuId: string,
    data: {
      paymentMethod: string;
      referenceNumber?: string;
      notes?: string;
    },
  ): Promise<EsusuCollection> {
    const response = await apiClient.post(`/esusu/${esusuId}/collect`, data);
    return response.data;
  },

  // Status & Reports
  async getCycleStatus(esusuId: string): Promise<CycleStatus> {
    const response = await apiClient.get(`/esusu/${esusuId}/cycle-status`);
    return response.data;
  },

  async getMemberStatement(esusuId: string, memberId: string): Promise<MemberStatement> {
    const response = await apiClient.get(`/esusu/${esusuId}/members/${memberId}/statement`);
    return response.data;
  },

  async getPendingInvitations(): Promise<EsusuMember[]> {
    const response = await apiClient.get(`/esusu/my/pending-invitations`);
    return response.data;
  },
};
