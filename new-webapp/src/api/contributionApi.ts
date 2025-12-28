import apiClient from './cooperativeApi'

// Types
export interface ContributionPlan {
  id: string
  cooperativeId: string
  name: string
  description?: string
  category: 'compulsory' | 'optional'
  amountType: 'fixed' | 'notional'
  fixedAmount?: number
  minAmount?: number
  maxAmount?: number
  contributionType: 'continuous' | 'period'
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  startDate?: string
  endDate?: string
  isActive: boolean
  totalSubscribers?: number
  totalCollected?: number
  createdAt: string
  updatedAt: string
  _count?: {
    subscriptions: number
  }
}

export interface ContributionSubscription {
  id: string
  planId: string
  memberId: string
  amount: number
  status: 'active' | 'paused' | 'cancelled'
  subscribedAt: string
  updatedAt: string
  plan?: ContributionPlan
  member?: {
    id: string
    userId: string
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }
  _count?: {
    payments: number
  }
  totalPaid?: number
}

export interface ContributionPayment {
  id: string
  subscriptionId: string
  amount: number
  dueDate?: string
  paymentDate?: string
  paymentMethod?: 'bank_transfer' | 'cash' | 'mobile_money' | 'card'
  paymentReference?: string
  receiptUrl?: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
  subscription?: ContributionSubscription
}

export interface CreateContributionPlanDto {
  name: string
  description?: string
  category: 'compulsory' | 'optional'
  amountType: 'fixed' | 'notional'
  fixedAmount?: number
  minAmount?: number
  maxAmount?: number
  contributionType: 'continuous' | 'period'
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  startDate?: string
  endDate?: string
  isActive?: boolean
}

export interface UpdateContributionPlanDto extends Partial<CreateContributionPlanDto> {}

export interface SubscribeToContributionDto {
  amount: number
}

export interface UpdateSubscriptionDto {
  status?: 'active' | 'paused' | 'cancelled'
  amount?: number
}

export interface RecordPaymentDto {
  amount: number
  dueDate?: string
  paymentMethod?: 'bank_transfer' | 'cash' | 'mobile_money' | 'card'
  paymentReference?: string
  receiptUrl?: string
  notes?: string
}

export interface ApprovePaymentDto {
  status: 'approved' | 'rejected'
  rejectionReason?: string
}

// Bulk approval types
export interface ScheduleDateInfo {
  date: string
  totalMembers: number
  pendingCount: number
  paidCount: number
  pendingAmount: number
  isPast: boolean
  isToday: boolean
}

export interface PlanScheduleDatesResponse {
  plan: {
    id: string
    name: string
    frequency: string
    amount: number | null
    amountType: string
  }
  scheduleDates: ScheduleDateInfo[]
}

export interface ScheduleDateMember {
  scheduleId: string | null
  subscriptionId: string
  memberId: string
  member: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatarUrl?: string
    isOfflineMember?: boolean
  }
  amount: number
  status: string
  paidAmount: number | null
  paidAt: string | null
  hasSchedule: boolean
}

export interface ScheduleDateMembersResponse {
  plan: {
    id: string
    name: string
    frequency: string
    amount: number | null
    amountType: string
  }
  scheduleDate: string
  periodLabel: string | null
  totalMembers: number
  pendingCount: number
  paidCount: number
  missingScheduleCount: number
  totalPendingAmount: number
  members: ScheduleDateMember[]
}

export interface BulkApproveByDateData {
  planId: string
  scheduleDate: string
  excludeMemberIds?: string[]
  includeMissingSchedules?: boolean
  paymentMethod?: string
  notes?: string
}

export interface BulkApprovalResult {
  approvedCount: number
  createdSchedulesCount?: number
  totalAmount: number
  payments?: ContributionPayment[]
  planName?: string
  dateLabel?: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// API Methods
export const contributionApi = {
  // Plans
  getPlans: async (cooperativeId: string) => {
    const response = await apiClient.get(`/contributions/cooperatives/${cooperativeId}/plans`)
    return response.data
  },

  getPlan: async (planId: string) => {
    const response = await apiClient.get(`/contributions/plans/${planId}`)
    return response.data
  },

  createPlan: async (cooperativeId: string, data: CreateContributionPlanDto) => {
    const response = await apiClient.post(
      `/contributions/cooperatives/${cooperativeId}/plans`,
      data
    )
    return response.data
  },

  updatePlan: async (planId: string, data: UpdateContributionPlanDto) => {
    const response = await apiClient.put(`/contributions/plans/${planId}`, data)
    return response.data
  },

  deletePlan: async (planId: string) => {
    const response = await apiClient.delete(`/contributions/plans/${planId}`)
    return response.data
  },

  // Subscriptions
  subscribeToPlan: async (planId: string, data: SubscribeToContributionDto) => {
    const response = await apiClient.post(`/contributions/plans/${planId}/subscribe`, data)
    return response.data
  },

  updateSubscription: async (subscriptionId: string, data: UpdateSubscriptionDto) => {
    const response = await apiClient.put(
      `/contributions/subscriptions/${subscriptionId}`,
      data
    )
    return response.data
  },

  getMySubscriptions: async (cooperativeId: string) => {
    const response = await apiClient.get(
      `/contributions/cooperatives/${cooperativeId}/my-subscriptions`
    )
    return response.data
  },

  getPlanSubscriptions: async (planId: string) => {
    const response = await apiClient.get(`/contributions/plans/${planId}/subscriptions`)
    return response.data
  },

  // Payments
  recordPayment: async (subscriptionId: string, data: RecordPaymentDto) => {
    const response = await apiClient.post(
      `/contributions/subscriptions/${subscriptionId}/payments`,
      data
    )
    return response.data
  },

  getMyPayments: async (cooperativeId: string) => {
    const response = await apiClient.get(
      `/contributions/cooperatives/${cooperativeId}/my-payments`
    )
    return response.data
  },

  getPlanPayments: async (planId: string) => {
    const response = await apiClient.get(`/contributions/plans/${planId}/payments`)
    return response.data
  },

  getSubscriptionPayments: async (subscriptionId: string) => {
    const response = await apiClient.get(
      `/contributions/subscriptions/${subscriptionId}/payments`
    )
    return response.data
  },

  approvePayment: async (paymentId: string, data: ApprovePaymentDto) => {
    const response = await apiClient.put(`/contributions/payments/${paymentId}/approve`, data)
    return response.data
  },

  // Bulk approval methods
  getPlanScheduleDates: async (
    cooperativeId: string,
    planId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<PlanScheduleDatesResponse>> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const response = await apiClient.get<ApiResponse<PlanScheduleDatesResponse>>(
      `/contributions/cooperatives/${cooperativeId}/plans/${planId}/schedule-dates${queryString}`
    )
    return response.data
  },

  getMembersForScheduleDate: async (
    cooperativeId: string,
    planId: string,
    date: string
  ): Promise<ApiResponse<ScheduleDateMembersResponse>> => {
    const response = await apiClient.get<ApiResponse<ScheduleDateMembersResponse>>(
      `/contributions/cooperatives/${cooperativeId}/plans/${planId}/schedule-date-members?date=${encodeURIComponent(date)}`
    )
    return response.data
  },

  bulkApproveByDate: async (
    cooperativeId: string,
    data: BulkApproveByDateData
  ): Promise<ApiResponse<BulkApprovalResult>> => {
    const response = await apiClient.post<ApiResponse<BulkApprovalResult>>(
      `/contributions/cooperatives/${cooperativeId}/bulk-approve-by-date`,
      data
    )
    return response.data
  },
}
