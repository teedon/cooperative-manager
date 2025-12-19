import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { Permission, PERMISSIONS, hasPermission } from '../models';

/**
 * Hook to check user permissions for the current cooperative
 * Returns helper functions to check various permissions
 */
export function usePermissions(cooperativeId?: string) {
  const { user } = useAppSelector((state) => state.auth);
  const { members } = useAppSelector((state) => state.cooperative);

  // Find current user's membership for this cooperative
  const currentMember = useMemo(() => {
    if (!user || !cooperativeId) return null;
    return members.find((m) => m.userId === user.id && m.cooperativeId === cooperativeId);
  }, [user, cooperativeId, members]);

  // Check if user has a specific permission
  const can = useMemo(() => {
    return (permission: Permission): boolean => {
      if (!currentMember) return false;
      return hasPermission(currentMember.role, currentMember.permissions, permission);
    };
  }, [currentMember]);

  // Check if user has any of the given permissions
  const canAny = useMemo(() => {
    return (permissions: Permission[]): boolean => {
      if (!currentMember) return false;
      return permissions.some((p) => hasPermission(currentMember.role, currentMember.permissions, p));
    };
  }, [currentMember]);

  // Check if user has all of the given permissions
  const canAll = useMemo(() => {
    return (permissions: Permission[]): boolean => {
      if (!currentMember) return false;
      return permissions.every((p) => hasPermission(currentMember.role, currentMember.permissions, p));
    };
  }, [currentMember]);

  // Convenience permission checks
  const permissions = useMemo(() => ({
    // Role checks
    isAdmin: currentMember?.role === 'admin',
    isModerator: currentMember?.role === 'moderator',
    isAdminOrModerator: currentMember?.role === 'admin' || currentMember?.role === 'moderator',

    // Contribution permissions
    canViewContributions: can(PERMISSIONS.CONTRIBUTIONS_VIEW),
    canCreateContributionPlan: can(PERMISSIONS.CONTRIBUTIONS_CREATE_PLAN),
    canEditContributionPlan: can(PERMISSIONS.CONTRIBUTIONS_EDIT_PLAN),
    canDeleteContributionPlan: can(PERMISSIONS.CONTRIBUTIONS_DELETE_PLAN),
    canApprovePayments: can(PERMISSIONS.CONTRIBUTIONS_APPROVE_PAYMENTS),
    canBulkApprove: can(PERMISSIONS.CONTRIBUTIONS_BULK_APPROVE),
    canRecordForOthers: can(PERMISSIONS.CONTRIBUTIONS_RECORD_FOR_OTHERS),

    // Member permissions
    canViewMembers: can(PERMISSIONS.MEMBERS_VIEW),
    canApproveMembers: can(PERMISSIONS.MEMBERS_APPROVE),
    canRejectMembers: can(PERMISSIONS.MEMBERS_REJECT),
    canRemoveMembers: can(PERMISSIONS.MEMBERS_REMOVE),
    canEditMemberRole: can(PERMISSIONS.MEMBERS_EDIT_ROLE),
    canViewMemberFinancials: can(PERMISSIONS.MEMBERS_VIEW_FINANCIALS),

    // Loan permissions
    canViewLoans: can(PERMISSIONS.LOANS_VIEW),
    canApproveLoans: can(PERMISSIONS.LOANS_APPROVE),
    canRejectLoans: can(PERMISSIONS.LOANS_REJECT),
    canConfigureLoans: can(PERMISSIONS.LOANS_CONFIGURE),

    // Group Buy permissions
    canViewGroupBuys: can(PERMISSIONS.GROUP_BUYS_VIEW),
    canCreateGroupBuy: can(PERMISSIONS.GROUP_BUYS_CREATE),
    canEditGroupBuy: can(PERMISSIONS.GROUP_BUYS_EDIT),
    canDeleteGroupBuy: can(PERMISSIONS.GROUP_BUYS_DELETE),
    canManageOrders: can(PERMISSIONS.GROUP_BUYS_MANAGE_ORDERS),

    // Ledger & Reports
    canViewLedger: can(PERMISSIONS.LEDGER_VIEW),
    canViewReports: can(PERMISSIONS.REPORTS_VIEW),
    canExportReports: can(PERMISSIONS.REPORTS_EXPORT),

    // Settings
    canViewSettings: can(PERMISSIONS.SETTINGS_VIEW),
    canEditSettings: can(PERMISSIONS.SETTINGS_EDIT),

    // Admin Management
    canViewAdmins: can(PERMISSIONS.ADMINS_VIEW),
    canAddAdmins: can(PERMISSIONS.ADMINS_ADD),
    canRemoveAdmins: can(PERMISSIONS.ADMINS_REMOVE),
    canEditAdminPermissions: can(PERMISSIONS.ADMINS_EDIT_PERMISSIONS),
  }), [can, currentMember?.role]);

  return {
    currentMember,
    can,
    canAny,
    canAll,
    ...permissions,
  };
}

export default usePermissions;
