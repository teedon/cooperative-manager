import { IsString, IsOptional, IsIn, IsDateString } from 'class-validator';

export type ReportType = 
  | 'contribution_summary'
  | 'member_balances'
  | 'loan_summary'
  | 'loan_repayment'
  | 'loan_interest'
  | 'expense_summary'
  | 'financial_statement'
  | 'member_activity';

export type ReportFormat = 'json' | 'csv';

export type ExportFormat = 'csv' | 'excel';

export class GenerateReportDto {
  @IsString()
  @IsIn([
    'contribution_summary',
    'member_balances',
    'loan_summary',
    'loan_repayment',
    'loan_interest',
    'expense_summary',
    'financial_statement',
    'member_activity',
  ])
  reportType!: ReportType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  memberId?: string;

  @IsString()
  @IsOptional()
  planId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['json', 'csv'])
  format?: ReportFormat;
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

export interface ContributionSummaryReport {
  metadata: ReportMetadata;
  summary: {
    totalContributions: number;
    totalPayments: number;
    pendingPayments: number;
    approvedPayments: number;
    rejectedPayments: number;
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

export interface LoanSummaryReport {
  metadata: ReportMetadata;
  summary: {
    totalLoansIssued: number;
    totalAmountDisbursed: number;
    totalInterestEarned: number;
    totalApplicationFees: number;
    activeLoans: number;
    completedLoans: number;
    pendingLoans: number;
    defaultedLoans: number;
    repaymentRate: number;
  };
  byLoanType: Array<{
    loanTypeId: string;
    loanTypeName: string;
    loanCount: number;
    totalDisbursed: number;
    totalRepaid: number;
    interestEarned: number;
  }>;
  byMonth: Array<{
    month: string;
    loansIssued: number;
    amountDisbursed: number;
    amountRepaid: number;
  }>;
  topBorrowers: Array<{
    memberId: string;
    memberName: string;
    totalBorrowed: number;
    totalRepaid: number;
    activeLoans: number;
  }>;
}

export interface LoanRepaymentReport {
  metadata: ReportMetadata;
  summary: {
    totalExpectedRepayments: number;
    totalActualRepayments: number;
    overdueAmount: number;
    repaymentPercentage: number;
    totalPenalties: number;
  };
  overdueRepayments: Array<{
    loanId: string;
    memberId: string;
    memberName: string;
    dueDate: string;
    amountDue: number;
    daysOverdue: number;
  }>;
  upcomingRepayments: Array<{
    loanId: string;
    memberId: string;
    memberName: string;
    dueDate: string;
    amountDue: number;
  }>;
  repaymentHistory: Array<{
    loanId: string;
    memberId: string;
    memberName: string;
    paidAt: string;
    amountPaid: number;
    wasLate: boolean;
  }>;
}

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
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    expenseCount: number;
    percentage: number;
  }>;
  byMonth: Array<{
    month: string;
    totalAmount: number;
    expenseCount: number;
  }>;
  recentExpenses: Array<{
    expenseId: string;
    title: string;
    category: string;
    amount: number;
    status: string;
    date: string;
    createdBy: string;
  }>;
}

export interface FinancialStatementReport {
  metadata: ReportMetadata;
  incomeStatement: {
    totalIncome: number;
    incomeBreakdown: {
      contributions: number;
      loanInterest: number;
      applicationFees: number;
      penalties: number;
      other: number;
    };
    totalExpenses: number;
    expenseBreakdown: Record<string, number>;
    netIncome: number;
  };
  balanceSheet: {
    assets: {
      cashOnHand: number;
      outstandingLoans: number;
      totalAssets: number;
    };
    liabilities: {
      memberSavings: number;
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
    totalTransactions: number;
  }>;
}
