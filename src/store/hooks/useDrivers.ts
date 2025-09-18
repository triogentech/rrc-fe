import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectDrivers,
  selectCurrentDriver,
  selectDriversLoading,
  selectDriversError,
  selectDriversPagination,
  selectDriversFilters,
  setFilters,
  clearFilters,
  clearError,
} from '../slices/driversSlice';
import { selectIsAuthenticated } from '../slices/authSlice';
import {
  getDriversThunk,
  getDriverThunk,
  createDriverThunk,
  updateDriverThunk,
  deleteDriverThunk,
  toggleDriverStatusThunk,
  searchDriversThunk,
} from '../thunks/driversThunks';
import type { Driver, DriverCreateRequest, DriverUpdateRequest, PaginationParams } from '../api/types';

// Custom hook for driver management
export const useDrivers = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const drivers = useAppSelector(selectDrivers);
  const currentDriver = useAppSelector(selectCurrentDriver);
  const isLoading = useAppSelector(selectDriversLoading);
  const error = useAppSelector(selectDriversError);
  const pagination = useAppSelector(selectDriversPagination);
  const filters = useAppSelector(selectDriversFilters);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Get drivers
  const getDrivers = useCallback(async (params?: PaginationParams & { isActive?: boolean; search?: string }) => {
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping drivers fetch');
      return;
    }
    
    try {
      await dispatch(getDriversThunk(params)).unwrap();
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    }
  }, [dispatch, isAuthenticated]);

  // Get driver by ID
  const getDriver = useCallback(async (id: string): Promise<Driver | null> => {
    try {
      const driver = await dispatch(getDriverThunk(id)).unwrap();
      return driver;
    } catch (error) {
      console.error('Failed to fetch driver:', error);
      return null;
    }
  }, [dispatch]);

  // Create driver
  const createDriver = useCallback(async (driverData: DriverCreateRequest): Promise<Driver | null> => {
    try {
      const driver = await dispatch(createDriverThunk(driverData)).unwrap();
      return driver;
    } catch (error) {
      console.error('Failed to create driver:', error);
      return null;
    }
  }, [dispatch]);

  // Update driver
  const updateDriver = useCallback(async (id: string, data: DriverUpdateRequest): Promise<Driver | null> => {
    try {
      const driver = await dispatch(updateDriverThunk({ id, data })).unwrap();
      return driver;
    } catch (error) {
      console.error('Failed to update driver:', error);
      return null;
    }
  }, [dispatch]);

  // Delete driver
  const deleteDriver = useCallback(async (id: string): Promise<boolean> => {
    try {
      await dispatch(deleteDriverThunk(id)).unwrap();
      return true;
    } catch (error) {
      console.error('Failed to delete driver:', error);
      return false;
    }
  }, [dispatch]);

  // Toggle driver status
  const toggleDriverStatus = useCallback(async (id: string): Promise<Driver | null> => {
    try {
      const driver = await dispatch(toggleDriverStatusThunk(id)).unwrap();
      return driver;
    } catch (error) {
      console.error('Failed to toggle driver status:', error);
      return null;
    }
  }, [dispatch]);

  // Search drivers
  const searchDrivers = useCallback(async (query: string, params?: PaginationParams) => {
    try {
      await dispatch(searchDriversThunk({ query, params })).unwrap();
    } catch (error) {
      console.error('Failed to search drivers:', error);
    }
  }, [dispatch]);

  // Set filters
  const setDriversFilters = useCallback((newFilters: Partial<typeof filters>) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  // Clear filters
  const clearDriversFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  // Clear error
  const clearDriversError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Get driver display name
  const getDriverDisplayName = useCallback((driver: Driver): string => {
    return driver.fullName || `Driver ${driver.id}`;
  }, []);

  // Get driver contact info
  const getDriverContactInfo = useCallback((driver: Driver): string => {
    return `${driver.countryDialCode} ${driver.contactNumber}`;
  }, []);

  // Get driver emergency contact info
  const getDriverEmergencyContact = useCallback((driver: Driver): string => {
    return `${driver.emgCountryDialCode} ${driver.emgContactNumber}`;
  }, []);

  // Check if driver is active
  const isDriverActive = useCallback((driver: Driver): boolean => {
    return driver.isActive !== false; // Default to true if not specified
  }, []);

  // Get drivers count by status
  const getDriversCountByStatus = useCallback((isActive: boolean): number => {
    return drivers.drivers.filter(driver => isDriverActive(driver) === isActive).length;
  }, [drivers, isDriverActive]);

  // Get total drivers count
  const getTotalDriversCount = useCallback((): number => {
    return drivers.drivers.length;
  }, [drivers]);

  // Get active drivers count
  const getActiveDriversCount = useCallback((): number => {
    return getDriversCountByStatus(true);
  }, [getDriversCountByStatus]);

  // Get inactive drivers count
  const getInactiveDriversCount = useCallback((): number => {
    return getDriversCountByStatus(false);
  }, [getDriversCountByStatus]);

  return {
    // State
    drivers: drivers.drivers,
    currentDriver,
    isLoading,
    error,
    pagination,
    filters,
    isAuthenticated,

    // Actions
    getDrivers,
    getDriver,
    createDriver,
    updateDriver,
    deleteDriver,
    toggleDriverStatus,
    searchDrivers,

    // Filter actions
    setDriversFilters,
    clearDriversFilters,

    // Utility actions
    clearDriversError,

    // Utility functions
    getDriverDisplayName,
    getDriverContactInfo,
    getDriverEmergencyContact,
    isDriverActive,
    getDriversCountByStatus,
    getTotalDriversCount,
    getActiveDriversCount,
    getInactiveDriversCount,
  };
};

export default useDrivers;
