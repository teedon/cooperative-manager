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
  refreshToken?: string | null;
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

// Activity Types
export interface Activity {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  cooperativeId?: string;
  cooperative?: {
    id: string;
    name: string;
    code: string;
  };
  action: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Cooperative {
  id: string;
  name: string;
  code: string;
  description?: string;
  imageUrl?: string;
  status: CooperativeStatus;
  memberCount: number;
  totalContributions: number;
  createdAt: string;
  updatedAt: string;
  // User-specific fields (returned when fetching user's cooperatives)
  memberRole?: MemberRole;
  userTotalContributions?: number;
}

export interface CooperativeMember {
  id: string;
  cooperativeId: string;
  userId: string;
  user: User;
  role: MemberRole;
  joinedAt: string;
  virtualBalance: number | null; // null when hidden from non-admin users
  status: 'active' | 'pending' | 'suspended' | 'removed';
  isFinancialDataHidden?: boolean;
}

// Contribution Types
export type ContributionFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ContributionCategory = 'compulsory' | 'optional';
export type ContributionAmountType = 'fixed' | 'notional';
export type ContributionType = 'continuous' | 'period';
export type ContributionPeriodStatus = 'upcoming' | 'active' | 'completed' | 'overdue';
export type ContributionRecordStatus = 'pending' | 'verified' | 'rejected';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface ContributionPlan {
  id: string;
  cooperativeId: string;
  name: string;
  description?: string;
  
  // Category: compulsory or optional
  category: ContributionCategory;
  
  // Amount type: fixed (set by admin) or notional (set by member)
  amountType: ContributionAmountType;
  fixedAmount?: number; // Required if amountType is 'fixed'
  minAmount?: number; // Optional min for notional
  maxAmount?: number; // Optional max for notional
  
  // Contribution type: continuous or period-based
  contributionType: ContributionType;
  frequency?: ContributionFrequency;
  startDate?: string;
  endDate?: string; // Required if contributionType is 'period'
  
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  subscriptions?: ContributionSubscription[];
  _count?: {
    subscriptions: number;
  };
}

export interface ContributionSubscription {
  id: string;
  planId: string;
  memberId: string;
  amount: number;
  totalPaid: number;
  status: SubscriptionStatus;
  subscribedAt: string;
  pausedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  plan?: ContributionPlan;
  member?: CooperativeMember;
  payments?: ContributionPayment[];
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'bank_transfer' | 'cash' | 'mobile_money' | 'card';

export interface ContributionPayment {
  id: string;
  subscriptionId: string;
  memberId: string;
  amount: number;
  paymentDate: string;
  dueDate?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  receiptUrl?: string;
  notes?: string;
  status: PaymentStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  subscription?: ContributionSubscription;
  member?: CooperativeMember;
}

export type ScheduleStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'waived';

export interface PaymentSchedule {
  id: string;
  subscriptionId: string;
  dueDate: string;
  amount: number;
  periodNumber: number;
  periodLabel?: string;
  status: ScheduleStatus;
  paidAmount: number;
  paidAt?: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
  
  // Calculated fields (from backend)
  isOverdue?: boolean;
  daysOverdue?: number;
  
  // Relations
  subscription?: ContributionSubscription & {
    plan?: ContributionPlan;
    member?: CooperativeMember;
  };
  payment?: ContributionPayment;
}

export interface DuePayment {
  subscription: {
    id: string;
    amount: number;
    totalPaid: number;
    status: SubscriptionStatus;
    subscribedAt: string;
  };
  plan: {
    id: string;
    name: string;
    category: ContributionCategory;
    frequency?: string;
    amountType: ContributionAmountType;
  };
  nextDueDate: string;
  isDue: boolean;
  isOverdue: boolean;
  amountDue: number;
  pendingPaymentsCount: number;
  pendingAmount: number;
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
