// User Type Context - Provides user type and mode throughout the app

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppSelector } from '../store/hooks';
import {
  ExtendedUser,
  UserType,
  AppMode,
  UserTypeState,
} from '../models/UserProfile';
import {
  getUserType,
  canAccessOrganizationFeatures,
  canAccessCooperativeFeatures,
  getDefaultAppMode,
  mockExtendUser,
} from '../utils/userTypeDetection';

interface UserTypeContextValue extends UserTypeState {
  switchMode: (mode: AppMode) => void;
  user: ExtendedUser | null;
}

const UserTypeContext = createContext<UserTypeContextValue | undefined>(undefined);

const MODE_STORAGE_KEY = 'app_mode';

interface Props {
  children: ReactNode;
}

export const UserTypeProvider: React.FC<Props> = ({ children }) => {
  const authUser = useAppSelector((state) => state.auth.user);
  const [currentMode, setCurrentMode] = useState<AppMode>('cooperative');
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [onboardingPreference, setOnboardingPreference] = useState<'organization' | 'cooperative' | null>(null);

  // Extend user with profile data
  useEffect(() => {
    if (authUser) {
      // TODO: When backend provides extended user, remove mockExtendUser
      const extendedUser = mockExtendUser(authUser);
      setUser(extendedUser);
    } else {
      setUser(null);
    }
  }, [authUser]);

  // Load saved mode from storage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(MODE_STORAGE_KEY);
        
        // Load saved mode, default to cooperative
        if (savedMode && (savedMode === 'organization' || savedMode === 'cooperative')) {
          setCurrentMode(savedMode);
        } else {
          setCurrentMode('cooperative'); // Default to cooperative since user type selection is removed
          setOnboardingPreference('cooperative');
        }
      } catch (error) {
        console.warn('Failed to load preferences:', error);
        setCurrentMode('cooperative');
        setOnboardingPreference('cooperative');
      }
    };
    loadPreferences();
  }, []);

  // Calculate user type and permissions
  const userType = getUserType(user);
  
  // Allow organization access if:
  // 1. User is actually staff, OR
  // 2. User selected organization in onboarding (to allow creating first org)
  const canAccessOrganization = canAccessOrganizationFeatures(user) || 
    (onboardingPreference === 'organization' && authUser !== null);
  
  const canAccessCooperative = canAccessCooperativeFeatures(user);

  // Auto-switch to default mode based on user type or preference
  useEffect(() => {
    if (userType !== 'none') {
      const defaultMode = getDefaultAppMode(userType);
      // Organization users should default to organization mode
      if (userType === 'organization' && currentMode !== 'organization') {
        setCurrentMode(defaultMode);
      }
    } else if (onboardingPreference === 'organization' && authUser !== null) {
      // New users with organization preference get organization mode
      setCurrentMode('organization');
    }
  }, [userType, onboardingPreference, authUser]);

  // Switch between organization and cooperative mode
  const switchMode = async (mode: AppMode) => {
    // Validate user can switch to this mode
    if (mode === 'organization' && !canAccessOrganization) {
      console.warn('User cannot access organization mode');
      return;
    }
    if (mode === 'cooperative' && !canAccessCooperative) {
      console.warn('User cannot access cooperative mode');
      return;
    }

    setCurrentMode(mode);
    
    // Persist mode to storage
    try {
      await AsyncStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save app mode:', error);
    }
  };

  const value: UserTypeContextValue = {
    userType,
    currentMode,
    canAccessOrganization,
    canAccessCooperative,
    switchMode,
    user,
  };

  return (
    <UserTypeContext.Provider value={value}>
      {children}
    </UserTypeContext.Provider>
  );
};

/**
 * Hook to access user type context
 */
export const useUserType = (): UserTypeContextValue => {
  const context = useContext(UserTypeContext);
  if (!context) {
    throw new Error('useUserType must be used within UserTypeProvider');
  }
  return context;
};

/**
 * Hook to check if current mode is organization
 */
export const useIsOrganizationMode = (): boolean => {
  const { currentMode } = useUserType();
  return currentMode === 'organization';
};

/**
 * Hook to check if current mode is cooperative
 */
export const useIsCooperativeMode = (): boolean => {
  const { currentMode } = useUserType();
  return currentMode === 'cooperative';
};
