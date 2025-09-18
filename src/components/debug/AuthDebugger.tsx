"use client";
import { useReduxAuth } from '@/store/hooks/useReduxAuth';
import { useState } from 'react';

export default function AuthDebugger() {
  const {
    isAuthenticated,
    user,
    token,
    isLoading,
    error,
    clearAllAuthData,
    checkAuth,
  } = useReduxAuth();
  
  const [showDebug, setShowDebug] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-red-500 text-white px-3 py-2 rounded text-sm font-mono"
      >
        Auth Debug
      </button>
      
      {showDebug && (
        <div className="absolute bottom-12 right-0 bg-black text-white p-4 rounded shadow-lg max-w-sm text-xs font-mono">
          <div className="space-y-2">
            <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
            <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
            <div><strong>User:</strong> {user ? user.email : 'None'}</div>
            <div><strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}</div>
            <div><strong>Error:</strong> {error || 'None'}</div>
            <div><strong>Check Auth:</strong> {checkAuth() ? 'Valid' : 'Invalid'}</div>
            
            <div className="pt-2 space-x-2">
              <button
                onClick={clearAllAuthData}
                className="bg-red-600 px-2 py-1 rounded text-xs"
              >
                Clear Auth
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="bg-yellow-600 px-2 py-1 rounded text-xs"
              >
                Clear All & Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
