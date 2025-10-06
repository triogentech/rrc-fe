/**
 * API module exports
 * Centralized exports for all API-related functionality
 */

// Base API
export { BaseApi, api, get, post, put, patch, del } from './baseApi';

// Configuration
export { API_CONFIG, getApiBaseUrl } from '@/config/api';

// Types
export * from './types';

// Utilities
export {
  ApiErrorHandler,
  DataTransformer,
  RequestUtils,
  StorageUtils,
  ValidationUtils,
  FormatUtils,
} from './utils';

// Re-export commonly used types for convenience
export type {
  ApiResponse,
  ApiError,
  PaginationParams,
  PaginatedResponse,
  User,
  UserRole,
  Vehicle,
  VehicleCurrentStatus,
  Trip,
  TripStatus,
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  Staff,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  DashboardStats,
  Notification,
  NotificationType,
} from './types';
