/**
 * API Services
 * Specific API service functions for different modules
 */

import { api } from './baseApi';
import type {
  User,
  RegisterRequest,
  Vehicle,
  VehicleCreateRequest,
  VehicleUpdateRequest,
  Trip,
  TripCreateRequest,
  TripUpdateRequest,
  Expense,
  Staff,
  StaffCreateRequest,
  StaffUpdateRequest,
  Driver,
  DriverCreateRequest,
  DriverUpdateRequest,
  DashboardStats,
  PaginatedResponse,
  PaginationParams,
  DateRange,
  UploadResponse,
  Notification,
  StrapiResponse,
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
      return api.post<{ jwt: string; user: User }>('/api/auth/local', credentials);
    }
  },

  /**
   * Register new user
   */
  register: (userData: RegisterRequest) =>
    api.post<User>('/api/auth/register', userData),

  /**
   * Refresh authentication token
   */
  refreshToken: (refreshToken: string) =>
    api.post<{ jwt: string; user: User }>('/api/auth/refresh', { refreshToken }),

  /**
   * Logout user
   */
  logout: () =>
    api.post('/api/auth/logout'),

  /**
   * Get current user profile
   */
  getProfile: () =>
    api.get<User>('/api/users/me'),

  /**
   * Update user profile
   */
  updateProfile: (userData: Partial<User>) =>
    api.put<User>('/api/users/me', userData),

  /**
   * Change password
   */
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/api/auth/change-password', { currentPassword, newPassword }),

  /**
   * Request password reset
   */
  requestPasswordReset: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),

  /**
   * Reset password with token
   */
  resetPassword: (token: string, newPassword: string) =>
    api.post('/api/auth/reset-password', { token, newPassword }),
};


/**
 * Vehicle Management Service
 */
export const vehicleService = {
  /**
   * Get all vehicles with pagination
   */
  getVehicles: (params?: PaginationParams & { currentStatus?: string; active?: boolean; search?: string }) => {
    console.log('Vehicle service: Getting vehicles with params:', params);
    return api.get<StrapiResponse<Vehicle>>('/api/vehicles', params);
  },

  /**
   * Get vehicle by ID
   */
  getVehicle: (id: string) =>
    api.get<Vehicle>(`/api/vehicles/${id}`),

  /**
   * Create new vehicle
   */
  createVehicle: (vehicleData: VehicleCreateRequest) => {
    console.log('Vehicle service: Creating vehicle with data:', vehicleData);
    
    // Strapi API expects data wrapped in a 'data' object
    const strapiData = {
      data: vehicleData
    };
    
    console.log('Vehicle service: Sending to API:', strapiData);
    return api.post<Vehicle>('/api/vehicles', strapiData);
  },

  /**
   * Update vehicle
   */
  updateVehicle: (id: string, vehicleData: VehicleUpdateRequest) => {
    console.log('Vehicle service: Updating vehicle with ID:', id);
    console.log('Vehicle service: Vehicle data received:', vehicleData);
    
    // Filter out undefined values to avoid sending them to the API
    const cleanedData = Object.fromEntries(
      Object.entries(vehicleData).filter(([, value]) => value !== undefined)
    );
    
    console.log('Vehicle service: Cleaned data:', cleanedData);
    
    // Strapi API expects data wrapped in a 'data' object
    const strapiData = {
      data: cleanedData
    };
    
    console.log('Vehicle service: Final Strapi data:', strapiData);
    return api.put<Vehicle>(`/api/vehicles/${id}`, strapiData);
  },

  /**
   * Delete vehicle
   */
  deleteVehicle: (id: string) =>
    api.delete(`/api/vehicles/${id}`),

  /**
   * Toggle vehicle active status
   */
  toggleVehicleStatus: (id: string) =>
    api.patch(`/api/vehicles/${id}/toggle-status`),

  /**
   * Search vehicles
   */
  searchVehicles: (query: string, params?: PaginationParams) =>
    api.get<StrapiResponse<Vehicle>>('/api/vehicles', { search: query, ...params }),

  /**
   * Get vehicles by status
   */
  getVehiclesByStatus: (active: boolean, params?: PaginationParams) =>
    api.get<StrapiResponse<Vehicle>>('/api/vehicles', { active, ...params }),

  /**
   * Get vehicles by current status
   */
  getVehiclesByCurrentStatus: (currentStatus: string, params?: PaginationParams) =>
    api.get<StrapiResponse<Vehicle>>('/api/vehicles', { currentStatus, ...params }),
};


/**
 * Expense Management Service
 */
export const expenseService = {
  /**
   * Get all expenses with pagination
   */
  getExpenses: (params?: PaginationParams & { status?: string; category?: string; driverId?: string }) =>
    api.get<PaginatedResponse<Expense>>('/api/expenses', params),

  /**
   * Get expense by ID
   */
  getExpense: (id: string) =>
    api.get<Expense>(`/expenses/${id}`),

  /**
   * Create new expense
   */
  createExpense: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Expense>('/api/expenses', expenseData),

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
 * Dashboard Service
 */
export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  getStats: () =>
    api.get<DashboardStats>('/api/dashboard/stats'),

  /**
   * Get recent activities
   */
  getRecentActivities: (limit?: number) =>
    api.get<Record<string, unknown>[]>('/api/dashboard/recent-activities', { limit }),

  /**
   * Get chart data
   */
  getChartData: (type: string, dateRange?: DateRange) =>
    api.get<Record<string, unknown>>(`/api/dashboard/charts/${type}`, dateRange),

  /**
   * Get notifications
   */
  getNotifications: (params?: PaginationParams & { isRead?: boolean }) =>
    api.get<PaginatedResponse<Notification>>('/api/dashboard/notifications', params),

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
    
    return api.post<UploadResponse>('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Delete file
   */
  deleteFile: (fileId: string) =>
    api.delete(`/api/files/${fileId}`),

  /**
   * Get file info
   */
  getFileInfo: (fileId: string) =>
    api.get<Record<string, unknown>>(`/api/files/${fileId}`),
};

/**
 * Driver Management Service
 */
export const driverService = {
  /**
   * Get all drivers with pagination
   */
  getDrivers: (params?: PaginationParams & { isActive?: boolean; search?: string }) =>
    api.get<Driver[]>('/api/drivers', params),

  /**
   * Get driver by ID
   */
  getDriver: (id: string) =>
    api.get<Driver>(`/api/drivers/${id}`),

  /**
   * Create new driver
   */
  createDriver: (driverData: DriverCreateRequest) => {
    console.log('Driver service: Creating driver with data:', driverData);
    
    // Strapi API often expects data wrapped in a 'data' object
    const strapiData = {
      data: driverData
    };
    
    console.log('Driver service: Sending to API:', strapiData);
    return api.post<Driver>('/api/drivers', strapiData);
  },

  /**
   * Update driver
   */
  updateDriver: (id: string, driverData: DriverUpdateRequest) => {
    console.log('Driver service: Updating driver with ID:', id);
    console.log('Driver service: Driver data received:', driverData);
    
    // Filter out undefined values to avoid sending them to the API
    const cleanedData = Object.fromEntries(
      Object.entries(driverData).filter(([, value]) => value !== undefined)
    );
    
    console.log('Driver service: Cleaned data:', cleanedData);
    
    // Strapi API expects data wrapped in a 'data' object
    const strapiData = {
      data: cleanedData
    };
    
    console.log('Driver service: Final Strapi data:', strapiData);
    return api.put<Driver>(`/api/drivers/${id}`, strapiData);
  },

  /**
   * Delete driver
   */
  deleteDriver: (id: string) =>
    api.delete(`/api/drivers/${id}`),

  /**
   * Toggle driver active status
   */
  toggleDriverStatus: (id: string) =>
    api.patch(`/api/drivers/${id}/toggle-status`),

  /**
   * Search drivers
   */
  searchDrivers: (query: string, params?: PaginationParams) =>
    api.get<Driver[]>('/api/drivers', { search: query, ...params }),

  /**
   * Get drivers by status
   */
  getDriversByStatus: (isActive: boolean, params?: PaginationParams) =>
    api.get<Driver[]>('/api/drivers', { isActive, ...params }),
};

/**
 * Staff Service
 */
export const staffService = {
  /**
   * Get all staff
   */
  getStaff: (params?: PaginationParams & { search?: string }) => {
    console.log('Staff service: Getting staff with params:', params);
    return api.get<StrapiResponse<Staff>>('/api/staffs', params);
  },

  /**
   * Get single staff member
   */
  getStaffMember: (id: string) => api.get<Staff>(`/api/staffs/${id}`),

  /**
   * Create staff member
   */
  createStaff: (staffData: StaffCreateRequest) => {
    console.log('Staff service: Creating staff with data:', staffData);
    const strapiData = { data: staffData };
    console.log('Staff service: Sending to API:', strapiData);
    return api.post<Staff>('/api/staffs', strapiData);
  },

  /**
   * Update staff member
   */
  updateStaff: (id: string, staffData: StaffUpdateRequest) => {
    console.log('Staff service: Updating staff with ID:', id);
    console.log('Staff service: Staff data received:', staffData);
    const cleanedData = Object.fromEntries(
      Object.entries(staffData).filter(([, value]) => value !== undefined)
    );
    console.log('Staff service: Cleaned data:', cleanedData);
    const strapiData = { data: cleanedData };
    console.log('Staff service: Final Strapi data:', strapiData);
    return api.put<Staff>(`/api/staffs/${id}`, strapiData);
  },

  /**
   * Delete staff member
   */
  deleteStaff: (id: string) => api.delete(`/api/staffs/${id}`),

  /**
   * Search staff
   */
  searchStaff: (query: string, params?: PaginationParams) =>
    api.get<StrapiResponse<Staff>>('/api/staffs', { search: query, ...params }),
};

/**
 * Trip Service
 */
export const tripService = {
  /**
   * Get all trips
   */
  getTrips: (params?: PaginationParams & { search?: string }) => {
    console.log('Trip service: Getting trips with params:', params);
    return api.get<StrapiResponse<Trip>>('/api/trips', params);
  },

  /**
   * Get single trip
   */
  getTrip: (id: string) => api.get<Trip>(`/api/trips/${id}`),

  /**
   * Create trip
   */
  createTrip: (tripData: TripCreateRequest) => {
    console.log('Trip service: Creating trip with data:', tripData);
    const strapiData = { data: tripData };
    console.log('Trip service: Sending to API:', strapiData);
    return api.post<Trip>('/api/trips', strapiData);
  },

  /**
   * Update trip
   */
  updateTrip: (id: string, tripData: TripUpdateRequest) => {
    console.log('Trip service: Updating trip with ID:', id);
    console.log('Trip service: Trip data received:', tripData);
    const cleanedData = Object.fromEntries(
      Object.entries(tripData).filter(([, value]) => value !== undefined)
    );
    console.log('Trip service: Cleaned data:', cleanedData);
    const strapiData = { data: cleanedData };
    console.log('Trip service: Final Strapi data:', strapiData);
    return api.put<Trip>(`/api/trips/${id}`, strapiData);
  },

  /**
   * Delete trip
   */
  deleteTrip: (id: string) => api.delete(`/api/trips/${id}`),

  /**
   * Search trips
   */
  searchTrips: (query: string, params?: PaginationParams) =>
    api.get<StrapiResponse<Trip>>('/api/trips', { search: query, ...params }),
};

/**
 * Search Service
 */
export const searchService = {
  /**
   * Global search
   */
  globalSearch: (query: string, params?: PaginationParams) =>
    api.get<PaginatedResponse<Record<string, unknown>>>('/api/search', { q: query, ...params }),

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

  /**
   * Search drivers
   */
  searchDrivers: (query: string, params?: PaginationParams) =>
    api.get<Driver[]>('/api/drivers', { search: query, ...params }),
};

/**
 * User Service
 */
export const userService = {
  /**
   * Get current user profile with populated data
   */
  getCurrentUser: () =>
    api.get<User>('/api/users/me?populate=*'),

  /**
   * Update current user profile
   */
  updateCurrentUser: (data: Partial<User>) =>
    api.put<User>('/api/users/me', data),

  /**
   * Upload user avatar
   */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('files', file);
    return api.post<{ url: string }>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
