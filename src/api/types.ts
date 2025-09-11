/**
 * Common API types and interfaces
 * Centralized type definitions for API requests and responses
 */

// Generic API Response
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  status: number;
  timestamp?: string;
}

// Pagination
export interface PaginationParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Common Entity Types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User related types
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  DRIVER = 'driver',
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Vehicle related types
export interface Vehicle extends BaseEntity {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  color: string;
  status: VehicleStatus;
  driverId?: string;
  driver?: User;
  lastServiceDate?: string;
  nextServiceDate?: string;
  mileage: number;
}

export enum VehicleStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
  RETIRED = 'retired',
}

// Trip related types
export interface Trip extends BaseEntity {
  vehicleId: string;
  driverId: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime?: string;
  distance: number;
  status: TripStatus;
  purpose: string;
  notes?: string;
  vehicle?: Vehicle;
  driver?: User;
}

export enum TripStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Expense related types
export interface Expense extends BaseEntity {
  tripId?: string;
  vehicleId?: string;
  driverId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  receiptUrl?: string;
  date: string;
  status: ExpenseStatus;
  approvedBy?: string;
  approvedAt?: string;
  trip?: Trip;
  vehicle?: Vehicle;
  driver?: User;
}

export enum ExpenseCategory {
  FUEL = 'fuel',
  MAINTENANCE = 'maintenance',
  TOLLS = 'tolls',
  PARKING = 'parking',
  MEALS = 'meals',
  ACCOMMODATION = 'accommodation',
  OTHER = 'other',
}

export enum ExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Staff related types
export interface Staff extends BaseEntity {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  salary?: number;
  isActive: boolean;
  managerId?: string;
  manager?: Staff;
}

// Common API Error types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
  field?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: ValidationError[];
  code?: string;
  status: number;
}

// Search and Filter types
export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
  pagination?: PaginationParams;
}

export interface DateRange extends Record<string, unknown> {
  startDate: string;
  endDate: string;
}

// File upload types
export interface FileUpload {
  file: File;
  category?: string;
  description?: string;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// Dashboard and Analytics types
export interface DashboardStats {
  totalVehicles: number;
  activeTrips: number;
  totalExpenses: number;
  monthlyExpenses: number;
  totalDrivers: number;
  activeDrivers: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

// Notification types
export interface Notification extends BaseEntity {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  TRIP_UPDATE = 'trip_update',
  EXPENSE_APPROVAL = 'expense_approval',
  MAINTENANCE_REMINDER = 'maintenance_reminder',
}
