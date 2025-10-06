/**
 * Base API configuration and utilities
 * Provides a centralized way to handle API calls with consistent error handling,
 * request/response interceptors, and authentication
 */

import { API_CONFIG } from '@/config/api';

console.log('API_CONFIG loaded:', API_CONFIG);

// API Response Types
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

// Request Configuration
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Base API class with common HTTP methods
 */
export class BaseApi {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(
    baseURL: string = API_CONFIG.baseURL,
    defaultHeaders: Record<string, string> = API_CONFIG.headers,
    timeout: number = API_CONFIG.timeout
  ) {
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;
    this.timeout = timeout;
  }

  /**
   * Get authentication token from localStorage or context
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  /**
   * Build full URL with query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, unknown>): string {
    const url = new URL(endpoint, this.baseURL);
    
    console.log('Building URL:', {
      endpoint,
      baseURL: this.baseURL,
      finalURL: url.toString()
    });
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    const finalUrl = url.toString();
    console.log('Final URL with params:', finalUrl);
    return finalUrl;
  }

  /**
   * Prepare headers with authentication
   */
  private prepareHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    
    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle 403 Forbidden specifically
      if (response.status === 403) {
        console.warn('API: 403 Forbidden - Token may be invalid or expired');
        // Clear invalid tokens from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          localStorage.removeItem('lastLoginTime');
          
          // Dispatch a custom event to notify Redux store
          window.dispatchEvent(new CustomEvent('authTokenExpired'));
        }
      }
      
      throw {
        message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        code: errorData.code,
        details: errorData.details,
      } as ApiError;
    }

    // Handle empty responses (like 204 No Content for DELETE requests)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      console.log('API: Handling 204/empty response:', {
        status: response.status,
        contentLength: response.headers.get('content-length'),
        contentType: response.headers.get('content-type')
      });
      return {
        data: null as T,
        message: 'Success',
        success: true,
        status: response.status,
      };
    }

    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log('API: Handling non-JSON response:', {
        status: response.status,
        contentType: contentType
      });
      return {
        data: null as T,
        message: 'Success',
        success: true,
        status: response.status,
      };
    }

    console.log('API: Parsing JSON response:', {
      status: response.status,
      contentType: response.headers.get('content-type')
    });
    const data = await response.json();
    console.log('API: Parsed JSON data:', data);
    return {
      data: data.data || data,
      message: data.message,
      success: true,
      status: response.status,
    };
  }

  /**
   * Make HTTP request with timeout
   */
  private async makeRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.timeout);

    try {
      const response = await fetch(
        this.buildURL(config.url, config.params),
        {
          method: config.method,
          headers: this.prepareHeaders(config.headers),
          body: config.data ? JSON.stringify(config.data) : undefined,
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      return await this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw {
            message: 'Request timeout',
            status: 408,
            code: 'TIMEOUT',
          } as ApiError;
        }
        
        throw {
          message: error.message,
          status: 0,
          code: 'NETWORK_ERROR',
        } as ApiError;
      }
      
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, params?: Record<string, unknown>, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'GET',
      url,
      params,
      ...config,
    });
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'PATCH',
      url,
      data,
      ...config,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  }
}

// Create default API instance
export const api = new BaseApi();

// Export individual methods for convenience
export const { get, post, put, patch, delete: del } = api;

// Error handling utilities
export const isApiError = (error: unknown): error is ApiError => {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    'message' in error
  );
};

export const handleApiError = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};
