// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// Cooperative Types
export type MemberRole = 'admin' | 'moderator' | 'member';
export type CooperativeStatus = 'active' | 'inactive' | 'suspended';

export interface Cooperative {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  status: CooperativeStatus;
  memberCount: number;
  totalContributions: number;
  createdAt: string;
  updatedAt: string;
}

export interface CooperativeMember {
  id: string;
  cooperativeId: string;
  userId: string;
  user: User;
  role: MemberRole;
  joinedAt: string;
  virtualBalance: number;
  status: 'active' | 'suspended' | 'removed';
}

// Contribution Types
export type ContributionFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
export type ContributionPlanType = 'fixed' | 'variable';
export type ContributionPlanDuration = 'continuous' | 'fixed_period';
export type ContributionPeriodStatus = 'upcoming' | 'active' | 'completed' | 'overdue';
export type ContributionRecordStatus = 'pending' | 'verified' | 'rejected';

export interface ContributionPlan {
  id: string;
  cooperativeId: string;
  name: string;
  description?: string;
  type: ContributionPlanType;
  amount?: number; // Required if type is 'fixed'
  minAmount?: number; // For variable plans
  maxAmount?: number; // For variable plans
  frequency: ContributionFrequency;
  duration: ContributionPlanDuration;
  startDate: string;
  endDate?: string; // Required if duration is 'fixed_period'
  totalPeriods?: number; // Computed for fixed_period
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContributionPeriod {
  id: string;
  planId: string;
  periodNumber: number;
  startDate: string;
  endDate: string;
  dueDate: string;
  expectedAmount: number;
  collectedAmount: number;
  status: ContributionPeriodStatus;
}

export interface ContributionRecord {
  id: string;
  periodId: string;
  memberId: string;
  member: CooperativeMember;
  amount: number;
  paymentDate: string;
  paymentReference?: string;
  receiptUrl?: string;
  notes?: string;
  status: ContributionRecordStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Group Buy Types
export type GroupBuyStatus = 'draft' | 'open' | 'closed' | 'finalized' | 'completed' | 'cancelled';
export type AllocationMethod = 'first_come' | 'proportional' | 'admin_override';
export type OrderStatus = 'pending' | 'confirmed' | 'allocated' | 'paid' | 'cancelled';

export interface GroupBuy {
  id: string;
  cooperativeId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  unitPrice: number;
  totalUnits: number;
  availableUnits: number;
  minUnitsPerMember?: number;
  maxUnitsPerMember?: number;
  interestRate: number; // Cooperative interest percentage
  allocationMethod: AllocationMethod;
  deadline: string;
  status: GroupBuyStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupBuyOrder {
  id: string;
  groupBuyId: string;
  memberId: string;
  member: CooperativeMember;
  requestedQuantity: number;
  allocatedQuantity?: number;
  unitPrice: number;
  interestAmount: number;
  totalLiability: number; // (unitPrice * allocatedQty) + interest
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GroupBuyRepayment {
  id: string;
  orderId: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
}

// Loan Types
export type LoanStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'repaying'
  | 'completed'
  | 'defaulted';

export interface LoanRequest {
  id: string;
  cooperativeId: string;
  memberId: string;
  member: CooperativeMember;
  amount: number;
  purpose: string;
  duration: number; // in months
  interestRate: number;
  monthlyRepayment: number;
  totalRepayment: number;
  status: LoanStatus;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  disbursedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  paidAt?: string;
}

// Ledger Types
export type LedgerEntryType =
  | 'contribution_in'
  | 'loan_disbursement'
  | 'loan_repayment'
  | 'groupbuy_outlay'
  | 'groupbuy_repayment'
  | 'manual_credit'
  | 'manual_debit';

export interface LedgerEntry {
  id: string;
  cooperativeId: string;
  memberId: string;
  type: LedgerEntryType;
  amount: number; // Positive for credits, negative for debits
  balanceAfter: number;
  referenceId?: string; // ID of related record (contribution, loan, groupbuy)
  referenceType?: 'contribution' | 'loan' | 'groupbuy';
  description: string;
  createdBy: string;
  createdAt: string;
}

// Computed balance from ledger
export interface VirtualBalance {
  memberId: string;
  cooperativeId: string;
  totalContributions: number;
  totalLoanDisbursements: number;
  totalLoanRepayments: number;
  totalGroupBuyOutlays: number;
  totalGroupBuyRepayments: number;
  manualAdjustments: number;
  currentBalance: number;
  lastUpdated: string;
}

// Media/Receipt Types
export interface ReceiptUpload {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Cooperatives: undefined;
  Profile: undefined;
};

export type CooperativeStackParamList = {
  CooperativeList: undefined;
  CooperativeDetail: { cooperativeId: string };
  ContributionPlan: { planId: string };
  ContributionPeriod: { periodId: string };
  RecordPayment: { periodId: string };
  PaymentVerification: { cooperativeId: string };
  GroupBuyList: { cooperativeId: string };
  GroupBuyDetail: { groupBuyId: string };
  GroupBuyManagement: { groupBuyId: string };
  LoanRequest: { cooperativeId: string };
  LoanDetail: { loanId: string };
  LoanDecision: { loanId: string };
  Ledger: { cooperativeId: string; memberId?: string };
  MemberDashboard: { cooperativeId: string; memberId: string };
  CooperativeSettings: { cooperativeId: string };
};
