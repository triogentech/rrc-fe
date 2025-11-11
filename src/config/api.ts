/**
 * API Configuration
 * Centralized configuration for API endpoints and URLs
 */

// Get API base URL from environment variables
export const getApiBaseUrl = (): string => {
  // Check for environment variable first
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // Fallback to production URL
  return 'https://rrc-be.ramanroadcarrier.in/api';
};

// Get development API base URL
export const getDevApiBaseUrl = (): string => {
  // Check for environment variable first
  if (process.env.NEXT_PUBLIC_DEV_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_DEV_API_BASE_URL;
  }
  
  // Fallback to development URL
  return 'http://localhost:1340/api';
};

// Current API configuration
export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  devBaseURL: getDevApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

// Environment detection
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

// Log current configuration
console.log('API Configuration loaded:', {
  baseURL: API_CONFIG.baseURL,
  devBaseURL: API_CONFIG.devBaseURL,
  environment: process.env.NODE_ENV,
  isDevelopment: isDevelopment(),
  isProduction: isProduction(),
});
