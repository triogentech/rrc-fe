import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  getCurrentUserThunk,
  updateCurrentUserThunk,
  uploadAvatarThunk,
} from '../thunks/userThunks';
import { clearError } from '../slices/userSlice';
import type { User } from '../api/types';

export const useUser = () => {
  const dispatch = useAppDispatch();
  const { currentUser, isLoading, error } = useAppSelector((state) => state.user);

  // Get current user profile
  const getCurrentUser = useCallback(() => {
    return dispatch(getCurrentUserThunk());
  }, [dispatch]);

  // Update user profile
  const updateUserProfile = useCallback((userData: Partial<User>) => {
    return dispatch(updateCurrentUserThunk(userData));
  }, [dispatch]);

  // Upload avatar
  const uploadAvatar = useCallback((file: File) => {
    return dispatch(uploadAvatarThunk(file));
  }, [dispatch]);

  // Clear error
  const clearUserError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Utility functions
  const getUserDisplayName = useCallback(() => {
    if (!currentUser) return 'User';
    return currentUser.username || currentUser.email || 'User';
  }, [currentUser]);

  const getUserEmail = useCallback(() => {
    return currentUser?.email || '';
  }, [currentUser]);

  const getUserRole = useCallback(() => {
    return currentUser?.role?.name || 'User';
  }, [currentUser]);

  const getUserAvatar = useCallback(() => {
    // User interface doesn't have avatar property, return default
    return '/images/user/owner.jpg';
  }, []);

  const isUserActive = useCallback(() => {
    return currentUser?.confirmed && !currentUser?.blocked;
  }, [currentUser]);

  const getLastLoginTime = useCallback(() => {
    if (!currentUser?.lastLoginTimestamp) return null;
    return new Date(currentUser.lastLoginTimestamp).toLocaleString();
  }, [currentUser]);

  const formatUserCreatedDate = useCallback(() => {
    if (!currentUser?.createdAt) return null;
    return new Date(currentUser.createdAt).toLocaleDateString();
  }, [currentUser]);

  return {
    // State
    currentUser,
    isLoading,
    error,
    
    // Actions
    getCurrentUser,
    updateUserProfile,
    uploadAvatar,
    clearUserError,
    
    // Utility functions
    getUserDisplayName,
    getUserEmail,
    getUserRole,
    getUserAvatar,
    isUserActive,
    getLastLoginTime,
    formatUserCreatedDate,
  };
};
