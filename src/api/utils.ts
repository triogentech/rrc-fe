/**
 * API utility functions
 * Helper functions for API error handling, data transformation, and common operations
 */

import { ApiError, ApiResponse, PaginationParams } from './types';

/**
 * Error handling utilities
 */
export class ApiErrorHandler {
  /**
   * Check if error is an API error
   */
  static isApiError(error: unknown): error is ApiError {
    return (
      error !== null &&
      typeof error === 'object' &&
      'status' in error &&
      'message' in error
    );
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(error: unknown): string {
    if (this.isApiError(error)) {
      return error.message;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }

  /**
   * Get error status code
   */
  static getErrorStatus(error: unknown): number {
    if (this.isApiError(error)) {
      return error.status;
    }
    return 0;
  }

  /**
   * Check if error is a network error
   */
  static isNetworkError(error: unknown): boolean {
    return this.isApiError(error) && error.code === 'NETWORK_ERROR';
  }

  /**
   * Check if error is a timeout error
   */
  static isTimeoutError(error: unknown): boolean {
    return this.isApiError(error) && error.code === 'TIMEOUT';
  }

  /**
   * Check if error is an authentication error
   */
  static isAuthError(error: unknown): boolean {
    return this.isApiError(error) && error.status === 401;
  }

  /**
   * Check if error is a validation error
   */
  static isValidationError(error: unknown): boolean {
    return this.isApiError(error) && error.status === 422;
  }

  /**
   * Check if error is a server error
   */
  static isServerError(error: unknown): boolean {
    return this.isApiError(error) && error.status >= 500;
  }

  /**
   * Handle error based on type
   */
  static handleError(error: unknown): { message: string; shouldRetry: boolean; shouldLogout: boolean } {
    const message = this.getErrorMessage(error);
    let shouldRetry = false;
    let shouldLogout = false;

    if (this.isNetworkError(error) || this.isTimeoutError(error)) {
      shouldRetry = true;
    } else if (this.isAuthError(error)) {
      shouldLogout = true;
    }

    return { message, shouldRetry, shouldLogout };
  }
}

/**
 * Data transformation utilities
 */
export class DataTransformer {
  /**
   * Transform API response to standard format
   */
  static transformResponse<T>(response: unknown): ApiResponse<T> {
    const responseObj = response as Record<string, unknown>;
    return {
      data: (responseObj.data as T) || (response as T),
      message: responseObj.message as string,
      success: responseObj.success !== false,
      status: (responseObj.status as number) || 200,
      timestamp: (responseObj.timestamp as string) || new Date().toISOString(),
    };
  }

  /**
   * Transform pagination parameters
   */
  static transformPaginationParams(params: PaginationParams): Record<string, unknown> {
    const transformed: Record<string, unknown> = {};
    
    if (params.page !== undefined) {
      transformed.page = params.page;
    }
    
    if (params.limit !== undefined) {
      transformed.limit = params.limit;
    }
    
    if (params.sortBy) {
      transformed.sortBy = params.sortBy;
    }
    
    if (params.sortOrder) {
      transformed.sortOrder = params.sortOrder;
    }
    
    return transformed;
  }

  /**
   * Transform date range to query parameters
   */
  static transformDateRange(startDate: string, endDate: string): Record<string, string> {
    return {
      startDate,
      endDate,
    };
  }

  /**
   * Transform search query
   */
  static transformSearchQuery(query: string): Record<string, string> {
    return {
      q: query.trim(),
    };
  }

  /**
   * Transform filters to query parameters
   */
  static transformFilters(filters: Record<string, unknown>): Record<string, unknown> {
    const transformed: Record<string, unknown> = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          transformed[key] = value.join(',');
        } else {
          transformed[key] = value;
        }
      }
    });
    
    return transformed;
  }
}

/**
 * Request utilities
 */
export class RequestUtils {
  /**
   * Build query string from parameters
   */
  static buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
  }

  /**
   * Build URL with query parameters
   */
  static buildUrl(baseUrl: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }
    
    const queryString = this.buildQueryString(params);
    return `${baseUrl}?${queryString}`;
  }

  /**
   * Debounce function for search requests
   */
  static debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function for API calls
   */
  static throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}

/**
 * Storage utilities
 */
export class StorageUtils {
  /**
   * Get item from localStorage with error handling
   */
  static getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.warn(`Failed to get item from localStorage: ${key}`, error);
      return null;
    }
  }

  /**
   * Set item in localStorage with error handling
   */
  static setItem(key: string, value: string): boolean {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
        return true;
      }
      return false;
    } catch (error) {
      console.warn(`Failed to set item in localStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage with error handling
   */
  static removeItem(key: string): boolean {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
        return true;
      }
      return false;
    } catch (error) {
      console.warn(`Failed to remove item from localStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * Clear all items from localStorage
   */
  static clear(): boolean {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to clear localStorage', error);
      return false;
    }
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate required fields
   */
  static validateRequired(data: Record<string, unknown>, requiredFields: string[]): string[] {
    const errors: string[] = [];
    
    requiredFields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && (data[field] as string).trim() === '')) {
        errors.push(`${field} is required`);
      }
    });
    
    return errors;
  }
}

/**
 * Format utilities
 */
export class FormatUtils {
  /**
   * Format currency
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Format date
   */
  static formatDate(date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
      short: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { month: 'long', day: 'numeric', year: 'numeric' },
      time: { hour: '2-digit', minute: '2-digit' },
    };
    
    const options = formatOptions[format];
    
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
