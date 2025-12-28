import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Create axios instance for reports API
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Report types
export type ReportType =
  | 'contribution_summary'
  | 'member_balances'
  | 'loan_summary'
  | 'loan_repayment'
  | 'loan_interest'
  | 'expense_summary'
  | 'financial_statement'
  | 'member_activity'

export type ExportFormat = 'csv' | 'excel' | 'pdf'

export interface ReportTypeInfo {
  id: ReportType
  name: string
  description: string
  icon: string
}

export interface ReportOptions {
  startDate?: string
  endDate?: string
  memberId?: string
  planId?: string
}

export interface ReportMetadata {
  reportType: ReportType
  cooperativeId: string
  cooperativeName: string
  generatedAt: string
  generatedBy: string
  dateRange?: {
    startDate?: string
    endDate?: string
  }
  filters?: Record<string, string>
}

// Contribution Summary Report
export interface ContributionSummaryReport {
  metadata: ReportMetadata
  summary: {
    totalContributions: number
    totalPayments: number
    approvedPayments: number
    pendingPayments: number
    uniqueContributors: number
    memberCount?: number
    periodCount?: number
  }
  byPlan?: Array<{
    planId: string
    planName: string
    category: string
    totalAmount: number
    paymentCount: number
    subscriberCount: number
  }>
  byMonth?: Array<{
    month: string
    totalAmount: number
    paymentCount: number
  }>
  topContributors?: Array<{
    memberId: string
    memberName: string
    totalAmount: number
    paymentCount: number
  }>
}

// Member Balances Report
export interface MemberBalancesReport {
  metadata: ReportMetadata
  summary: {
    totalMembers: number
    totalBalance: number
    averageBalance: number
    totalContributions: number
    totalLoans: number
    totalOutstandingLoans?: number
  }
  members?: Array<{
    memberId: string
    memberName: string
    memberCode?: string
    isOfflineMember: boolean
    joinedAt: string
    totalContributions: number
    totalLoansTaken: number
    totalLoanRepayments: number
    currentBalance: number
  }>
}

// Loan Summary Report
export interface LoanSummaryReport {
  metadata: ReportMetadata
  summary: {
    totalLoansIssued: number
    totalAmountDisbursed?: number
    totalDisbursed?: number
    totalInterestEarned: number
    totalApplicationFees: number
    activeLoans: number
    repaidLoans: number
    defaultedLoans?: number
    totalRepaid?: number
    totalOutstanding?: number
    repaymentRate?: number
  }
  byStatus?: Array<{
    status: string
    count: number
    totalAmount: number
  }>
  byMonth?: Array<{
    month: string
    disbursed: number
    repaid: number
    count: number
  }>
}

// Loan Interest Report
export interface LoanInterestReport {
  metadata: ReportMetadata
  summary: {
    totalInterestEarned: number
    totalInterestExpected?: number
    totalInterestPending: number
    averageInterestRate: number
    totalLoansWithInterest: number
    interestEarnedThisPeriod?: number
  }
  byLoanType?: Array<{
    loanTypeId: string
    loanTypeName: string
    interestRate: number
    totalLoans: number
    totalPrincipal: number
    totalInterestExpected: number
    totalInterestEarned: number
    interestPending: number
  }>
}

// Expense Summary Report
export interface ExpenseSummaryReport {
  metadata: ReportMetadata
  summary: {
    totalExpenses: number
    approvedExpenses: number
    pendingExpenses: number
    rejectedExpenses?: number
    expenseCount: number
  }
  byCategory?: Array<{
    category: string
    totalAmount: number
    count: number
    approvedAmount: number
    pendingAmount: number
  }>
  data?: any[]
}

// Financial Statement Report
export interface FinancialStatementReport {
  metadata: ReportMetadata
  summary: {
    totalIncome: number
    totalExpenses: number
    netBalance: number
  }
  incomeStatement?: {
    income: {
      contributions: number
      loanInterest: number
      applicationFees: number
      lateFees?: number
      otherIncome?: number
      totalIncome: number
    }
    expenses: {
      operatingExpenses: number
      loanWriteOffs?: number
      otherExpenses?: number
      totalExpenses: number
    }
    netIncome: number
  }
}

// Member Activity Report
export interface MemberActivityReport {
  metadata: ReportMetadata
  summary?: {
    totalMembers: number
    activeMembers: number
    inactiveMembers: number
    newMembers: number
  }
  data?: any[]
}

// Generic Report type
export type Report =
  | ContributionSummaryReport
  | MemberBalancesReport
  | LoanSummaryReport
  | LoanInterestReport
  | ExpenseSummaryReport
  | FinancialStatementReport
  | MemberActivityReport

// API Functions

/**
 * Generate a report
 */
export const generateReport = async (
  cooperativeId: string,
  reportType: ReportType,
  options?: ReportOptions
): Promise<Report> => {
  const params = new URLSearchParams()
  params.append('reportType', reportType)
  if (options?.startDate) params.append('startDate', options.startDate)
  if (options?.endDate) params.append('endDate', options.endDate)
  if (options?.memberId) params.append('memberId', options.memberId)
  if (options?.planId) params.append('planId', options.planId)

  const response = await apiClient.get<{ success: boolean; message: string; data: Report }>(
    `/reports/cooperatives/${cooperativeId}/generate?${params.toString()}`
  )
  return response.data.data
}

/**
 * Export report to CSV
 */
export const exportReportCSV = async (
  cooperativeId: string,
  reportType: ReportType,
  options?: ReportOptions
): Promise<Blob> => {
  const params = new URLSearchParams()
  params.append('reportType', reportType)
  if (options?.startDate) params.append('startDate', options.startDate)
  if (options?.endDate) params.append('endDate', options.endDate)
  if (options?.memberId) params.append('memberId', options.memberId)
  if (options?.planId) params.append('planId', options.planId)

  const response = await apiClient.get(
    `/reports/cooperatives/${cooperativeId}/export/csv?${params.toString()}`,
    { responseType: 'blob' }
  )
  return response.data
}

/**
 * Export report to Excel
 */
export const exportReportExcel = async (
  cooperativeId: string,
  reportType: ReportType,
  options?: ReportOptions
): Promise<Blob> => {
  const params = new URLSearchParams()
  params.append('reportType', reportType)
  if (options?.startDate) params.append('startDate', options.startDate)
  if (options?.endDate) params.append('endDate', options.endDate)
  if (options?.memberId) params.append('memberId', options.memberId)
  if (options?.planId) params.append('planId', options.planId)

  const response = await apiClient.get(
    `/reports/cooperatives/${cooperativeId}/export/excel?${params.toString()}`,
    { responseType: 'blob' }
  )
  return response.data
}

/**
 * Export report to PDF
 */
export const exportReportPDF = async (
  cooperativeId: string,
  reportType: ReportType,
  options?: ReportOptions
): Promise<Blob> => {
  const params = new URLSearchParams()
  params.append('reportType', reportType)
  if (options?.startDate) params.append('startDate', options.startDate)
  if (options?.endDate) params.append('endDate', options.endDate)
  if (options?.memberId) params.append('memberId', options.memberId)
  if (options?.planId) params.append('planId', options.planId)

  const response = await apiClient.get(
    `/reports/cooperatives/${cooperativeId}/export/pdf?${params.toString()}`,
    { responseType: 'blob' }
  )
  return response.data
}

export const reportsApi = {
  generateReport,
  exportReportCSV,
  exportReportExcel,
  exportReportPDF,
}
