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
    const loadMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(MODE_STORAGE_KEY);
        if (savedMode && (savedMode === 'organization' || savedMode === 'cooperative')) {
          setCurrentMode(savedMode);
        }
      } catch (error) {
        console.warn('Failed to load app mode:', error);
      }
    };
    loadMode();
  }, []);

  // Calculate user type and permissions
  const userType = getUserType(user);
  const canAccessOrganization = canAccessOrganizationFeatures(user);
  const canAccessCooperative = canAccessCooperativeFeatures(user);

  // Auto-switch to default mode based on user type
  useEffect(() => {
    if (userType !== 'none') {
      const defaultMode = getDefaultAppMode(userType);
      // Organization users should default to organization mode
      // Only auto-switch if not manually set by user
      if (userType === 'organization' && currentMode !== 'organization') {
        setCurrentMode(defaultMode);
      }
    }
  }, [userType]);

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
