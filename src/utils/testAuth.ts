/**
 * Authentication testing utilities
 * Use these functions in the browser console to test authentication flows
 */

export const testAuthFlow = () => {
  console.log('=== Testing Authentication Flow ===');
  
  // Check localStorage
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  
  console.log('LocalStorage Token:', token ? `${token.substring(0, 20)}...` : 'None');
  console.log('LocalStorage User:', userData ? JSON.parse(userData) : 'None');
  
  // Check Redux state (if available)
  if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
    console.log('Redux DevTools available - check Redux state for auth details');
  }
  
  // Test API call
  testApiCall();
};

export const testApiCall = async () => {
  console.log('=== Testing API Call ===');
  
  try {
    const response = await fetch('http://localhost:1340/api/drivers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response Data:', data);
    } else {
      const errorData = await response.text();
      console.log('API Error Response:', errorData);
    }
  } catch (error) {
    console.error('API Call Error:', error);
  }
};

export const simulateTokenExpiry = () => {
  console.log('=== Simulating Token Expiry ===');
  
  // Clear localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('lastLoginTime');
  
  // Dispatch token expired event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('authTokenExpired'));
  }
  
  console.log('Token expiry simulated - check if user is logged out');
};

export const clearAllAuth = () => {
  console.log('=== Clearing All Auth Data ===');
  
  // Clear localStorage
  localStorage.clear();
  
  // Dispatch clear auth event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('clearAuthData'));
  }
  
  console.log('All auth data cleared');
};

// Make functions available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testAuth = testAuthFlow;
  (window as any).testApi = testApiCall;
  (window as any).simulateExpiry = simulateTokenExpiry;
  (window as any).clearAll = clearAllAuth;
}
