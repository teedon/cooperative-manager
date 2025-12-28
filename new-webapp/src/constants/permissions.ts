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

  // Expense Management
  EXPENSES_VIEW: 'expenses:view',
  EXPENSES_CREATE: 'expenses:create',
  EXPENSES_EDIT: 'expenses:edit',
  EXPENSES_DELETE: 'expenses:delete',
  EXPENSES_APPROVE: 'expenses:approve',
  EXPENSES_MANAGE_CATEGORIES: 'expenses:manage_categories',

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
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

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
  EXPENSE_MANAGEMENT: {
    label: 'Expense Management',
    permissions: [
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EXPENSES_CREATE,
      PERMISSIONS.EXPENSES_EDIT,
      PERMISSIONS.EXPENSES_DELETE,
      PERMISSIONS.EXPENSES_APPROVE,
      PERMISSIONS.EXPENSES_MANAGE_CATEGORIES,
    ],
  },
  REPORTS: {
    label: 'Reports & Ledger',
    permissions: [PERMISSIONS.LEDGER_VIEW, PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT],
  },
  SETTINGS: {
    label: 'Settings',
    permissions: [PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_EDIT],
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
}

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
  [PERMISSIONS.GROUP_BUYS_MANAGE_ORDERS]: 'Manage Orders',
  [PERMISSIONS.EXPENSES_VIEW]: 'View Expenses',
  [PERMISSIONS.EXPENSES_CREATE]: 'Create Expenses',
  [PERMISSIONS.EXPENSES_EDIT]: 'Edit Expenses',
  [PERMISSIONS.EXPENSES_DELETE]: 'Delete Expenses',
  [PERMISSIONS.EXPENSES_APPROVE]: 'Approve Expenses',
  [PERMISSIONS.EXPENSES_MANAGE_CATEGORIES]: 'Manage Categories',
  [PERMISSIONS.LEDGER_VIEW]: 'View Ledger',
  [PERMISSIONS.REPORTS_VIEW]: 'View Reports',
  [PERMISSIONS.REPORTS_EXPORT]: 'Export Reports',
  [PERMISSIONS.SETTINGS_VIEW]: 'View Settings',
  [PERMISSIONS.SETTINGS_EDIT]: 'Edit Settings',
  [PERMISSIONS.ADMINS_VIEW]: 'View Admins',
  [PERMISSIONS.ADMINS_ADD]: 'Add Admins',
  [PERMISSIONS.ADMINS_REMOVE]: 'Remove Admins',
  [PERMISSIONS.ADMINS_EDIT_PERMISSIONS]: 'Edit Permissions',
}
