import apiClient from './cooperativeApi'

// Types
export interface CooperativeFee {
  id: string
  cooperativeId: string
  name: string
  description?: string
  amount: number
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  totalPaid?: number
  myPaid?: number
  _count?: {
    payments: number
  }
}

export interface CooperativeFeePayment {
  id: string
  feeId: string
  memberId: string
  amount: number
  paymentDate?: string
  paymentMethod?: 'bank_transfer' | 'cash' | 'mobile_money' | 'card'
  paymentReference?: string
  receiptUrl?: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  recordedBy?: string
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
  fee?: CooperativeFee
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
}

export interface CreateFeeDto {
  name: string
  description?: string
  amount: number
  isActive?: boolean
}

export interface UpdateFeeDto extends Partial<CreateFeeDto> {}

export interface RecordFeePaymentDto {
  memberId?: string
  amount: number
  paymentDate?: string
  paymentMethod?: 'bank_transfer' | 'cash' | 'mobile_money' | 'card'
  paymentReference?: string
  receiptUrl?: string
  notes?: string
}

export interface ApproveFeePaymentDto {
  status: 'approved' | 'rejected'
  rejectionReason?: string
}

// API Methods
export const feeApi = {
  getFees: async (cooperativeId: string) => {
    const response = await apiClient.get(`/fees/cooperatives/${cooperativeId}`)
    return response.data
  },

  createFee: async (cooperativeId: string, data: CreateFeeDto) => {
    const response = await apiClient.post(`/fees/cooperatives/${cooperativeId}`, data)
    return response.data
  },

  updateFee: async (feeId: string, data: UpdateFeeDto) => {
    const response = await apiClient.patch(`/fees/${feeId}`, data)
    return response.data
  },

  recordFeePayment: async (feeId: string, data: RecordFeePaymentDto) => {
    const response = await apiClient.post(`/fees/${feeId}/payments`, data)
    return response.data
  },

  getFeePayments: async (feeId: string, params?: { memberId?: string; status?: string }) => {
    const response = await apiClient.get(`/fees/${feeId}/payments`, { params })
    return response.data
  },

  getPendingPayments: async (cooperativeId: string) => {
    const response = await apiClient.get(`/fees/cooperatives/${cooperativeId}/pending-payments`)
    return response.data
  },

  getMyPayments: async (cooperativeId: string) => {
    const response = await apiClient.get(`/fees/cooperatives/${cooperativeId}/my-payments`)
    return response.data
  },

  approveFeePayment: async (paymentId: string, data: ApproveFeePaymentDto) => {
    const response = await apiClient.patch(`/fees/payments/${paymentId}/approve`, data)
    return response.data
  },
}
