// Store configuration
export { store, useAppDispatch, useAppSelector } from './store';
export type { RootState, AppDispatch } from './store';

// Auth slice
export {
  default as authReducer,
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
  selectAuth,
  selectIsAuthenticated,
  selectUser,
  selectToken,
  selectAuthLoading,
  selectAuthError,
  selectLastLoginTime,
} from './slices/authSlice';
export type { AuthState } from './slices/authSlice';

// Auth thunks
export {
  loginThunk,
  logoutThunk,
  refreshTokenThunk,
  updateProfileThunk,
  getCurrentUserThunk,
  validateSessionThunk,
  initializeAuthThunk,
} from './thunks/authThunks';

// Providers
export { ReduxProvider } from './providers/ReduxProvider';

// Hooks
export { useReduxAuth } from './hooks/useReduxAuth';
