import client from './client';
import { ApiResponse } from '../models';

// Report types
export type ReportType =
  | 'contribution_summary'
  | 'member_balances'
  | 'loan_summary'
  | 'loan_repayment'
  | 'loan_interest'
  | 'expense_summary'
  | 'financial_statement'
  | 'member_activity';

export type ExportFormat = 'csv' | 'excel';

export interface ReportTypeInfo {
  type: ReportType;
  name: string;
  description: string;
  icon: string;
}

export interface ReportOptions {
  startDate?: string;
  endDate?: string;
  memberId?: string;
  planId?: string;
}

export interface ReportMetadata {
  reportType: ReportType;
  cooperativeId: string;
  cooperativeName: string;
  generatedAt: string;
  generatedBy: string;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  filters?: Record<string, string>;
}

// Contribution Summary Report
export interface ContributionSummaryReport {
  metadata: ReportMetadata;
  summary: {
    totalContributions: number;
    totalPayments: number;
    approvedPayments: number;
    pendingPayments: number;
    uniqueContributors: number;
  };
  byPlan: Array<{
    planId: string;
    planName: string;
    category: string;
    totalAmount: number;
    paymentCount: number;
    subscriberCount: number;
  }>;
  byMonth: Array<{
    month: string;
    totalAmount: number;
    paymentCount: number;
  }>;
  topContributors: Array<{
    memberId: string;
    memberName: string;
    totalAmount: number;
    paymentCount: number;
  }>;
}

// Member Balances Report
export interface MemberBalancesReport {
  metadata: ReportMetadata;
  summary: {
    totalMembers: number;
    totalBalance: number;
    averageBalance: number;
    totalContributions: number;
    totalLoans: number;
  };
  members: Array<{
    memberId: string;
    memberName: string;
    memberCode?: string;
    isOfflineMember: boolean;
    joinedAt: string;
    totalContributions: number;
    totalLoansTaken: number;
    totalLoanRepayments: number;
    currentBalance: number;
  }>;
}

// Loan Summary Report
export interface LoanSummaryReport {
  metadata: ReportMetadata;
  summary: {
    totalLoansIssued: number;
    totalAmountDisbursed: number;
    totalInterestEarned: number;
    totalApplicationFees: number;
    activeLoans: number;
    repaidLoans: number;
    defaultedLoans: number;
    repaymentRate: number;
  };
  byStatus: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;
  byMonth: Array<{
    month: string;
    disbursed: number;
    repaid: number;
    count: number;
  }>;
}

// Loan Repayment Report
export interface LoanRepaymentReport {
  metadata: ReportMetadata;
  summary: {
    totalOverdue: number;
    totalOverdueAmount: number;
    totalUpcoming: number;
    totalUpcomingAmount: number;
  };
  overdueLoans: Array<{
    loanId: string;
    borrowerName: string;
    principalAmount: number;
    outstandingAmount: number;
    overdueAmount: number;
    daysOverdue: number;
    lastPaymentDate?: string;
  }>;
  upcomingRepayments: Array<{
    loanId: string;
    borrowerName: string;
    dueDate: string;
    amountDue: number;
    principalPortion: number;
    interestPortion: number;
  }>;
}

// Loan Interest Report
export interface LoanInterestReport {
  metadata: ReportMetadata;
  summary: {
    totalInterestEarned: number;
    totalInterestExpected: number;
    totalInterestPending: number;
    averageInterestRate: number;
    totalLoansWithInterest: number;
    interestEarnedThisPeriod: number;
  };
  byLoanType: Array<{
    loanTypeId: string;
    loanTypeName: string;
    interestRate: number;
    totalLoans: number;
    totalPrincipal: number;
    totalInterestExpected: number;
    totalInterestEarned: number;
    interestPending: number;
  }>;
  byMonth: Array<{
    month: string;
    interestEarned: number;
    loansIssued: number;
    principalDisbursed: number;
    averageRate: number;
  }>;
  loanDetails: Array<{
    loanId: string;
    memberId: string;
    memberName: string;
    loanTypeName: string;
    principalAmount: number;
    interestRate: number;
    interestAmount: number;
    interestPaid: number;
    interestPending: number;
    status: string;
    disbursedAt: string;
  }>;
  interestByMember: Array<{
    memberId: string;
    memberName: string;
    totalLoans: number;
    totalPrincipal: number;
    totalInterestPaid: number;
    totalInterestPending: number;
  }>;
}

// Expense Summary Report
export interface ExpenseSummaryReport {
  metadata: ReportMetadata;
  summary: {
    totalExpenses: number;
    approvedExpenses: number;
    pendingExpenses: number;
    rejectedExpenses: number;
    expenseCount: number;
  };
  byCategory: Array<{
    category: string;
    totalAmount: number;
    count: number;
    approvedAmount: number;
    pendingAmount: number;
  }>;
  byMonth: Array<{
    month: string;
    totalAmount: number;
    count: number;
  }>;
  topExpenses: Array<{
    expenseId: string;
    title: string;
    category: string;
    amount: number;
    date: string;
    requestedBy: string;
    status: string;
  }>;
}

// Financial Statement Report
export interface FinancialStatementReport {
  metadata: ReportMetadata;
  incomeStatement: {
    income: {
      contributions: number;
      loanInterest: number;
      applicationFees: number;
      lateFees: number;
      otherIncome: number;
      totalIncome: number;
    };
    expenses: {
      operatingExpenses: number;
      loanWriteOffs: number;
      otherExpenses: number;
      totalExpenses: number;
    };
    netIncome: number;
  };
  balanceSheet: {
    assets: {
      cashAndEquivalents: number;
      loanReceivables: number;
      totalAssets: number;
    };
    liabilities: {
      memberDeposits: number;
      otherLiabilities: number;
      totalLiabilities: number;
    };
    equity: number;
  };
  cashFlow: {
    openingBalance: number;
    inflows: {
      contributions: number;
      loanRepayments: number;
      fees: number;
    };
    outflows: {
      loanDisbursements: number;
      expenses: number;
    };
    netCashFlow: number;
    closingBalance: number;
  };
}

// Member Activity Report
export interface MemberActivityReport {
  metadata: ReportMetadata;
  summary: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    newMembers: number;
  };
  memberDetails: Array<{
    memberId: string;
    memberName: string;
    joinedAt: string;
    lastActivityDate: string;
    contributionCount: number;
    totalContributed: number;
    loanCount: number;
    status: 'active' | 'inactive';
  }>;
  activityByMonth: Array<{
    month: string;
    newMembers: number;
    activeMembers: number;
    contributions: number;
    loans: number;
  }>;
}

// Generic Report type
export type Report =
  | ContributionSummaryReport
  | MemberBalancesReport
  | LoanSummaryReport
  | LoanRepaymentReport
  | LoanInterestReport
  | ExpenseSummaryReport
  | FinancialStatementReport
  | MemberActivityReport;

// API Functions

/**
 * Get available report types
 */
export const getReportTypes = async (): Promise<ApiResponse<ReportTypeInfo[]>> => {
  const response = await client.get<ApiResponse<ReportTypeInfo[]>>('/reports/types');
  return response.data;
};

/**
 * Generate a report
 */
export const generateReport = async (
  cooperativeId: string,
  reportType: ReportType,
  options?: ReportOptions
): Promise<ApiResponse<Report>> => {
  const params = new URLSearchParams();
  params.append('reportType', reportType);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.memberId) params.append('memberId', options.memberId);
  if (options?.planId) params.append('planId', options.planId);

  const response = await client.get<ApiResponse<Report>>(
    `/reports/cooperatives/${cooperativeId}/generate?${params.toString()}`
  );
  return response.data;
};

/**
 * Get export URL for a report
 */
export const getExportUrl = (
  cooperativeId: string,
  reportType: ReportType,
  format: ExportFormat,
  options?: ReportOptions
): string => {
  const params = new URLSearchParams();
  params.append('reportType', reportType);
  params.append('format', format);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.memberId) params.append('memberId', options.memberId);
  if (options?.planId) params.append('planId', options.planId);

  // Get base URL from client or use default
  const baseUrl = client.defaults.baseURL || '';
  return `${baseUrl}/reports/cooperatives/${cooperativeId}/export?${params.toString()}`;
};

/**
 * Export report to CSV
 */
export const exportReportCSV = async (
  cooperativeId: string,
  reportType: ReportType,
  options?: ReportOptions
): Promise<Blob> => {
  const params = new URLSearchParams();
  params.append('reportType', reportType);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.memberId) params.append('memberId', options.memberId);
  if (options?.planId) params.append('planId', options.planId);

  const response = await client.get(
    `/reports/cooperatives/${cooperativeId}/export/csv?${params.toString()}`,
    { responseType: 'blob' }
  );
  return response.data;
};

/**
 * Export report to Excel
 */
export const exportReportExcel = async (
  cooperativeId: string,
  reportType: ReportType,
  options?: ReportOptions
): Promise<Blob> => {
  const params = new URLSearchParams();
  params.append('reportType', reportType);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.memberId) params.append('memberId', options.memberId);
  if (options?.planId) params.append('planId', options.planId);

  const response = await client.get(
    `/reports/cooperatives/${cooperativeId}/export/excel?${params.toString()}`,
    { responseType: 'blob' }
  );
  return response.data;
};

export default {
  getReportTypes,
  generateReport,
  getExportUrl,
  exportReportCSV,
  exportReportExcel,
};
