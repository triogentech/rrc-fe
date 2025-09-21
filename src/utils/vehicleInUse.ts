import { api } from '@/store/api';
import type { Vehicle, Trip, StrapiResponse } from '@/store/api/types';

/**
 * Fetches vehicles that are currently in use (in-transit status)
 * @param params - Optional pagination and filter parameters
 * @returns Promise<StrapiResponse<Vehicle>> - Response containing vehicles in use
 */
export const getVehiclesInUse = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<StrapiResponse<Vehicle>> => {
  try {
    const queryParams = {
      ...params,
      'filters[currentStatus][$eq]': 'in-transit', // Filter for in-transit status
      populate: '*', // Populate related data
      sort: 'updatedAt:desc', // Sort by most recently updated
    };

    console.log('Fetching vehicles in use with params:', queryParams);
    
    const response = await api.get<StrapiResponse<Vehicle>>('/api/vehicles', queryParams);
    
    console.log('Vehicles in use response:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching vehicles in use:', error);
    throw error;
  }
};

/**
 * Fetches a single vehicle in use by ID
 * @param vehicleId - The vehicle document ID
 * @returns Promise<Vehicle | null> - The vehicle if found and in use, null otherwise
 */
export const getVehicleInUseById = async (vehicleId: string): Promise<Vehicle | null> => {
  try {
    const queryParams = {
      'filters[documentId][$eq]': vehicleId,
      'filters[currentStatus][$eq]': 'in-transit',
      populate: '*',
    };

    console.log('Fetching vehicle in use by ID:', vehicleId);
    
    const response = await api.get<StrapiResponse<Vehicle>>('/api/vehicles', queryParams);
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      return response.data.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching vehicle in use by ID:', error);
    throw error;
  }
};

/**
 * Checks if a specific vehicle is currently in use
 * @param vehicleId - The vehicle document ID
 * @returns Promise<boolean> - True if vehicle is in use, false otherwise
 */
export const isVehicleInUse = async (vehicleId: string): Promise<boolean> => {
  try {
    const vehicle = await getVehicleInUseById(vehicleId);
    return vehicle !== null;
  } catch (error) {
    console.error('Error checking if vehicle is in use:', error);
    return false;
  }
};

/**
 * Gets the count of vehicles currently in use
 * @returns Promise<number> - Number of vehicles in use
 */
export const getVehiclesInUseCount = async (): Promise<number> => {
  try {
    const queryParams = {
      'filters[currentStatus][$eq]': 'in-transit',
      pagination: {
        page: 1,
        pageSize: 1,
      },
    };

    console.log('Getting vehicles in use count');
    
    const response = await api.get<StrapiResponse<Vehicle>>('/api/vehicles', queryParams);
    
    return response.data.meta?.pagination?.total || 0;
  } catch (error) {
    console.error('Error getting vehicles in use count:', error);
    return 0;
  }
};

/**
 * Gets vehicles in use with additional filters
 * @param filters - Additional filters to apply
 * @returns Promise<StrapiResponse<Vehicle>> - Response containing filtered vehicles in use
 */
export const getVehiclesInUseWithFilters = async (filters: {
  vehicleType?: string;
  isActive?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<StrapiResponse<Vehicle>> => {
  try {
    const queryParams: Record<string, unknown> = {
      'filters[currentStatus][$eq]': 'in-transit',
      populate: '*',
      sort: 'updatedAt:desc',
      ...filters,
    };

    // Add type filter if provided
    if (filters.vehicleType) {
      queryParams['filters[type][$eq]'] = filters.vehicleType;
    }

    // Add active status filter if provided
    if (filters.isActive !== undefined) {
      queryParams['filters[isActive][$eq]'] = filters.isActive;
    }

    // Add date range filter if provided
    if (filters.dateRange) {
      queryParams['filters[updatedAt][$gte]'] = filters.dateRange.start;
      queryParams['filters[updatedAt][$lte]'] = filters.dateRange.end;
    }

    // Add search filter if provided
    if (filters.search) {
      queryParams['filters[$or][0][vehicleNumber][$containsi]'] = filters.search;
      queryParams['filters[$or][1][model][$containsi]'] = filters.search;
    }

    console.log('Fetching vehicles in use with filters:', queryParams);
    
    const response = await api.get<StrapiResponse<Vehicle>>('/api/vehicles', queryParams);
    
    console.log('Filtered vehicles in use response:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching vehicles in use with filters:', error);
    throw error;
  }
};

/**
 * Fetches drivers that are currently unavailable (assigned to in-transit trips)
 * @param params - Optional pagination and filter parameters
 * @returns Promise<StrapiResponse<Trip>> - Response containing trips with in-transit status
 */
export const getDriversInUse = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<StrapiResponse<Trip>> => {
  try {
    const queryParams = {
      ...params,
      'filters[currentStatus][$eq]': 'in-transit', // Filter for in-transit trips
      populate: '*', // Populate driver and vehicle data
      sort: 'updatedAt:desc', // Sort by most recently updated
    };

    console.log('Fetching drivers in use (in-transit trips) with params:', queryParams);
    
    const response = await api.get<StrapiResponse<Trip>>('/api/trips', queryParams);
    
    console.log('Drivers in use response:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching drivers in use:', error);
    throw error;
  }
};

/**
 * Fetches a single driver in use by driver ID
 * @param driverId - The driver document ID
 * @returns Promise<Trip | null> - The trip if found and driver is in use, null otherwise
 */
export const getDriverInUseById = async (driverId: string): Promise<Trip | null> => {
  try {
    const queryParams = {
      'filters[driver][$eq]': driverId,
      'filters[currentStatus][$eq]': 'in-transit',
      populate: '*',
    };

    console.log('Fetching driver in use by ID:', driverId);
    
    const response = await api.get<StrapiResponse<Trip>>('/api/trips', queryParams);
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      return response.data.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching driver in use by ID:', error);
    throw error;
  }
};

/**
 * Checks if a specific driver is currently unavailable (assigned to in-transit trip)
 * @param driverId - The driver document ID
 * @returns Promise<boolean> - True if driver is unavailable, false otherwise
 */
export const isDriverInUse = async (driverId: string): Promise<boolean> => {
  try {
    const trip = await getDriverInUseById(driverId);
    return trip !== null;
  } catch (error) {
    console.error('Error checking if driver is in use:', error);
    return false;
  }
};

/**
 * Gets the count of drivers currently in use (assigned to in-transit trips)
 * @returns Promise<number> - Number of drivers currently in use
 */
export const getDriversInUseCount = async (): Promise<number> => {
  try {
    const queryParams = {
      'filters[currentStatus][$eq]': 'in-transit',
      pagination: {
        page: 1,
        pageSize: 1,
      },
    };

    console.log('Getting drivers in use count');
    
    const response = await api.get<StrapiResponse<Trip>>('/api/trips', queryParams);
    
    return response.data.meta?.pagination?.total || 0;
  } catch (error) {
    console.error('Error getting drivers in use count:', error);
    return 0;
  }
};

/**
 * Gets drivers in use with additional filters
 * @param filters - Additional filters to apply
 * @returns Promise<StrapiResponse<Trip>> - Response containing filtered trips with drivers in use
 */
export const getDriversInUseWithFilters = async (filters: {
  driverName?: string;
  vehicleNumber?: string;
  isActive?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<StrapiResponse<Trip>> => {
  try {
    const queryParams: Record<string, unknown> = {
      'filters[currentStatus][$eq]': 'in-transit',
      populate: '*',
      sort: 'updatedAt:desc',
      ...filters,
    };

    // Add date range filter if provided
    if (filters.dateRange) {
      queryParams['filters[estimatedStartTime][$gte]'] = filters.dateRange.start;
      queryParams['filters[estimatedStartTime][$lte]'] = filters.dateRange.end;
    }

    // Add search filter if provided
    if (filters.search) {
      queryParams['filters[$or][0][tripNumber][$containsi]'] = filters.search;
      queryParams['filters[$or][1][driver][fullName][$containsi]'] = filters.search;
    }

    console.log('Fetching drivers in use with filters:', queryParams);
    
    const response = await api.get<StrapiResponse<Trip>>('/api/trips', queryParams);
    
    console.log('Filtered drivers in use response:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching drivers in use with filters:', error);
    throw error;
  }
};
