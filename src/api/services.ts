/**
 * API Services
 * Specific API service functions for different modules
 */

import { api } from './baseApi';
import type {
  User,
  RegisterRequest,
  Vehicle,
  Trip,
  Expense,
  Staff,
  DashboardStats,
  PaginatedResponse,
  PaginationParams,
  DateRange,
  UploadResponse,
  Notification,
} from './types';

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Login user - using absolute URL to force correct endpoint
   */
  login: async (credentials: { identifier: string; password: string }) => {
    console.log('Auth service login called with:', credentials.identifier);
    
    // Try with absolute URL first
    try {
      const response = await fetch('http://localhost:1337/api/auth/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        throw {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }
      
      const data = await response.json();
      return {
        data,
        success: true,
        status: response.status,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Direct fetch failed, trying API client:', error);
      // Fallback to API client
      return api.post<{ jwt: string; user: User }>('/auth/local', credentials);
    }
  },

  /**
   * Register new user
   */
  register: (userData: RegisterRequest) =>
    api.post<User>('/auth/register', userData),

  /**
   * Refresh authentication token
   */
  refreshToken: (refreshToken: string) =>
    api.post<{ jwt: string; user: User }>('/auth/refresh', { refreshToken }),

  /**
   * Logout user
   */
  logout: () =>
    api.post('/auth/logout'),

  /**
   * Get current user profile
   */
  getProfile: () =>
    api.get<User>('/users/me'),

  /**
   * Update user profile
   */
  updateProfile: (userData: Partial<User>) =>
    api.put<User>('/users/me', userData),

  /**
   * Change password
   */
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),

  /**
   * Request password reset
   */
  requestPasswordReset: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  /**
   * Reset password with token
   */
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

/**
 * User Management Service
 */
export const userService = {
  /**
   * Get all users with pagination
   */
  getUsers: (params?: PaginationParams & { role?: string; isActive?: boolean }) =>
    api.get<PaginatedResponse<User>>('/users', params),

  /**
   * Get user by ID
   */
  getUser: (id: string) =>
    api.get<User>(`/users/${id}`),

  /**
   * Create new user
   */
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<User>('/users', userData),

  /**
   * Update user
   */
  updateUser: (id: string, userData: Partial<User>) =>
    api.put<User>(`/users/${id}`, userData),

  /**
   * Delete user
   */
  deleteUser: (id: string) =>
    api.delete(`/users/${id}`),

  /**
   * Toggle user active status
   */
  toggleUserStatus: (id: string) =>
    api.patch(`/users/${id}/toggle-status`),

  /**
   * Search users
   */
  searchUsers: (query: string, params?: PaginationParams) =>
    api.get<PaginatedResponse<User>>('/users/search', { q: query, ...params }),
};

/**
 * Vehicle Management Service
 */
export const vehicleService = {
  /**
   * Get all vehicles with pagination
   */
  getVehicles: (params?: PaginationParams & { status?: string; driverId?: string }) =>
    api.get<PaginatedResponse<Vehicle>>('/vehicles', params),

  /**
   * Get vehicle by ID
   */
  getVehicle: (id: string) =>
    api.get<Vehicle>(`/vehicles/${id}`),

  /**
   * Create new vehicle
   */
  createVehicle: (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Vehicle>('/vehicles', vehicleData),

  /**
   * Update vehicle
   */
  updateVehicle: (id: string, vehicleData: Partial<Vehicle>) =>
    api.put<Vehicle>(`/vehicles/${id}`, vehicleData),

  /**
   * Delete vehicle
   */
  deleteVehicle: (id: string) =>
    api.delete(`/vehicles/${id}`),

  /**
   * Assign driver to vehicle
   */
  assignDriver: (vehicleId: string, driverId: string) =>
    api.post(`/vehicles/${vehicleId}/assign-driver`, { driverId }),

  /**
   * Unassign driver from vehicle
   */
  unassignDriver: (vehicleId: string) =>
    api.post(`/vehicles/${vehicleId}/unassign-driver`),

  /**
   * Get vehicle maintenance history
   */
  getMaintenanceHistory: (vehicleId: string, params?: PaginationParams) =>
    api.get<PaginatedResponse<Record<string, unknown>>>(`/vehicles/${vehicleId}/maintenance`, params),

  /**
   * Schedule maintenance
   */
  scheduleMaintenance: (vehicleId: string, maintenanceData: Record<string, unknown>) =>
    api.post(`/vehicles/${vehicleId}/maintenance`, maintenanceData),
};

/**
 * Trip Management Service
 */
export const tripService = {
  /**
   * Get all trips with pagination
   */
  getTrips: (params?: PaginationParams & { status?: string; driverId?: string; vehicleId?: string }) =>
    api.get<PaginatedResponse<Trip>>('/trips', params),

  /**
   * Get trip by ID
   */
  getTrip: (id: string) =>
    api.get<Trip>(`/trips/${id}`),

  /**
   * Create new trip
   */
  createTrip: (tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Trip>('/trips', tripData),

  /**
   * Update trip
   */
  updateTrip: (id: string, tripData: Partial<Trip>) =>
    api.put<Trip>(`/trips/${id}`, tripData),

  /**
   * Delete trip
   */
  deleteTrip: (id: string) =>
    api.delete(`/trips/${id}`),

  /**
   * Start trip
   */
  startTrip: (id: string) =>
    api.post(`/trips/${id}/start`),

  /**
   * Complete trip
   */
  completeTrip: (id: string, endData: { endTime: string; endLocation: string; distance: number }) =>
    api.post(`/trips/${id}/complete`, endData),

  /**
   * Cancel trip
   */
  cancelTrip: (id: string, reason: string) =>
    api.post(`/trips/${id}/cancel`, { reason }),

  /**
   * Get trips by date range
   */
  getTripsByDateRange: (dateRange: DateRange, params?: PaginationParams) =>
    api.get<PaginatedResponse<Trip>>('/trips/by-date-range', { ...dateRange, ...params }),

  /**
   * Get upcoming trips
   */
  getUpcomingTrips: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Trip>>('/trips/upcoming', params),

  /**
   * Get past trips
   */
  getPastTrips: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Trip>>('/trips/past', params),
};

/**
 * Expense Management Service
 */
export const expenseService = {
  /**
   * Get all expenses with pagination
   */
  getExpenses: (params?: PaginationParams & { status?: string; category?: string; driverId?: string }) =>
    api.get<PaginatedResponse<Expense>>('/expenses', params),

  /**
   * Get expense by ID
   */
  getExpense: (id: string) =>
    api.get<Expense>(`/expenses/${id}`),

  /**
   * Create new expense
   */
  createExpense: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Expense>('/expenses', expenseData),

  /**
   * Update expense
   */
  updateExpense: (id: string, expenseData: Partial<Expense>) =>
    api.put<Expense>(`/expenses/${id}`, expenseData),

  /**
   * Delete expense
   */
  deleteExpense: (id: string) =>
    api.delete(`/expenses/${id}`),

  /**
   * Approve expense
   */
  approveExpense: (id: string) =>
    api.post(`/expenses/${id}/approve`),

  /**
   * Reject expense
   */
  rejectExpense: (id: string, reason: string) =>
    api.post(`/expenses/${id}/reject`, { reason }),

  /**
   * Get expenses by date range
   */
  getExpensesByDateRange: (dateRange: DateRange, params?: PaginationParams) =>
    api.get<PaginatedResponse<Expense>>('/expenses/by-date-range', { ...dateRange, ...params }),

  /**
   * Get expenses by category
   */
  getExpensesByCategory: (category: string, params?: PaginationParams) =>
    api.get<PaginatedResponse<Expense>>('/expenses/by-category', { category, ...params }),

  /**
   * Get expense statistics
   */
  getExpenseStats: (dateRange?: DateRange) =>
    api.get<Record<string, unknown>>('/expenses/stats', dateRange),
};

/**
 * Staff Management Service
 */
export const staffService = {
  /**
   * Get all staff with pagination
   */
  getStaff: (params?: PaginationParams & { department?: string; isActive?: boolean }) =>
    api.get<PaginatedResponse<Staff>>('/staff', params),

  /**
   * Get staff member by ID
   */
  getStaffMember: (id: string) =>
    api.get<Staff>(`/staff/${id}`),

  /**
   * Create new staff member
   */
  createStaffMember: (staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Staff>('/staff', staffData),

  /**
   * Update staff member
   */
  updateStaffMember: (id: string, staffData: Partial<Staff>) =>
    api.put<Staff>(`/staff/${id}`, staffData),

  /**
   * Delete staff member
   */
  deleteStaffMember: (id: string) =>
    api.delete(`/staff/${id}`),

  /**
   * Toggle staff active status
   */
  toggleStaffStatus: (id: string) =>
    api.patch(`/staff/${id}/toggle-status`),

  /**
   * Get staff by department
   */
  getStaffByDepartment: (department: string, params?: PaginationParams) =>
    api.get<PaginatedResponse<Staff>>('/staff/by-department', { department, ...params }),
};

/**
 * Dashboard Service
 */
export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  getStats: () =>
    api.get<DashboardStats>('/dashboard/stats'),

  /**
   * Get recent activities
   */
  getRecentActivities: (limit?: number) =>
    api.get<Record<string, unknown>[]>('/dashboard/recent-activities', { limit }),

  /**
   * Get chart data
   */
  getChartData: (type: string, dateRange?: DateRange) =>
    api.get<Record<string, unknown>>(`/dashboard/charts/${type}`, dateRange),

  /**
   * Get notifications
   */
  getNotifications: (params?: PaginationParams & { isRead?: boolean }) =>
    api.get<PaginatedResponse<Notification>>('/dashboard/notifications', params),

  /**
   * Mark notification as read
   */
  markNotificationAsRead: (id: string) =>
    api.patch(`/dashboard/notifications/${id}/read`),

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead: () =>
    api.patch('/dashboard/notifications/mark-all-read'),
};

/**
 * File Upload Service
 */
export const fileService = {
  /**
   * Upload file
   */
  uploadFile: (file: File, category?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (category) {
      formData.append('category', category);
    }
    
    return api.post<UploadResponse>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Delete file
   */
  deleteFile: (fileId: string) =>
    api.delete(`/files/${fileId}`),

  /**
   * Get file info
   */
  getFileInfo: (fileId: string) =>
    api.get<Record<string, unknown>>(`/files/${fileId}`),
};

/**
 * Search Service
 */
export const searchService = {
  /**
   * Global search
   */
  globalSearch: (query: string, params?: PaginationParams) =>
    api.get<PaginatedResponse<Record<string, unknown>>>('/search', { q: query, ...params }),

  /**
   * Search vehicles
   */
  searchVehicles: (query: string, params?: PaginationParams) =>
    api.get<PaginatedResponse<Vehicle>>('/search/vehicles', { q: query, ...params }),

  /**
   * Search trips
   */
  searchTrips: (query: string, params?: PaginationParams) =>
    api.get<PaginatedResponse<Trip>>('/search/trips', { q: query, ...params }),

  /**
   * Search expenses
   */
  searchExpenses: (query: string, params?: PaginationParams) =>
    api.get<PaginatedResponse<Expense>>('/search/expenses', { q: query, ...params }),
};
