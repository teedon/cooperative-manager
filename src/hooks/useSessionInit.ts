import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { authApi } from '../api/authApi';
import { setUser } from '../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockExtendUser } from '../utils/userTypeDetection';

/**
 * Hook to initialize user session on app load
 * This ensures the user profile is up-to-date with staff/cooperative assignments
 */
export const useSessionInit = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const initializeSession = async () => {
      // If user is authenticated but we have stale user data (no extended profiles)
      // or no user data at all, fetch fresh user data
      if (isAuthenticated && (!user || (!user.staffProfile && !user.cooperativeMemberships))) {
        try {
          const response = await authApi.getCurrentUser();
          if (response.success && response.data) {
            const extendedUser = mockExtendUser(response.data);
            dispatch(setUser(extendedUser));
            // Update stored user data
            await AsyncStorage.setItem('auth_user', JSON.stringify(extendedUser));
          }
        } catch (error) {
          console.warn('Failed to refresh user profile:', error);
          // Don't logout user if profile refresh fails, 
          // they can still use the app with cached data
        }
      }
    };

    initializeSession();
  }, [dispatch, isAuthenticated, user]);
};