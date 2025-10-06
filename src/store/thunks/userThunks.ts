import { createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../api/services';
import { setCurrentUser, setLoading, setError, updateUserProfile } from '../slices/userSlice';
import type { User } from '../api/types';

/**
 * Get current user profile
 */
export const getCurrentUserThunk = createAsyncThunk(
  'user/getCurrentUser',
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await userService.getCurrentUser();
      console.log('User response:', response);
      dispatch(setCurrentUser(response.data));
      return response.data;
    } catch (error: unknown) {
      console.error('Get current user error:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                          (error as { message?: string })?.message || 
                          'Failed to fetch user profile';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Update current user profile
 */
export const updateCurrentUserThunk = createAsyncThunk(
  'user/updateCurrentUser',
  async (userData: Partial<User>, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await userService.updateCurrentUser(userData);
      console.log('Update user response:', response);
      dispatch(updateUserProfile(response.data));
      return response.data;
    } catch (error: unknown) {
      console.error('Update user error:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                          (error as { message?: string })?.message || 
                          'Failed to update user profile';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Upload user avatar
 */
export const uploadAvatarThunk = createAsyncThunk(
  'user/uploadAvatar',
  async (file: File, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await userService.uploadAvatar(file);
      console.log('Upload avatar response:', response);
      // Avatar uploaded successfully (User type doesn't have avatar property)
      return response.data;
    } catch (error: unknown) {
      console.error('Upload avatar error:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                          (error as { message?: string })?.message || 
                          'Failed to upload avatar';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);
