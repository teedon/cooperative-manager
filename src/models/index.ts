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
  userId?: string;
  user?: User;
  role: MemberRole;
  permissions?: string[]; // Custom permissions for moderators
  joinedAt: string;
  virtualBalance: number | null; // null when hidden from non-admin users
  balance?: number; // Alias for virtualBalance in some contexts
  status: 'active' | 'pending' | 'suspended' | 'removed';
  isFinancialDataHidden?: boolean;
  // Offline member fields (schema uses firstName/lastName directly, not offlineFirstName)
  isOfflineMember?: boolean;
  firstName?: string; // For offline members
  lastName?: string; // For offline members
  email?: string; // For offline members
  phone?: string; // For offline members
  memberCode?: string;
  notes?: string;
  addedBy?: string;
  // Legacy aliases for backward compatibility
  offlineFirstName?: string;
  offlineLastName?: string;
  offlineEmail?: string;
  offlinePhone?: string;
}

// Permission constants (should match backend)
export const PERMISSIONS = {
  // Member Management
  MEMBERS_VIEW: 'members:view',
  MEMBERS_APPROVE: 'members:approve',
  MEMBERS_REJECT: 'members:reject',
  MEMBERS_REMOVE: 'members:remove',
  MEMBERS_EDIT_ROLE: 'members:edit_role',
  MEMBERS_VIEW_FINANCIALS: 'members:view_financials',

  // Contribution Management
  CONTRIBUTIONS_VIEW: 'contributions:view',
  CONTRIBUTIONS_CREATE_PLAN: 'contributions:create_plan',
  CONTRIBUTIONS_EDIT_PLAN: 'contributions:edit_plan',
  CONTRIBUTIONS_DELETE_PLAN: 'contributions:delete_plan',
  CONTRIBUTIONS_APPROVE_PAYMENTS: 'contributions:approve_payments',
  CONTRIBUTIONS_BULK_APPROVE: 'contributions:bulk_approve',
  CONTRIBUTIONS_RECORD_FOR_OTHERS: 'contributions:record_for_others',

  // Loan Management
  LOANS_VIEW: 'loans:view',
  LOANS_APPROVE: 'loans:approve',
  LOANS_REJECT: 'loans:reject',
  LOANS_CONFIGURE: 'loans:configure',

  // Group Buy Management
  GROUP_BUYS_VIEW: 'group_buys:view',
  GROUP_BUYS_CREATE: 'group_buys:create',
  GROUP_BUYS_EDIT: 'group_buys:edit',
  GROUP_BUYS_DELETE: 'group_buys:delete',
  GROUP_BUYS_MANAGE_ORDERS: 'group_buys:manage_orders',

  // Ledger & Reports
  LEDGER_VIEW: 'ledger:view',
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',

  // Cooperative Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',

  // Admin Management
  ADMINS_VIEW: 'admins:view',
  ADMINS_ADD: 'admins:add',
  ADMINS_REMOVE: 'admins:remove',
  ADMINS_EDIT_PERMISSIONS: 'admins:edit_permissions',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Permission groups for UI
export const PERMISSION_GROUPS = {
  MEMBER_MANAGEMENT: {
    label: 'Member Management',
    permissions: [
      PERMISSIONS.MEMBERS_VIEW,
      PERMISSIONS.MEMBERS_APPROVE,
      PERMISSIONS.MEMBERS_REJECT,
      PERMISSIONS.MEMBERS_REMOVE,
      PERMISSIONS.MEMBERS_EDIT_ROLE,
      PERMISSIONS.MEMBERS_VIEW_FINANCIALS,
    ],
  },
  CONTRIBUTION_MANAGEMENT: {
    label: 'Contribution Management',
    permissions: [
      PERMISSIONS.CONTRIBUTIONS_VIEW,
      PERMISSIONS.CONTRIBUTIONS_CREATE_PLAN,
      PERMISSIONS.CONTRIBUTIONS_EDIT_PLAN,
      PERMISSIONS.CONTRIBUTIONS_DELETE_PLAN,
      PERMISSIONS.CONTRIBUTIONS_APPROVE_PAYMENTS,
      PERMISSIONS.CONTRIBUTIONS_BULK_APPROVE,
      PERMISSIONS.CONTRIBUTIONS_RECORD_FOR_OTHERS,
    ],
  },
  LOAN_MANAGEMENT: {
    label: 'Loan Management',
    permissions: [
      PERMISSIONS.LOANS_VIEW,
      PERMISSIONS.LOANS_APPROVE,
      PERMISSIONS.LOANS_REJECT,
      PERMISSIONS.LOANS_CONFIGURE,
    ],
  },
  GROUP_BUY_MANAGEMENT: {
    label: 'Group Buy Management',
    permissions: [
      PERMISSIONS.GROUP_BUYS_VIEW,
      PERMISSIONS.GROUP_BUYS_CREATE,
      PERMISSIONS.GROUP_BUYS_EDIT,
      PERMISSIONS.GROUP_BUYS_DELETE,
      PERMISSIONS.GROUP_BUYS_MANAGE_ORDERS,
    ],
  },
  REPORTS: {
    label: 'Reports & Ledger',
    permissions: [
      PERMISSIONS.LEDGER_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
    ],
  },
  SETTINGS: {
    label: 'Settings',
    permissions: [
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_EDIT,
    ],
  },
  ADMIN_MANAGEMENT: {
    label: 'Admin Management',
    permissions: [
      PERMISSIONS.ADMINS_VIEW,
      PERMISSIONS.ADMINS_ADD,
      PERMISSIONS.ADMINS_REMOVE,
      PERMISSIONS.ADMINS_EDIT_PERMISSIONS,
    ],
  },
};

// Permission labels for display
export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.MEMBERS_VIEW]: 'View Members',
  [PERMISSIONS.MEMBERS_APPROVE]: 'Approve Members',
  [PERMISSIONS.MEMBERS_REJECT]: 'Reject Members',
  [PERMISSIONS.MEMBERS_REMOVE]: 'Remove Members',
  [PERMISSIONS.MEMBERS_EDIT_ROLE]: 'Edit Member Roles',
  [PERMISSIONS.MEMBERS_VIEW_FINANCIALS]: 'View Member Financials',
  [PERMISSIONS.CONTRIBUTIONS_VIEW]: 'View Contributions',
  [PERMISSIONS.CONTRIBUTIONS_CREATE_PLAN]: 'Create Contribution Plans',
  [PERMISSIONS.CONTRIBUTIONS_EDIT_PLAN]: 'Edit Contribution Plans',
  [PERMISSIONS.CONTRIBUTIONS_DELETE_PLAN]: 'Delete Contribution Plans',
  [PERMISSIONS.CONTRIBUTIONS_APPROVE_PAYMENTS]: 'Approve Payments',
  [PERMISSIONS.CONTRIBUTIONS_BULK_APPROVE]: 'Bulk Approve Payments',
  [PERMISSIONS.CONTRIBUTIONS_RECORD_FOR_OTHERS]: 'Record Payments for Others',
  [PERMISSIONS.LOANS_VIEW]: 'View Loans',
  [PERMISSIONS.LOANS_APPROVE]: 'Approve Loans',
  [PERMISSIONS.LOANS_REJECT]: 'Reject Loans',
  [PERMISSIONS.LOANS_CONFIGURE]: 'Configure Loan Settings',
  [PERMISSIONS.GROUP_BUYS_VIEW]: 'View Group Buys',
  [PERMISSIONS.GROUP_BUYS_CREATE]: 'Create Group Buys',
  [PERMISSIONS.GROUP_BUYS_EDIT]: 'Edit Group Buys',
  [PERMISSIONS.GROUP_BUYS_DELETE]: 'Delete Group Buys',
  [PERMISSIONS.GROUP_BUYS_MANAGE_ORDERS]: 'Manage Group Buy Orders',
  [PERMISSIONS.LEDGER_VIEW]: 'View Ledger',
  [PERMISSIONS.REPORTS_VIEW]: 'View Reports',
  [PERMISSIONS.REPORTS_EXPORT]: 'Export Reports',
  [PERMISSIONS.SETTINGS_VIEW]: 'View Settings',
  [PERMISSIONS.SETTINGS_EDIT]: 'Edit Settings',
  [PERMISSIONS.ADMINS_VIEW]: 'View Admins',
  [PERMISSIONS.ADMINS_ADD]: 'Add Admins',
  [PERMISSIONS.ADMINS_REMOVE]: 'Remove Admins',
  [PERMISSIONS.ADMINS_EDIT_PERMISSIONS]: 'Edit Admin Permissions',
};

// Helper function to check if a member has a permission
export function hasPermission(
  role: MemberRole,
  permissions: string[] | undefined,
  requiredPermission: Permission,
): boolean {
  // Admin role has all permissions
  if (role === 'admin') {
    return true;
  }

  // Check custom permissions
  if (permissions && Array.isArray(permissions)) {
    return permissions.includes(requiredPermission);
  }

  return false;
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

export type InterestType = 'flat' | 'reducing_balance';

export interface LoanType {
  id: string;
  cooperativeId: string;
  name: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  minDuration: number;
  maxDuration: number;
  interestRate: number;
  interestType: InterestType;
  minMembershipDuration?: number;
  minSavingsBalance?: number;
  maxActiveLoans: number;
  requiresGuarantor: boolean;
  minGuarantors: number;
  isActive: boolean;
  requiresApproval: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    loans: number;
  };
}

export interface LoanRequest {
  id: string;
  cooperativeId: string;
  memberId: string;
  member: CooperativeMember;
  loanTypeId?: string;
  loanType?: LoanType;
  amount: number;
  purpose: string;
  duration: number; // in months
  interestRate: number;
  interestAmount: number;
  monthlyRepayment: number;
  totalRepayment: number;
  amountDisbursed: number;
  amountRepaid: number;
  outstandingBalance: number;
  status: LoanStatus;
  initiatedBy: 'member' | 'admin';
  initiatedByUserId?: string;
  deductionStartDate?: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  disbursedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  repaymentSchedules?: LoanRepaymentSchedule[];
}

export interface LoanRepaymentSchedule {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  paidAt?: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'waived';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy type alias
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
  referenceType?: 'contribution' | 'loan' | 'groupbuy' | 'contribution_payment' | 'loan_repayment';
  description: string;
  createdBy: string;
  createdAt: string;
  memberName?: string; // Included in virtual entries
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
  // Optional member info (included in getAllMemberBalances response)
  member?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    isOfflineMember?: boolean;
  };
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

// Notification Types
export type NotificationType = 
  | 'contribution_reminder'
  | 'contribution_received'
  | 'contribution_approved'
  | 'contribution_rejected'
  | 'loan_requested'
  | 'loan_approved'
  | 'loan_rejected'
  | 'loan_disbursed'
  | 'loan_repayment_due'
  | 'loan_overdue'
  | 'groupbuy_created'
  | 'groupbuy_joined'
  | 'groupbuy_completed'
  | 'groupbuy_cancelled'
  | 'member_joined'
  | 'member_approved'
  | 'member_rejected'
  | 'member_removed'
  | 'role_changed'
  | 'announcement'
  | 'mention'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  cooperativeId?: string;
  cooperative?: {
    id: string;
    name: string;
    code: string;
  };
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  actionType?: 'view' | 'approve' | 'reject' | 'pay' | 'navigate';
  actionRoute?: string;
  actionParams?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fcmToken: string | null;
  permissionStatus: 'granted' | 'denied' | 'not_determined';
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  contributionReminders: boolean;
  loanUpdates: boolean;
  groupBuyUpdates: boolean;
  memberUpdates: boolean;
  announcements: boolean;
  mentions: boolean;
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
