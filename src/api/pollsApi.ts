import apiClient from './client';

export interface PollOption {
  id: string;
  text: string;
  sortOrder: number;
  voteCount: number;
  percentage: number;
  isSelected: boolean;
  voters: string[];
}

export interface Poll {
  id: string;
  cooperativeId: string;
  createdByUserId: string;
  createdByName: string;
  question: string;
  description?: string;
  allowMultipleVotes: boolean;
  isAnonymous: boolean;
  endsAt?: string;
  isActive: boolean;
  isPinned: boolean;
  hasEnded: boolean;
  createdAt: string;
  updatedAt: string;
  totalVotes: number;
  totalVoters: number;
  userVotedOptionIds: string[];
  hasVoted: boolean;
  options: PollOption[];
}

export interface CreatePollData {
  cooperativeId: string;
  question: string;
  description?: string;
  options: { text: string }[];
  allowMultipleVotes?: boolean;
  isAnonymous?: boolean;
  endsAt?: string;
}

export interface PollsResponse {
  polls: Poll[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetPollsQuery {
  page?: number;
  limit?: number;
  activeOnly?: boolean;
}

export const pollsApi = {
  // Get all polls for a cooperative
  getAll: async (cooperativeId: string, query?: GetPollsQuery): Promise<PollsResponse> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.activeOnly !== undefined) params.append('activeOnly', String(query.activeOnly));

    const response = await apiClient.get<PollsResponse>(
      `/polls/cooperative/${cooperativeId}?${params.toString()}`,
    );
    return response.data;
  },

  // Get a single poll
  getById: async (pollId: string): Promise<{ data: Poll }> => {
    const response = await apiClient.get<Poll>(`/polls/${pollId}`);
    return { data: response.data };
  },

  // Create a new poll
  create: async (data: CreatePollData): Promise<{ data: Poll }> => {
    const response = await apiClient.post<Poll>('/polls', data);
    return { data: response.data };
  },

  // Cast a vote
  vote: async (pollId: string, optionId: string): Promise<{ data: Poll }> => {
    const response = await apiClient.post<Poll>(`/polls/${pollId}/vote`, { optionId });
    return { data: response.data };
  },

  // Close a poll
  close: async (pollId: string): Promise<{ data: Poll }> => {
    const response = await apiClient.post<Poll>(`/polls/${pollId}/close`);
    return { data: response.data };
  },

  // Pin a poll
  pin: async (pollId: string): Promise<{ data: Poll }> => {
    const response = await apiClient.post<Poll>(`/polls/${pollId}/pin`);
    return { data: response.data };
  },

  // Unpin a poll
  unpin: async (pollId: string): Promise<{ data: Poll }> => {
    const response = await apiClient.post<Poll>(`/polls/${pollId}/unpin`);
    return { data: response.data };
  },

  // Delete a poll
  delete: async (pollId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete<{ success: boolean }>(`/polls/${pollId}`);
    return response.data;
  },
};
