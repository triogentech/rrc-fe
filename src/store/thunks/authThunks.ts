import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '@/api/services';
import { ApiErrorHandler } from '@/api/utils';
import type { User } from '@/api/types';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction } from '../slices/authSlice';

// Login thunk
export const loginThunk = createAsyncThunk<
  { user: User; token: string },
  { identifier: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());
      
      console.log('Redux: Attempting login with:', { identifier: credentials.identifier, password: '***' });
      
      const response = await authService.login(credentials);
      
      console.log('Redux: Login response:', response);
      
      if (response.success && response.data) {
        const { jwt, user } = response.data;
        
        console.log('Redux: Login successful, dispatching success action');
        
        const payload = { user, token: jwt };
        dispatch(loginSuccess(payload));
        
        return payload;
      } else {
        const errorMessage = 'Invalid response format from server';
        console.error('Redux: Login failed:', errorMessage);
        dispatch(loginFailure(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Login error:', error);
      console.error('Redux: Login error message:', errorMessage);
      
      dispatch(loginFailure(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

// Logout thunk
export const logoutThunk = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      console.log('Redux: Logging out user');
      
      // Call logout API if needed (for token invalidation)
      try {
        await authService.logout();
      } catch (error) {
        // Continue with logout even if API call fails
        console.warn('Logout API call failed, continuing with local logout:', error);
      }
      
      dispatch(logoutAction());
      
      console.log('Redux: Logout completed');
    } catch (error) {
      console.error('Redux: Logout error:', error);
      // Force logout even if there's an error
      dispatch(logoutAction());
    }
  }
);

// Refresh token thunk
export const refreshTokenThunk = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const currentToken = state.auth.token;
      
      if (!currentToken) {
        return rejectWithValue('No token available for refresh');
      }
      
      console.log('Redux: Refreshing token');
      
      const response = await authService.refreshToken();
      
      if (response.success && response.data?.jwt) {
        console.log('Redux: Token refresh successful');
        return response.data.jwt;
      } else {
        return rejectWithValue('Failed to refresh token');
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Token refresh error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Update profile thunk
export const updateProfileThunk = createAsyncThunk<
  User,
  Partial<User>,
  { rejectValue: string }
>(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      console.log('Redux: Updating user profile:', profileData);
      
      const response = await authService.updateProfile(profileData);
      
      if (response.success && response.data) {
        console.log('Redux: Profile update successful');
        return response.data;
      } else {
        return rejectWithValue('Failed to update profile');
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Profile update error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Get current user profile thunk
export const getCurrentUserThunk = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Redux: Fetching current user profile');
      
      const response = await authService.getProfile();
      
      if (response.success && response.data) {
        console.log('Redux: Current user fetch successful');
        return response.data;
      } else {
        return rejectWithValue('Failed to fetch current user');
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Current user fetch error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Validate session thunk (check if token is still valid)
export const validateSessionThunk = createAsyncThunk<
  boolean,
  void,
  { rejectValue: string }
>(
  'auth/validateSession',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null; user: User | null } };
      const { token, user } = state.auth;
      
      if (!token || !user) {
        console.log('Redux: No token or user found, session invalid');
        dispatch(logoutAction());
        return false;
      }
      
      console.log('Redux: Validating session');
      
      // Try to fetch current user to validate token
      const response = await authService.getProfile();
      
      if (response.success && response.data) {
        console.log('Redux: Session validation successful');
        // Update user data if it has changed
        if (JSON.stringify(response.data) !== JSON.stringify(user)) {
          dispatch(loginSuccess({ user: response.data, token }));
        }
        return true;
      } else {
        console.log('Redux: Session validation failed, logging out');
        dispatch(logoutAction());
        return false;
      }
    } catch (error) {
      console.error('Redux: Session validation error:', error);
      // If validation fails, logout the user
      dispatch(logoutAction());
      return rejectWithValue('Session validation failed');
    }
  }
);

// Initialize auth state from localStorage
export const initializeAuthThunk = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'auth/initialize',
  async (_, { dispatch }) => {
    try {
      console.log('Redux: Initializing auth state');
      
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          try {
            const user = JSON.parse(userData);
            console.log('Redux: Found stored auth data, validating session');
            
            // Validate the session
            await dispatch(validateSessionThunk()).unwrap();
          } catch (error) {
            console.error('Redux: Auth initialization validation failed:', error);
            dispatch(logoutAction());
          }
        } else {
          console.log('Redux: No stored auth data found');
        }
      }
    } catch (error) {
      console.error('Redux: Auth initialization error:', error);
      dispatch(logoutAction());
    }
  }
);
