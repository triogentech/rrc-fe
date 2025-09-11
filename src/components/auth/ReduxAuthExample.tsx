"use client";
import React from 'react';
import { useReduxAuth } from '@/store/hooks/useReduxAuth';

// Example component showing how to use Redux auth directly
export const ReduxAuthExample: React.FC = () => {
  const {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    logout,
    getUserDisplayName,
    getSessionDuration,
    isSessionExpired,
  } = useReduxAuth();

  const handleLogin = async () => {
    const success = await login('7838624872', 'rohan@123');
    console.log('Login result:', success);
  };

  const handleLogout = async () => {
    await logout();
  };

  const sessionDuration = getSessionDuration();
  const sessionExpired = isSessionExpired();

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Redux Auth Status
      </h2>
      
      <div className="space-y-3">
        <div>
          <strong>Authentication Status:</strong>{' '}
          <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </span>
        </div>

        <div>
          <strong>Loading:</strong>{' '}
          <span className={isLoading ? 'text-yellow-600' : 'text-gray-600'}>
            {isLoading ? 'Loading...' : 'Idle'}
          </span>
        </div>

        {error && (
          <div>
            <strong>Error:</strong>{' '}
            <span className="text-red-600">{error}</span>
          </div>
        )}

        {user && (
          <div>
            <strong>User:</strong>{' '}
            <span className="text-blue-600">{getUserDisplayName()}</span>
            <br />
            <small className="text-gray-500">ID: {user.id}</small>
          </div>
        )}

        {sessionDuration && (
          <div>
            <strong>Session Duration:</strong>{' '}
            <span className="text-gray-600">
              {Math.round(sessionDuration / 1000 / 60)} minutes
            </span>
            {sessionExpired && (
              <span className="text-red-600 ml-2">(Expired)</span>
            )}
          </div>
        )}

        <div className="flex gap-4 mt-6">
          {!isAuthenticated ? (
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login (Demo)'}
            </button>
          ) : (
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReduxAuthExample;
