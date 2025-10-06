import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectIsAuthenticated,
  selectUser,
  selectToken,
  selectAuthLoading,
  selectAuthError,
  selectLastLoginTime,
  clearError,
  validateSession,
  clearAuthData,
} from '../slices/authSlice';
import {
  loginThunk,
  logoutThunk,
  updateProfileThunk,
  getCurrentUserThunk,
  validateSessionThunk,
} from '../thunks/authThunks';
import type { User } from '../api/types';

// Custom hook for Redux-based authentication
export const useReduxAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Selectors
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const token = useAppSelector(selectToken);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const lastLoginTime = useAppSelector(selectLastLoginTime);

  // Login function
  const login = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    try {
      await dispatch(loginThunk({ identifier, password })).unwrap();
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, [dispatch]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      await dispatch(logoutThunk()).unwrap();
      router.push('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if logout fails
      router.push('/signin');
    }
  }, [dispatch, router]);

  // Update profile function
  const updateProfile = useCallback(async (profileData: Partial<User>): Promise<boolean> => {
    try {
      await dispatch(updateProfileThunk(profileData)).unwrap();
      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    }
  }, [dispatch]);

  // Get current user function
  const getCurrentUser = useCallback(async (): Promise<boolean> => {
    try {
      await dispatch(getCurrentUserThunk()).unwrap();
      return true;
    } catch (error) {
      console.error('Get current user failed:', error);
      return false;
    }
  }, [dispatch]);

  // Validate session function
  const validateUserSession = useCallback(async (): Promise<boolean> => {
    try {
      const result = await dispatch(validateSessionThunk()).unwrap();
      return result;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }, [dispatch]);

  // Check authentication status (synchronous)
  const checkAuth = useCallback((): boolean => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('authToken');
      const storedUserData = localStorage.getItem('userData');
      
      if (storedToken && storedUserData && isAuthenticated && user) {
        return true;
      } else if (storedToken && storedUserData && !isAuthenticated) {
        // Validate session if we have stored data but Redux state is not authenticated
        dispatch(validateSession());
        return false; // Return false for now, validation will update state
      } else if (!storedToken || !storedUserData) {
        // No stored data, ensure we're logged out
        if (isAuthenticated) {
          dispatch(clearAuthData());
        }
        return false;
      }
    }
    return isAuthenticated;
  }, [isAuthenticated, user, dispatch]);

  // Clear error function
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Clear all auth data function
  const clearAllAuthData = useCallback(() => {
    dispatch(clearAuthData());
  }, [dispatch]);

  // Get user display name
  const getUserDisplayName = useCallback((): string => {
    if (!user) return 'Guest';
    return user.email || `User ${user.id}`;
  }, [user]);

  // Check if user has specific role/permission (extend as needed)
  const hasRole = useCallback((role: string): boolean => {
    if (!user) return false;
    // Implement role checking logic based on your user structure
    return user.role?.name === role;
  }, [user]);

  // Get session duration
  const getSessionDuration = useCallback((): number | null => {
    if (!lastLoginTime) return null;
    return Date.now() - lastLoginTime;
  }, [lastLoginTime]);

  // Check if session is expired (based on your business logic)
  const isSessionExpired = useCallback((): boolean => {
    const duration = getSessionDuration();
    if (!duration) return false;
    
    // Example: 24 hours session timeout
    const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return duration > SESSION_TIMEOUT;
  }, [getSessionDuration]);

  return {
    // State
    isAuthenticated,
    user,
    token,
    isLoading,
    error,
    lastLoginTime,

    // Actions
    login,
    logout,
    updateProfile,
    getCurrentUser,
    validateUserSession,
    checkAuth,
    clearAuthError,
    clearAllAuthData,

    // Utilities
    getUserDisplayName,
    hasRole,
    getSessionDuration,
    isSessionExpired,
  };
};

export default useReduxAuth;
