// User and Authentication Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

// Cooperative Types
export type MemberRole = 'admin' | 'moderator' | 'member'
export type CooperativeStatus = 'active' | 'inactive' | 'suspended'

export type PredefinedRoleType =
  | 'president'
  | 'vice_president'
  | 'secretary'
  | 'financial_secretary'
  | 'treasurer'
  | 'pro'
  | 'auditor'
  | 'welfare_officer'

export interface PredefinedRole {
  role: PredefinedRoleType
  label: string
  description: string
  permissions: string[]
}

export interface Cooperative {
  id: string
  name: string
  code: string
  description?: string
  imageUrl?: string
  useGradient?: boolean
  gradientPreset?: string
  status: CooperativeStatus
  memberCount: number
  totalContributions: number
  totalExpenses: number
  createdAt: string
  updatedAt: string
  memberRole?: MemberRole
  userTotalContributions?: number
}

export interface CooperativeMember {
  id: string
  cooperativeId: string
  userId?: string
  user?: User
  role: MemberRole
  roleTitle?: PredefinedRoleType
  permissions?: string[]
  joinedAt: string
  virtualBalance: number | null
  status: 'active' | 'pending' | 'suspended' | 'removed'
  isOfflineMember?: boolean
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

// Contribution Types
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
  createdAt: string
  totalSubscribers?: number
  totalContributions?: number
}

export interface ContributionRecord {
  id: string
  cooperativeId: string
  planId: string
  memberId: string
  amount: number
  dueDate: string
  paidDate?: string
  status: 'pending' | 'approved' | 'rejected' | 'overdue'
  paymentMethod?: string
  paymentReference?: string
  createdAt: string
}

// Loan Types
export interface LoanType {
  id: string
  cooperativeId: string
  name: string
  description?: string
  minAmount: number
  maxAmount: number
  minDuration: number
  maxDuration: number
  interestRate: number
  interestType: 'flat' | 'reducing_balance'
  isActive: boolean
  createdAt: string
}

export interface LoanRequest {
  id: string
  cooperativeId: string
  memberId: string
  loanTypeId?: string
  amount: number
  purpose: string
  duration: number
  interestRate: number
  totalRepayment: number
  monthlyRepayment: number
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'completed' | 'defaulted'
  requestedAt: string
  approvedAt?: string
  disbursedAt?: string
  member?: CooperativeMember
  loanType?: LoanType
}

// Activity Types
export interface Activity {
  id: string
  userId: string
  user?: {
    id: string
    firstName: string
    lastName: string
    avatarUrl?: string
  }
  cooperativeId?: string
  cooperative?: {
    id: string
    name: string
    code: string
  }
  action: string
  description: string
  metadata?: Record<string, any>
  createdAt: string
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}
