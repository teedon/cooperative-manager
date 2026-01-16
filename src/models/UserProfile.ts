// Extended User Profile Types for Role-Based Access Control

import { User } from './index';

export interface StaffProfile {
  id: string;
  organizationId: string;
  organizationName?: string;
  role: 'admin' | 'supervisor' | 'agent';
  permissions: string[];
  isActive: boolean;
}

export interface CooperativeMembership {
  cooperativeId: string;
  cooperativeName: string;
  memberRole: 'admin' | 'moderator' | 'member';
}

export interface ExtendedUser extends User {
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
