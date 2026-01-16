// User Type Detection Utilities

import { ExtendedUser, UserType, AppMode } from '../models/UserProfile';

/**
 * Determines the user type based on their profiles
 * Organization users are super users who can access everything
 * Cooperative users are restricted to cooperative features only
 */
export const getUserType = (user: ExtendedUser | null): UserType => {
  if (!user) return 'none';
  
  const hasStaffProfile = user.staffProfile && user.staffProfile.isActive;
  const hasCooperatives = user.cooperativeMemberships && user.cooperativeMemberships.length > 0;
  
  // Organization users (staff) can access ALL features (org + cooperative)
  // They are super users
  if (hasStaffProfile) return hasCooperatives ? 'both' : 'organization';
  
  // Regular cooperative members can only access cooperative features
  if (hasCooperatives) return 'cooperative';
  
  return 'none';
};

/**
 * Checks if user can access organization features
 */
export const canAccessOrganizationFeatures = (user: ExtendedUser | null): boolean => {
  if (!user) return false;
  return user.staffProfile?.isActive === true;
};

/**
 * Checks if user can access cooperative features
 * Organization users (staff) can also access cooperative features
 */
export const canAccessCooperativeFeatures = (user: ExtendedUser | null): boolean => {
  if (!user) return false;
  // Organization users can access everything including cooperative features
  const hasStaffProfile = user.staffProfile?.isActive === true;
  const hasCooperatives = (user.cooperativeMemberships?.length ?? 0) > 0;
  return hasStaffProfile || hasCooperatives;
};

/**
 * Gets the default app mode based on user type
 * Organization users default to organization mode (they manage everything)
 */
export const getDefaultAppMode = (userType: UserType): AppMode => {
  // Organization users (staff) default to organization view
  // They can access all features from there
  if (userType === 'organization' || userType === 'both') return 'organization';
  return 'cooperative';
};

/**
 * Checks if user has a specific staff permission
 */
export const hasPermission = (user: ExtendedUser | null, permission: string): boolean => {
  if (!user?.staffProfile) return false;
  return user.staffProfile.permissions.includes(permission);
};

/**
 * Gets user's role in a specific cooperative
 */
export const getCooperativeRole = (
  user: ExtendedUser | null,
  cooperativeId: string
): 'admin' | 'moderator' | 'member' | null => {
  if (!user?.cooperativeMemberships) return null;
  
  const membership = user.cooperativeMemberships.find(
    m => m.cooperativeId === cooperativeId
  );
  
  return membership?.memberRole ?? null;
};

/**
 * Checks if user is admin of any cooperative
 */
export const isCooperativeAdmin = (user: ExtendedUser | null): boolean => {
  if (!user?.cooperativeMemberships) return false;
  return user.cooperativeMemberships.some(m => m.memberRole === 'admin');
};

/**
 * Gets user's organization ID (if staff)
 */
export const getUserOrganizationId = (user: ExtendedUser | null): string | null => {
  return user?.staffProfile?.organizationId ?? null;
};

/**
 * Mock function to extend user with profiles
 * TODO: Remove this when backend provides extended user data
 */
export const mockExtendUser = (user: any): ExtendedUser => {
  // For now, assume all users are cooperative members (existing behavior)
  // This will be replaced when backend sends staffProfile and cooperativeMemberships
  return {
    ...user,
    cooperativeMemberships: [], // Will be populated from actual memberships
    // staffProfile: undefined, // Will be populated if user is staff
  };
};
