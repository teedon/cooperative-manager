import apiClient from './cooperativeApi'
import type { ApiResponse } from '../types'

export interface LoanType {
  id: string
  cooperativeId: string
  name: string
  description?: string
  interestRate: number
  minAmount: number
  maxAmount: number
  minDuration: number
  maxDuration: number
  requiresGuarantor: boolean
  maxActiveLoans: number
  isActive: boolean
  requiresApproval: boolean
  createdAt: string
  updatedAt: string
}

export interface Loan {
  id: string
  cooperativeId: string
  memberId: string
  loanTypeId: string
  amount: number
  interestRate: number
  duration: number
  purpose: string
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaying' | 'completed' | 'defaulted'
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  disbursedAt?: string
  disbursedAmount?: number
  totalRepayable: number
  amountPaid: number
  amountRemaining: number
  monthlyPayment: number
  nextPaymentDate?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  member?: {
    id: string
    userId?: string
    firstName?: string
    lastName?: string
    user?: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }
  loanType?: LoanType
  approver?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface RepaymentSchedule {
  id: string
  loanId: string
  scheduleNumber: number
  dueDate: string
  principalAmount: number
  interestAmount: number
  totalAmount: number
  paidAmount: number
  status: 'pending' | 'paid' | 'partial' | 'overdue'
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export interface Repayment {
  id: string
  loanId: string
  amount: number
  paymentMethod: string
  paymentReference?: string
  notes?: string
  recordedBy: string
  recordedAt: string
  createdAt: string
  updatedAt: string
}

export interface CreateLoanTypeDto {
  name: string
  description?: string
  interestRate: number
  interestType: 'flat' | 'reducing_balance'
  minAmount: number
  maxAmount: number
  minDuration: number
  maxDuration: number
  requiresGuarantor?: boolean
  minGuarantors?: number
  maxActiveLoans?: number
  requiresApproval?: boolean
}

export interface RequestLoanDto {
  loanTypeId: string
  amount: number
  purpose: string
  duration: number
}

export interface RecordRepaymentDto {
  amount: number
  paymentMethod: string
  paymentReference?: string
  notes?: string
}

export const loanApi = {
  // Loan Types
  getLoanTypes: async (cooperativeId: string): Promise<ApiResponse<LoanType[]>> => {
    const response = await apiClient.get<ApiResponse<LoanType[]>>(
      `/cooperatives/${cooperativeId}/loan-types`
    )
    return response.data
  },

  getLoanType: async (
    cooperativeId: string,
    loanTypeId: string
  ): Promise<ApiResponse<LoanType>> => {
    const response = await apiClient.get<ApiResponse<LoanType>>(
      `/cooperatives/${cooperativeId}/loan-types/${loanTypeId}`
    )
    return response.data
  },

  createLoanType: async (
    cooperativeId: string,
    data: CreateLoanTypeDto
  ): Promise<ApiResponse<LoanType>> => {
    const response = await apiClient.post<ApiResponse<LoanType>>(
      `/cooperatives/${cooperativeId}/loan-types`,
      data
    )
    return response.data
  },

  deleteLoanType: async (loanTypeId: string, cooperativeId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/cooperatives/${cooperativeId}/loan-types/${loanTypeId}`
    )
    return response.data
  },

  // Loans
  getLoans: async (cooperativeId: string): Promise<ApiResponse<Loan[]>> => {
    const response = await apiClient.get<ApiResponse<Loan[]>>(
      `/cooperatives/${cooperativeId}/loans`
    )
    return response.data
  },

  getPendingLoans: async (cooperativeId: string): Promise<ApiResponse<Loan[]>> => {
    const response = await apiClient.get<ApiResponse<Loan[]>>(
      `/loans/cooperatives/${cooperativeId}/loans/pending`
    )
    return response.data
  },

  getMyLoans: async (cooperativeId: string): Promise<ApiResponse<Loan[]>> => {
    const response = await apiClient.get<ApiResponse<Loan[]>>(
      `/loans/cooperatives/${cooperativeId}/loans/my-loans`
    )
    return response.data
  },

  getLoan: async (loanId: string): Promise<ApiResponse<Loan>> => {
    const response = await apiClient.get<ApiResponse<Loan>>(`/loans/loans/${loanId}`)
    return response.data
  },

  requestLoan: async (cooperativeId: string, data: RequestLoanDto): Promise<ApiResponse<Loan>> => {
    const response = await apiClient.post<ApiResponse<Loan>>(
      `/cooperatives/${cooperativeId}/loans`,
      data
    )
    return response.data
  },

  approveLoan: async (loanId: string): Promise<ApiResponse<Loan>> => {
    const response = await apiClient.post<ApiResponse<Loan>>(`/loans/loans/${loanId}/approve`)
    return response.data
  },

  rejectLoan: async (loanId: string, reason: string): Promise<ApiResponse<Loan>> => {
    const response = await apiClient.post<ApiResponse<Loan>>(`/loans/loans/${loanId}/reject`, {
      reason,
    })
    return response.data
  },

  disburseLoan: async (loanId: string): Promise<ApiResponse<Loan>> => {
    const response = await apiClient.post<ApiResponse<Loan>>(`/loans/loans/${loanId}/disburse`)
    return response.data
  },

  // Repayments
  getRepaymentSchedule: async (loanId: string): Promise<ApiResponse<RepaymentSchedule[]>> => {
    const response = await apiClient.get<ApiResponse<RepaymentSchedule[]>>(
      `/loans/loans/${loanId}/repayments`
    )
    return response.data
  },

  recordRepayment: async (
    loanId: string,
    data: RecordRepaymentDto
  ): Promise<ApiResponse<Repayment>> => {
    const response = await apiClient.post<ApiResponse<Repayment>>(
      `/loans/loans/${loanId}/repayments`,
      data
    )
    return response.data
  },
}
