"use client";
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { initializeAuthThunk } from '../thunks/authThunks';

interface ReduxProviderProps {
  children: React.ReactNode;
}

// Internal component to handle initialization
const ReduxInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Initialize auth state when the app starts
    store.dispatch(initializeAuthThunk());
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
