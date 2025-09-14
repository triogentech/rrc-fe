"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { User } from '@/store/api/types';
import { useReduxAuth } from '@/store/hooks/useReduxAuth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Use Redux auth hook for state management
  const reduxAuth = useReduxAuth();
  
  // Legacy state for backward compatibility (these will mirror Redux state)
  const [isLoading, setIsLoading] = useState(false);

  const checkAuth = useCallback((): boolean => {
    // Delegate to Redux auth hook
    return reduxAuth.checkAuth();
  }, [reduxAuth]);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('AuthContext: Delegating login to Redux');
      const success = await reduxAuth.login(identifier, password);
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('AuthContext: Delegating logout to Redux');
    await reduxAuth.logout();
  };

  // Sync loading state with Redux
  useEffect(() => {
    setIsLoading(reduxAuth.isLoading);
  }, [reduxAuth.isLoading]);

  const value: AuthContextType = {
    // Use Redux state instead of local state
    isAuthenticated: reduxAuth.isAuthenticated,
    user: reduxAuth.user,
    login,
    logout,
    checkAuth,
    isLoading: isLoading || reduxAuth.isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
