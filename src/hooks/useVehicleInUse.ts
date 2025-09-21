import { useState, useEffect, useCallback } from 'react';
import { 
  getVehiclesInUse, 
  getVehicleInUseById, 
  isVehicleInUse, 
  getVehiclesInUseCount,
  getVehiclesInUseWithFilters,
  getDriversInUse,
  getDriverInUseById,
  isDriverInUse,
  getDriversInUseCount,
  getDriversInUseWithFilters
} from '@/utils/vehicleInUse';
import type { Vehicle, Trip } from '@/store/api/types';

interface UseVehicleInUseOptions {
  autoFetch?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
}

interface UseVehicleInUseFilters {
  vehicleType?: string;
  isActive?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  pageSize?: number;
  search?: string;
}

export const useVehicleInUse = (options: UseVehicleInUseOptions = {}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [driversInUseTrips, setDriversInUseTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  } | null>(null);

  const fetchVehiclesInUse = useCallback(async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getVehiclesInUse(params);
      setVehicles(response.data || []);
      setPagination(response.meta?.pagination || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vehicles in use';
      setError(errorMessage);
      console.error('Error fetching vehicles in use:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchVehiclesInUseWithFilters = useCallback(async (filters: UseVehicleInUseFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getVehiclesInUseWithFilters(filters);
      setVehicles(response.data || []);
      setPagination(response.meta?.pagination || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vehicles in use with filters';
      setError(errorMessage);
      console.error('Error fetching vehicles in use with filters:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkVehicleInUse = useCallback(async (vehicleId: string): Promise<boolean> => {
    try {
      return await isVehicleInUse(vehicleId);
    } catch (err) {
      console.error('Error checking if vehicle is in use:', err);
      return false;
    }
  }, []);

  const getVehicleInUse = useCallback(async (vehicleId: string): Promise<Vehicle | null> => {
    try {
      return await getVehicleInUseById(vehicleId);
    } catch (err) {
      console.error('Error getting vehicle in use:', err);
      return null;
    }
  }, []);

  const getCount = useCallback(async (): Promise<number> => {
    try {
      return await getVehiclesInUseCount();
    } catch (err) {
      console.error('Error getting vehicles in use count:', err);
      return 0;
    }
  }, []);

  const fetchDriversInUse = useCallback(async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getDriversInUse(params);
      setDriversInUseTrips(response.data || []);
      setPagination(response.meta?.pagination || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch drivers in use';
      setError(errorMessage);
      console.error('Error fetching drivers in use:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDriversInUseWithFilters = useCallback(async (filters: UseVehicleInUseFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getDriversInUseWithFilters(filters);
      setDriversInUseTrips(response.data || []);
      setPagination(response.meta?.pagination || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch drivers in use with filters';
      setError(errorMessage);
      console.error('Error fetching drivers in use with filters:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkDriverInUse = useCallback(async (driverId: string): Promise<boolean> => {
    try {
      return await isDriverInUse(driverId);
    } catch (err) {
      console.error('Error checking if driver is in use:', err);
      return false;
    }
  }, []);

  const getDriverInUse = useCallback(async (driverId: string): Promise<Trip | null> => {
    try {
      return await getDriverInUseById(driverId);
    } catch (err) {
      console.error('Error getting driver in use:', err);
      return null;
    }
  }, []);

  const getDriversCount = useCallback(async (): Promise<number> => {
    try {
      return await getDriversInUseCount();
    } catch (err) {
      console.error('Error getting drivers in use count:', err);
      return 0;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchVehiclesInUse({
        page: options.page,
        pageSize: options.pageSize,
        search: options.search,
      });
    }
  }, [fetchVehiclesInUse, options.autoFetch, options.page, options.pageSize, options.search]);

  return {
    vehicles,
    driversInUseTrips,
    isLoading,
    error,
    pagination,
    fetchVehiclesInUse,
    fetchVehiclesInUseWithFilters,
    checkVehicleInUse,
    getVehicleInUse,
    getCount,
    fetchDriversInUse,
    fetchDriversInUseWithFilters,
    checkDriverInUse,
    getDriverInUse,
    getDriversCount,
    clearError,
  };
};

export default useVehicleInUse;

