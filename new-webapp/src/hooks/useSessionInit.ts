import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/useAuth'
import { getCurrentUser } from '../store/authSlice'

/**
 * Hook to initialize user session on app load
 * This ensures the user profile is up-to-date with staff/cooperative assignments
 */
export const useSessionInit = () => {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // If user is authenticated but we have stale user data (no extended profiles)
    // or no user data at all, fetch fresh user data
    if (isAuthenticated && (!user || (!user.staffProfile && !user.cooperativeMemberships))) {
      dispatch(getCurrentUser())
    }
  }, [dispatch, isAuthenticated, user])
}