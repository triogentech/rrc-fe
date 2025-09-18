/**
 * Utility functions to clear authentication data
 * Useful for debugging and testing authentication flows
 */

export const clearAllAuthData = (): void => {
  if (typeof window !== 'undefined') {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('lastLoginTime');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('All authentication data cleared');
  }
};

export const clearReduxAuthState = (): void => {
  if (typeof window !== 'undefined') {
    // Dispatch clear action to Redux store
    // This will be handled by the ReduxProvider
    window.dispatchEvent(new CustomEvent('clearAuthData'));
  }
};

export const resetAppState = (): void => {
  clearAllAuthData();
  clearReduxAuthState();
  
  // Reload the page to reset all state
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

// Make functions available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).clearAuth = clearAllAuthData;
  (window as any).resetApp = resetAppState;
}
