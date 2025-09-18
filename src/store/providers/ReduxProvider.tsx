"use client";
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { initializeAuthThunk } from '../thunks/authThunks';
import { clearAuthData, logout } from '../slices/authSlice';

interface ReduxProviderProps {
  children: React.ReactNode;
}

// Internal component to handle initialization
const ReduxInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Initialize auth state when the app starts
    store.dispatch(initializeAuthThunk());
    
    // Listen for clear auth data events
    const handleClearAuth = () => {
      store.dispatch(clearAuthData());
    };
    
    // Listen for token expired events
    const handleTokenExpired = () => {
      console.log('Redux: Token expired event received, logging out user');
      store.dispatch(logout());
    };
    
    window.addEventListener('clearAuthData', handleClearAuth);
    window.addEventListener('authTokenExpired', handleTokenExpired);
    
    return () => {
      window.removeEventListener('clearAuthData', handleClearAuth);
      window.removeEventListener('authTokenExpired', handleTokenExpired);
    };
  }, []);

  return <>{children}</>;
};

// Main Redux provider component
export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <ReduxInitializer>
        {children}
      </ReduxInitializer>
    </Provider>
  );
};

export default ReduxProvider;
