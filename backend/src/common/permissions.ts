/**
 * Permission system for cooperative management
 * 
 * Permissions are stored as a JSON array of permission strings in the Member model.
 * The 'admin' role has all permissions by default.
 * Custom admins (moderators) can have a subset of permissions.
 */

// All available permissions in the system
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

// Permission groups for easier assignment
export const PERMISSION_GROUPS = {
  MEMBER_MANAGEMENT: [
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.MEMBERS_APPROVE,
    PERMISSIONS.MEMBERS_REJECT,
    PERMISSIONS.MEMBERS_REMOVE,
    PERMISSIONS.MEMBERS_EDIT_ROLE,
    PERMISSIONS.MEMBERS_VIEW_FINANCIALS,
  ],
  CONTRIBUTION_MANAGEMENT: [
    PERMISSIONS.CONTRIBUTIONS_VIEW,
    PERMISSIONS.CONTRIBUTIONS_CREATE_PLAN,
    PERMISSIONS.CONTRIBUTIONS_EDIT_PLAN,
    PERMISSIONS.CONTRIBUTIONS_DELETE_PLAN,
    PERMISSIONS.CONTRIBUTIONS_APPROVE_PAYMENTS,
    PERMISSIONS.CONTRIBUTIONS_BULK_APPROVE,
    PERMISSIONS.CONTRIBUTIONS_RECORD_FOR_OTHERS,
  ],
  LOAN_MANAGEMENT: [
    PERMISSIONS.LOANS_VIEW,
    PERMISSIONS.LOANS_APPROVE,
    PERMISSIONS.LOANS_REJECT,
    PERMISSIONS.LOANS_CONFIGURE,
  ],
  GROUP_BUY_MANAGEMENT: [
    PERMISSIONS.GROUP_BUYS_VIEW,
    PERMISSIONS.GROUP_BUYS_CREATE,
    PERMISSIONS.GROUP_BUYS_EDIT,
    PERMISSIONS.GROUP_BUYS_DELETE,
    PERMISSIONS.GROUP_BUYS_MANAGE_ORDERS,
  ],
  REPORTS: [
    PERMISSIONS.LEDGER_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  SETTINGS: [
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
  ],
  ADMIN_MANAGEMENT: [
    PERMISSIONS.ADMINS_VIEW,
    PERMISSIONS.ADMINS_ADD,
    PERMISSIONS.ADMINS_REMOVE,
    PERMISSIONS.ADMINS_EDIT_PERMISSIONS,
  ],
};

// All permissions (for super admin)
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

// Default permissions for different roles
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ALL_PERMISSIONS,
  moderator: [
    // Moderators get view access and some management capabilities
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.MEMBERS_APPROVE,
    PERMISSIONS.MEMBERS_REJECT,
    PERMISSIONS.CONTRIBUTIONS_VIEW,
    PERMISSIONS.CONTRIBUTIONS_APPROVE_PAYMENTS,
    PERMISSIONS.LOANS_VIEW,
    PERMISSIONS.GROUP_BUYS_VIEW,
    PERMISSIONS.LEDGER_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  member: [
    // Regular members only have basic view access (handled by non-admin logic)
  ],
};

// Helper function to check if a member has a permission
export function hasPermission(
  role: string,
  permissions: string[] | null | undefined,
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

  // Fall back to default role permissions
  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || [];
  return defaultPerms.includes(requiredPermission);
}

// Helper function to check multiple permissions (any)
export function hasAnyPermission(
  role: string,
  permissions: string[] | null | undefined,
  requiredPermissions: Permission[],
): boolean {
  return requiredPermissions.some((perm) => hasPermission(role, permissions, perm));
}

// Helper function to check multiple permissions (all)
export function hasAllPermissions(
  role: string,
  permissions: string[] | null | undefined,
  requiredPermissions: Permission[],
): boolean {
  return requiredPermissions.every((perm) => hasPermission(role, permissions, perm));
}

// Parse permissions from JSON string
export function parsePermissions(permissionsJson: string | null | undefined): string[] {
  if (!permissionsJson) return [];
  try {
    const parsed = JSON.parse(permissionsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Stringify permissions to JSON
export function stringifyPermissions(permissions: string[]): string {
  return JSON.stringify(permissions);
}

// Get readable permission name
export function getPermissionLabel(permission: Permission): string {
  const labels: Record<Permission, string> = {
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
  return labels[permission] || permission;
}

// Get permission group label
export function getPermissionGroupLabel(group: keyof typeof PERMISSION_GROUPS): string {
  const labels: Record<keyof typeof PERMISSION_GROUPS, string> = {
    MEMBER_MANAGEMENT: 'Member Management',
    CONTRIBUTION_MANAGEMENT: 'Contribution Management',
    LOAN_MANAGEMENT: 'Loan Management',
    GROUP_BUY_MANAGEMENT: 'Group Buy Management',
    REPORTS: 'Reports & Ledger',
    SETTINGS: 'Settings',
    ADMIN_MANAGEMENT: 'Admin Management',
  };
  return labels[group];
}
