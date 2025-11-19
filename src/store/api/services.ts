/**
 * API Services
 * Specific API service functions for different modules
 */

import { api } from './baseApi';
import { getApiBaseUrl } from '@/config/api';
import type {
  User,
  UserRole,
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
  Transaction,
  TransactionCreateRequest,
  TransactionUpdateRequest,
  DashboardStats,
  PaginatedResponse,
  PaginationParams,
  DateRange,
  UploadResponse,
  Notification,
  StrapiResponse,
  City,
  Garage,
  FuelStation,
  FuelLog,
  GarageLog,
  TollLog,
  TyreLog,
  LoadProvider,
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
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/auth/local`, {
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
    const { page, limit, search, currentStatus, active, ...otherParams } = params || {};
    
    const queryParams: Record<string, unknown> = {
      populate: '*',
      ...otherParams
    };

    // Add pagination parameters using bracket notation for Strapi
    if (page) {
      queryParams['pagination[page]'] = page;
    }
    if (limit) {
      queryParams['pagination[pageSize]'] = limit;
    }

    // Add currentStatus filter using Strapi filter syntax
    if (currentStatus) {
      queryParams['filters[currentStatus][$eq]'] = currentStatus;
    }

    // Add active filter using Strapi filter syntax
    if (active !== undefined) {
      queryParams['filters[isActive][$eq]'] = active;
    }

    // Add search filters using Strapi filter syntax with $or and $containsi (case-insensitive)
    // Search across multiple fields: vehicleNumber, model, chassisNumber, engineNumber
    if (search && search.trim()) {
      const searchTerm = search.trim();
      queryParams['filters[$or][0][vehicleNumber][$containsi]'] = searchTerm;
      queryParams['filters[$or][1][model][$containsi]'] = searchTerm;
      queryParams['filters[$or][2][chassisNumber][$containsi]'] = searchTerm;
      queryParams['filters[$or][3][engineNumber][$containsi]'] = searchTerm;
    }

    console.log('Vehicle service: Getting vehicles with params:', params);
    console.log('Vehicle service: Query params with pagination and filters:', queryParams);
    return api.get<StrapiResponse<Vehicle>>('/api/vehicles', queryParams);
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
    api.patch<Vehicle>(`/api/vehicles/${id}/toggle-status`),

  /**
   * Search vehicles
   */
  searchVehicles: (query: string, params?: PaginationParams) => {
    const { page, limit, ...otherParams } = params || {};
    const queryParams: Record<string, unknown> = {
      populate: '*',
      ...otherParams
    };

    // Add pagination parameters using bracket notation for Strapi
    if (page) {
      queryParams['pagination[page]'] = page;
    }
    if (limit) {
      queryParams['pagination[pageSize]'] = limit;
    }

    // Add search filters using Strapi filter syntax with $or and $containsi (case-insensitive)
    // Search across multiple fields: vehicleNumber, model, chassisNumber, engineNumber
    if (query && query.trim()) {
      const searchTerm = query.trim();
      queryParams['filters[$or][0][vehicleNumber][$containsi]'] = searchTerm;
      queryParams['filters[$or][1][model][$containsi]'] = searchTerm;
      queryParams['filters[$or][2][chassisNumber][$containsi]'] = searchTerm;
      queryParams['filters[$or][3][engineNumber][$containsi]'] = searchTerm;
    }

    return api.get<StrapiResponse<Vehicle>>('/api/vehicles', queryParams);
  },

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
  getDrivers: (params?: PaginationParams & { isActive?: boolean; search?: string }) => {
    const { page, limit, search, isActive, ...otherParams } = params || {};
    
    const queryParams: Record<string, unknown> = {
      populate: '*',
      ...otherParams
    };

    // Add pagination parameters in the correct Strapi format
    if (page || limit) {
      queryParams.pagination = {
        ...(page && { page }),
        ...(limit && { pageSize: limit })
      };
    }

    // Add search parameter for fullName field
    if (search) {
      queryParams['filters[fullName][$containsi]'] = search;
    }

    // Add isActive filter if provided
    if (isActive !== undefined) {
      queryParams['filters[isActive][$eq]'] = isActive;
    }

    return api.get<StrapiResponse<Driver>>('/api/drivers', queryParams);
  },

  /**
   * Get driver by ID
   */
  getDriver: (id: string) =>
    api.get<Driver>(`/api/drivers/${id}`),

  /**
   * Create new driver
   */
  createDriver: async (driverData: DriverCreateRequest) => {
    console.log('Driver service: Creating driver with data:', driverData);
    
    try {
      // First, create the user using the user service
      const userData = {
        username: driverData.username,
        email: driverData.email,
        password: driverData.password,
        confirmed: driverData.confirmed,
        blocked: driverData.blocked,
        role: driverData.role,
      };
      
      console.log('Driver service: Creating user with data:', userData);
      // Use the user service to create user via /api/users
      const userResponse = await userService.createUser(userData);
      console.log('Driver service: User created successfully:', userResponse);
      console.log('Driver service: User response structure:', JSON.stringify(userResponse, null, 2));
      
      // Extract user ID from the response
      const userId = userResponse.data?.documentId || userResponse.data?.id;
      console.log('Driver service: Extracted user ID:', userId);
      
      if (!userId) {
        throw new Error('Failed to extract user ID from user creation response');
      }
      
      // Create driver with user reference
      const driverPayload = {
        data: {
          ...driverData,
          user: userId,
          // Remove user fields from driver data
          username: undefined,
          email: undefined,
          password: undefined,
          confirmed: undefined,
          blocked: undefined,
          role: undefined,
        }
      };
      
      console.log('Driver service: Creating driver with user reference:', driverPayload);
      return api.post<Driver>('/api/drivers', driverPayload);
    } catch (error) {
      console.error('Driver service: Error creating driver:', error);
      throw error;
    }
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
    const queryParams = {
      ...params,
      populate: '*'
    };
    console.log('Staff service: Query params with populate:', queryParams);
    return api.get<StrapiResponse<Staff>>('/api/staffs', queryParams);
  },

  /**
   * Get single staff member
   */
  getStaffMember: (id: string) => api.get<Staff>(`/api/staffs/${id}`),

  /**
   * Create staff member
   */
  createStaff: async (staffData: StaffCreateRequest) => {
    console.log('Staff service: Creating staff with data:', staffData);
    
    try {
      // First, create the user using the user service
      const userData = {
        username: staffData.username,
        email: staffData.email,
        password: staffData.password,
        confirmed: staffData.confirmed,
        blocked: staffData.blocked,
        role: staffData.role ?? 'Staff',
      };
      
      console.log('Staff service: Creating user with data:', userData);
      // Use the user service to create user via /api/users
      const userResponse = await userService.createUser(userData);
      console.log('Staff service: User created successfully:', userResponse);
      console.log('Staff service: User response structure:', JSON.stringify(userResponse, null, 2));
      
      // Extract user ID from the response
      const userId = userResponse.data?.documentId || userResponse.data?.id;
      console.log('Staff service: Extracted user ID:', userId);
      
      if (!userId) {
        throw new Error('Failed to extract user ID from user creation response');
      }
      
      // Create staff with user reference
      const staffPayload = {
        data: {
          ...staffData,
          user: userId,
          // Remove user fields from staff data
          username: undefined,
          email: undefined,
          password: undefined,
          confirmed: undefined,
          blocked: undefined,
          role: undefined,
        }
      };
      
      console.log('Staff service: Creating staff with user reference:', staffPayload);
      return api.post<Staff>('/api/staffs', staffPayload);
    } catch (error) {
      console.error('Staff service: Error creating staff:', error);
      throw error;
    }
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
  getTrips: (params?: PaginationParams & { search?: string; status?: string }) => {
    const { page, limit, search, status, ...otherParams } = params || {};
    
    const queryParams: Record<string, unknown> = {
      populate: '*',
      ...otherParams
    };

    // Add pagination parameters in the correct Strapi format
    if (page || limit) {
      queryParams.pagination = {
        ...(page && { page }),
        ...(limit && { pageSize: limit })
      };
    }

    // Add search parameter if provided
    if (search) {
      queryParams.search = search;
    }

    // Add status filter if provided
    if (status) {
      queryParams['filters[currentStatus][$eq]'] = status;
    }

    console.log('Trip service: Getting trips with params:', params);
    console.log('Trip service: Query params with pagination:', queryParams);
    return api.get<StrapiResponse<Trip>>('/api/trips', queryParams);
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
  searchTrips: (query: string, params?: PaginationParams) => {
    const { page, limit, ...otherParams } = params || {};
    
    const queryParams: Record<string, unknown> = {
      populate: '*',
      search: query,
      ...otherParams
    };

    // Add pagination parameters in the correct Strapi format
    if (page || limit) {
      queryParams.pagination = {
        ...(page && { page }),
        ...(limit && { pageSize: limit })
      };
    }

    return api.get<StrapiResponse<Trip>>('/api/trips', queryParams);
  },
};

/**
 * City Service
 */
export const cityService = {
  /**
   * Get all cities with populated relations
   */
  getCities: (params?: PaginationParams & { search?: string }) => {
    const { page, limit, search, ...otherParams } = params || {};
    
    const queryParams: Record<string, unknown> = {
      populate: '*',
      ...otherParams
    };

    // Add pagination parameters using bracket notation for Strapi
    if (page) {
      queryParams['pagination[page]'] = page;
    }
    if (limit) {
      queryParams['pagination[pageSize]'] = limit;
    }

    // Add search parameter for name field
    if (search) {
      queryParams['filters[name][$containsi]'] = search;
    }

    console.log('City service: Getting cities with params:', params);
    console.log('City service: Query params:', queryParams);
    return api.get<StrapiResponse<City>>('/api/cities', queryParams);
  },

  /**
   * Get city by ID
   */
  getCity: (id: string) =>
    api.get<City>(`/api/cities/${id}`, {
      populate: '*',
    }),

  /**
   * Create city
   */
  createCity: (data: { name: string; cityCode?: string; state?: string; stateCode?: string; country?: string; countryISOCode?: string }) => {
    const strapiData = { data };
    return api.post<City>('/api/cities', strapiData);
  },

  /**
   * Update city
   */
  updateCity: (id: string, data: Partial<City>) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
    const strapiData = { data: cleanedData };
    return api.put<City>(`/api/cities/${id}`, strapiData);
  },

  /**
   * Delete city
   */
  deleteCity: (id: string) =>
    api.delete(`/api/cities/${id}`),
};

/**
 * Garage Service
 */
export const garageService = {
  /**
   * Get all garages with populated relations
   */
  getGarages: (params?: PaginationParams & { search?: string }) => {
    const { page, limit, search, ...otherParams } = params || {};
    
    const queryParams: Record<string, unknown> = {
      populate: '*',
      ...otherParams
    };

    // Add pagination parameters using bracket notation for Strapi
    if (page) {
      queryParams['pagination[page]'] = page;
    }
    if (limit) {
      queryParams['pagination[pageSize]'] = limit;
    }

    // Add search parameter for name field
    if (search) {
      queryParams['filters[name][$containsi]'] = search;
    }

    console.log('Garage service: Getting garages with params:', params);
    console.log('Garage service: Query params:', queryParams);
    return api.get<StrapiResponse<Garage>>('/api/garages', queryParams);
  },

  /**
   * Get garage by ID
   */
  getGarage: (id: string) =>
    api.get<Garage>(`/api/garages/${id}`, {
      populate: '*',
    }),

  /**
   * Create garage
   */
  createGarage: (data: { name: string; isActive?: boolean; city?: string }) => {
    const strapiData = { data };
    return api.post<Garage>('/api/garages', strapiData);
  },

  /**
   * Update garage
   */
  updateGarage: (id: string, data: Partial<Garage>) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
    const strapiData = { data: cleanedData };
    return api.put<Garage>(`/api/garages/${id}`, strapiData);
  },

  /**
   * Delete garage
   */
  deleteGarage: (id: string) =>
    api.delete(`/api/garages/${id}`),
};

/**
 * Fuel Station Service
 */
export const fuelStationService = {
  /**
   * Get all fuel stations with populated relations
   */
  getFuelStations: (params?: PaginationParams & { search?: string }) => {
    const { page, limit, search, ...otherParams } = params || {};
    
    const queryParams: Record<string, unknown> = {
      populate: '*',
      ...otherParams
    };

    // Add pagination parameters using bracket notation for Strapi
    if (page) {
      queryParams['pagination[page]'] = page;
    }
    if (limit) {
      queryParams['pagination[pageSize]'] = limit;
    }

    // Add search parameter for name field
    if (search) {
      queryParams['filters[name][$containsi]'] = search;
    }

    console.log('Fuel Station service: Getting fuel stations with params:', params);
    console.log('Fuel Station service: Query params:', queryParams);
    return api.get<StrapiResponse<FuelStation>>('/api/fuel-stations', queryParams);
  },

  /**
   * Get fuel station by ID
   */
  getFuelStation: (id: string) =>
    api.get<FuelStation>(`/api/fuel-stations/${id}`, {
      populate: '*',
    }),

  /**
   * Create fuel station
   */
  createFuelStation: (data: { name: string; isActive?: boolean; city?: string }) => {
    const strapiData = { data };
    return api.post<FuelStation>('/api/fuel-stations', strapiData);
  },

  /**
   * Update fuel station
   */
  updateFuelStation: (id: string, data: Partial<FuelStation>) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
    const strapiData = { data: cleanedData };
    return api.put<FuelStation>(`/api/fuel-stations/${id}`, strapiData);
  },

  /**
   * Delete fuel station
   */
  deleteFuelStation: (id: string) =>
    api.delete(`/api/fuel-stations/${id}`),
};

/**
 * Load Provider Service
 */
export const loadProviderService = {
  /**
   * Get all load providers
   */
  getLoadProviders: (params?: PaginationParams & { search?: string }) => {
    const { page, limit, search, ...otherParams } = params || {};
    
    const queryParams: Record<string, unknown> = {
      populate: '*',
      ...otherParams
    };

    // Add pagination parameters using bracket notation for Strapi
    if (page) {
      queryParams['pagination[page]'] = page;
    }
    if (limit) {
      queryParams['pagination[pageSize]'] = limit;
    }

    // Add search parameter if provided
    if (search) {
      queryParams.search = search;
    }

    console.log('LoadProvider service: Getting load providers with params:', params);
    console.log('LoadProvider service: Query params:', queryParams);
    return api.get<StrapiResponse<LoadProvider>>('/api/load-providers', queryParams);
  },

  /**
   * Get single load provider
   */
  getLoadProvider: (id: string) => 
    api.get<LoadProvider>(`/api/load-providers/${id}`, {
      populate: ['city', 'trips', 'cstmCreatedBy', 'cstmUpdatedBy', 'lastUpdatedBy']
    }),

  /**
   * Create load provider
   */
  createLoadProvider: (data: Record<string, unknown>) => {
    console.log('LoadProvider service: Creating load provider with data:', data);
    const strapiData = { data };
    console.log('LoadProvider service: Sending to API:', strapiData);
    return api.post<LoadProvider>('/api/load-providers', strapiData);
  },

  /**
   * Update load provider
   */
  updateLoadProvider: (id: string, data: Partial<LoadProvider> | Record<string, unknown>) => {
    console.log('LoadProvider service: Updating load provider with ID:', id);
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
    const strapiData = { data: cleanedData };
    return api.put<LoadProvider>(`/api/load-providers/${id}`, strapiData);
  },

  /**
   * Delete load provider
   */
  deleteLoadProvider: (id: string) => {
    console.log('LoadProvider service: Deleting load provider with ID:', id);
    return api.delete(`/api/load-providers/${id}`);
  },
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
 * Role Service
 */
export const roleService = {
  /**
   * Get all available roles
   */
  getRoles: () =>
    api.get<UserRole[]>('/api/users-permissions/roles'),

  /**
   * Get role by name
   */
  getRoleByName: async (roleName: string) => {
    console.log('Role service: Fetching all roles...');
    try {
      const response = await api.get<UserRole[]>('/api/users-permissions/roles');
      console.log('Role service: API response:', response);
      const roles = response.data;
      console.log('Role service: Available roles:', roles);
      const foundRole = roles.find(role => role.name === roleName);
      console.log(`Role service: Looking for "${roleName}", found:`, foundRole);
      return foundRole;
    } catch (error) {
      console.error('Role service: Error fetching roles:', error);
      throw error;
    }
  },
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
   * Create new user
   */
  createUser: async (userData: {
    username: string;
    email: string;
    password: string;
    confirmed?: boolean;
    blocked?: boolean;
    role?: string;
  }) => {
    // Get the role ID for the specified role name
    let roleId = 1; // Default to role ID 1 (usually Authenticated)
    
    if (userData.role) {
      try {
        console.log('User service: Looking for role:', userData.role);
        const role = await roleService.getRoleByName(userData.role);
        console.log('User service: Found role:', role);
        if (role) {
          roleId = role.id;
          console.log('User service: Using role ID:', roleId);
        } else {
          console.warn(`User service: Role "${userData.role}" not found, using default role ID 1`);
        }
      } catch (error) {
        console.error('User service: Failed to fetch role:', error);
        console.warn('User service: Using default role ID 1 (Authenticated)');
      }
    }

    // Try different payload structures for Strapi v4
    const payload = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      confirmed: userData.confirmed ?? true,
      blocked: userData.blocked ?? false,
      role: roleId,
    };
    
    console.log('User service: Creating user with payload:', payload);
    
    try {
      return await api.post<User>('/api/users', payload);
    } catch (error) {
      console.error('User service: First attempt failed, trying alternative payload structure:', error);
      
      // Alternative approach: try with role as object reference
      const alternativePayload = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        confirmed: userData.confirmed ?? true,
        blocked: userData.blocked ?? false,
        role: {
          connect: [roleId]
        },
      };
      
      console.log('User service: Trying alternative payload:', alternativePayload);
      return await api.post<User>('/api/users', alternativePayload);
    }
  },

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

/**
 * Transaction Service
 */
export const transactionService = {
  /**
   * Get all transactions with populated data
   */
  getTransactions: (params?: PaginationParams & { search?: string; status?: string; type?: string; method?: string }) => {
    const { page, limit, search, status, type, method, ...otherParams } = params || {};
    
    const queryParams: Record<string, unknown> = {
      populate: '*',
      ...otherParams
    };

    // Add pagination parameters in the correct Strapi format
    if (page || limit) {
      queryParams.pagination = {
        ...(page && { page }),
        ...(limit && { pageSize: limit })
      };
    }

    // Add filters
    if (search) {
      queryParams['filters[$or]'] = [
        { transactionId: { $containsi: search } },
        { description: { $containsi: search } }
      ];
    }
    if (status) {
      queryParams['filters[transactionStatus][$eq]'] = status;
    }
    if (type) {
      queryParams['filters[type][$eq]'] = type;
    }
    if (method) {
      queryParams['filters[method][$eq]'] = method;
    }

    return api.get<StrapiResponse<Transaction>>('/api/transactions', queryParams);
  },

  /**
   * Get transaction by ID
   */
  getTransaction: (id: string) =>
    api.get<Transaction>(`/api/transactions/${id}?populate=*`),

  /**
   * Create new transaction
   */
  createTransaction: (data: TransactionCreateRequest) =>
    api.post<Transaction>('/api/transactions', { data }),

  /**
   * Update transaction
   */
  updateTransaction: (id: string, data: TransactionUpdateRequest) =>
    api.put<Transaction>(`/api/transactions/${id}`, { data }),

  /**
   * Delete transaction
   */
  deleteTransaction: (id: string) =>
    api.delete(`/api/transactions/${id}`),
};

/**
 * Fuel Log Service
 */
export const fuelLogService = {
  /**
   * Get all fuel logs
   */
  getFuelLogs: (params?: PaginationParams & { search?: string }) => {
    const { page, limit, search, ...otherParams } = params || {};
    
    const queryParams: Record<string, unknown> = {
      populate: '*',
      ...otherParams
    };

    if (page) {
      queryParams['pagination[page]'] = page;
    }
    if (limit) {
      queryParams['pagination[pageSize]'] = limit;
    }

    if (search) {
      queryParams['filters[$or]'] = [
        { description: { $containsi: search } },
        { notes: { $containsi: search } }
      ];
    }

    return api.get<StrapiResponse<FuelLog>>('/api/fuel-logs', queryParams);
  },

  /**
   * Get fuel log by ID
   */
  getFuelLog: (id: string) =>
    api.get<FuelLog>(`/api/fuel-logs/${id}`, { populate: '*' }),

  /**
   * Create fuel log
   */
  createFuelLog: (data: Record<string, unknown>) => {
    const strapiData = { data };
    return api.post<FuelLog>('/api/fuel-logs', strapiData);
  },

  /**
   * Update fuel log
   */
  updateFuelLog: (id: string, data: Partial<FuelLog>) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
    const strapiData = { data: cleanedData };
    return api.put<FuelLog>(`/api/fuel-logs/${id}`, strapiData);
  },

  /**
   * Delete fuel log
   */
  deleteFuelLog: (id: string) =>
    api.delete(`/api/fuel-logs/${id}`),
};

/**
 * Garage Log Service
 */
export const garageLogService = {
  /**
   * Get all garage logs
   */
  getGarageLogs: (params?: PaginationParams & { search?: string }) => {
    const { page, limit, search, ...otherParams } = params || {};
    
    const queryParams: Record<string, unknown> = {
      populate: '*',
      ...otherParams
    };

    if (page) {
      queryParams['pagination[page]'] = page;
    }
    if (limit) {
      queryParams['pagination[pageSize]'] = limit;
    }

    if (search) {
      queryParams['filters[$or]'] = [
        { description: { $containsi: search } },
        { notes: { $containsi: search } }
      ];
    }

    return api.get<StrapiResponse<GarageLog>>('/api/garage-logs', queryParams);
  },

  /**
   * Get garage log by ID
   */
  getGarageLog: (id: string) =>
    api.get<GarageLog>(`/api/garage-logs/${id}`, { populate: '*' }),

  /**
   * Create garage log
   */
  createGarageLog: (data: Record<string, unknown>) => {
    const strapiData = { data };
    return api.post<GarageLog>('/api/garage-logs', strapiData);
  },

  /**
   * Update garage log
   */
  updateGarageLog: (id: string, data: Partial<GarageLog>) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
    const strapiData = { data: cleanedData };
    return api.put<GarageLog>(`/api/garage-logs/${id}`, strapiData);
  },

  /**
   * Delete garage log
   */
  deleteGarageLog: (id: string) =>
    api.delete(`/api/garage-logs/${id}`),
};

/**
 * Toll Log Service
 */
export const tollLogService = {
  /**
   * Get all toll logs
   */
  getTollLogs: (params?: PaginationParams & { search?: string }) => {
    const { page, limit, search, ...otherParams } = params || {};
    
    const queryParams: Record<string, unknown> = {
      populate: '*',
      ...otherParams
    };

    if (page) {
      queryParams['pagination[page]'] = page;
    }
    if (limit) {
      queryParams['pagination[pageSize]'] = limit;
    }

    if (search) {
      queryParams['filters[$or]'] = [
        { description: { $containsi: search } },
        { notes: { $containsi: search } }
      ];
    }

    return api.get<StrapiResponse<TollLog>>('/api/toll-logs', queryParams);
  },

  /**
   * Get toll log by ID
   */
  getTollLog: (id: string) =>
    api.get<TollLog>(`/api/toll-logs/${id}`, { populate: '*' }),

  /**
   * Create toll log
   */
  createTollLog: (data: Record<string, unknown>) => {
    const strapiData = { data };
    return api.post<TollLog>('/api/toll-logs', strapiData);
  },

  /**
   * Update toll log
   */
  updateTollLog: (id: string, data: Partial<TollLog>) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
    const strapiData = { data: cleanedData };
    return api.put<TollLog>(`/api/toll-logs/${id}`, strapiData);
  },

  /**
   * Delete toll log
   */
  deleteTollLog: (id: string) =>
    api.delete(`/api/toll-logs/${id}`),
};

/**
 * Tyre Log Service
 */
export const tyreLogService = {
  /**
   * Get all tyre logs
   */
  getTyreLogs: (params?: PaginationParams & { search?: string }) => {
    const { page, limit, search, ...otherParams } = params || {};
    
    const queryParams: Record<string, unknown> = {
      populate: '*',
      ...otherParams
    };

    if (page) {
      queryParams['pagination[page]'] = page;
    }
    if (limit) {
      queryParams['pagination[pageSize]'] = limit;
    }

    if (search) {
      queryParams['filters[$or]'] = [
        { description: { $containsi: search } },
        { notes: { $containsi: search } }
      ];
    }

    return api.get<StrapiResponse<TyreLog>>('/api/tyre-logs', queryParams);
  },

  /**
   * Get tyre log by ID
   */
  getTyreLog: (id: string) =>
    api.get<TyreLog>(`/api/tyre-logs/${id}`, { populate: '*' }),

  /**
   * Create tyre log
   */
  createTyreLog: (data: Record<string, unknown>) => {
    const strapiData = { data };
    return api.post<TyreLog>('/api/tyre-logs', strapiData);
  },

  /**
   * Update tyre log
   */
  updateTyreLog: (id: string, data: Partial<TyreLog>) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
    const strapiData = { data: cleanedData };
    return api.put<TyreLog>(`/api/tyre-logs/${id}`, strapiData);
  },

  /**
   * Delete tyre log
   */
  deleteTyreLog: (id: string) =>
    api.delete(`/api/tyre-logs/${id}`),
};
