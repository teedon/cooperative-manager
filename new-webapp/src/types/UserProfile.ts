// Extended User Profile Types for Role-Based Access Control

export interface StaffProfile {
  id: string;
  organizationId: string;
  organizationName?: string;
  role: 'admin' | 'supervisor' | 'field_agent' | 'accountant';
  permissions: string[];
  isActive: boolean;
}

export interface CooperativeMembership {
  cooperativeId: string;
  cooperativeName: string;
  memberRole: 'admin' | 'moderator' | 'member';
}

export interface ExtendedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
  
  // Staff profile if user works for an organization
  staffProfile?: StaffProfile;
  
  // Cooperative memberships if user is a member
  cooperativeMemberships?: CooperativeMembership[];
}

export type UserType = 
  | 'organization'  // User is only staff (manages organizations/collections)
  | 'cooperative'   // User is only a cooperative member
  | 'both'          // User has both roles
  | 'none';         // New user, no roles yet

export type AppMode = 'organization' | 'cooperative';

export interface UserTypeState {
  userType: UserType;
  currentMode: AppMode;
  canAccessOrganization: boolean;
  canAccessCooperative: boolean;
}

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
  // Also check if they have access through organization assignments (handled by backend)
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
 * Mock function to extend user with profiles
 * Backend now provides extended user data
 */
export const mockExtendUser = (user: any): ExtendedUser => {
  // Backend now provides extended user data with staffProfile and cooperativeMemberships
  return {
    ...user,
    // Backend now populates these fields directly
    staffProfile: user.staffProfile,
    cooperativeMemberships: user.cooperativeMemberships || [],
  };
};