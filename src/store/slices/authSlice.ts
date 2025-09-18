import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../api/types';

// Auth state interface
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  lastLoginTime: number | null;
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
  lastLoginTime: null,
};

// Helper function to get initial state from localStorage
const getInitialAuthState = (): AuthState => {
  if (typeof window === 'undefined') {
    return initialState;
  }

  try {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    const lastLoginTime = localStorage.getItem('lastLoginTime');

    if (token && userData) {
      const user = JSON.parse(userData);
      return {
        ...initialState,
        isAuthenticated: true,
        user,
        token,
        lastLoginTime: lastLoginTime ? parseInt(lastLoginTime, 10) : null,
      };
    }
  } catch (error) {
    console.error('Error loading auth state from localStorage:', error);
    // Clear corrupted data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('lastLoginTime');
  }

  return initialState;
};

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialAuthState(),
  reducers: {
    // Login actions
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      const { user, token } = action.payload;
      const now = Date.now();
      
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = user;
      state.token = token;
      state.error = null;
      state.lastLoginTime = now;

      // Persist to localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(user));
      localStorage.setItem('lastLoginTime', now.toString());
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
      state.lastLoginTime = null;

      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('lastLoginTime');
    },

    // Logout action
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      state.isLoading = false;
      state.lastLoginTime = null;

      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('lastLoginTime');
    },

    // Update user profile
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Update localStorage
        localStorage.setItem('userData', JSON.stringify(state.user));
      }
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Initialize auth state (for hydration)
    initializeAuth: (state) => {
      const hydratedState = getInitialAuthState();
      Object.assign(state, hydratedState);
    },

    // Token refresh
    refreshTokenSuccess: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem('authToken', action.payload);
    },

    // Session validation
    validateSession: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (!token || !userData) {
          // No valid session, logout
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          state.lastLoginTime = null;
        }
      }
    },

    // Clear all auth data (for cleanup)
    clearAuthData: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      state.isLoading = false;
      state.lastLoginTime = null;

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('lastLoginTime');
      }
    },
  },
});

// Export actions
export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateProfile,
  clearError,
  setLoading,
  initializeAuth,
  refreshTokenSuccess,
  validateSession,
  clearAuthData,
} = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectLastLoginTime = (state: { auth: AuthState }) => state.auth.lastLoginTime;

// Export reducer
export default authSlice.reducer;
