import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectVehicles,
  selectCurrentVehicle,
  selectVehiclesLoading,
  selectVehiclesError,
  selectVehiclesPagination,
  selectVehiclesFilters,
  setFilters,
  clearFilters,
  clearError,
} from '../slices/vehiclesSlice';
import { selectIsAuthenticated } from '../slices/authSlice';
import {
  getVehiclesThunk,
  getVehicleThunk,
  createVehicleThunk,
  updateVehicleThunk,
  deleteVehicleThunk,
  toggleVehicleStatusThunk,
  searchVehiclesThunk,
} from '../thunks/vehiclesThunks';
import type { Vehicle, VehicleCreateRequest, VehicleUpdateRequest, PaginationParams } from '../api/types';
import { VehicleType, VehicleCurrentStatus } from '../api/types';

// Custom hook for vehicle management
export const useVehicles = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const vehicles = useAppSelector(selectVehicles);
  const currentVehicle = useAppSelector(selectCurrentVehicle);
  const isLoading = useAppSelector(selectVehiclesLoading);
  const error = useAppSelector(selectVehiclesError);
  const pagination = useAppSelector(selectVehiclesPagination);
  const filters = useAppSelector(selectVehiclesFilters);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Get vehicles
  const getVehicles = useCallback(async (params?: PaginationParams & { active?: boolean; currentStatus?: string; type?: string; search?: string }) => {
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping vehicles fetch');
      return;
    }
    
    try {
      await dispatch(getVehiclesThunk(params)).unwrap();
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  }, [dispatch, isAuthenticated]);

  // Get vehicle by ID
  const getVehicle = useCallback(async (id: string): Promise<Vehicle | null> => {
    try {
      const vehicle = await dispatch(getVehicleThunk(id)).unwrap();
      return vehicle;
    } catch (error) {
      console.error('Failed to fetch vehicle:', error);
      return null;
    }
  }, [dispatch]);

  // Create vehicle
  const createVehicle = useCallback(async (vehicleData: VehicleCreateRequest): Promise<Vehicle | null> => {
    try {
      const vehicle = await dispatch(createVehicleThunk(vehicleData)).unwrap();
      return vehicle;
    } catch (error) {
      console.error('Failed to create vehicle:', error);
      return null;
    }
  }, [dispatch]);

  // Update vehicle
  const updateVehicle = useCallback(async (id: string, data: VehicleUpdateRequest): Promise<Vehicle | null> => {
    try {
      const vehicle = await dispatch(updateVehicleThunk({ id, data })).unwrap();
      return vehicle;
    } catch (error) {
      console.error('Failed to update vehicle:', error);
      return null;
    }
  }, [dispatch]);

  // Delete vehicle
  const deleteVehicle = useCallback(async (id: string): Promise<boolean> => {
    try {
      await dispatch(deleteVehicleThunk(id)).unwrap();
      return true;
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      return false;
    }
  }, [dispatch]);

  // Toggle vehicle status
  const toggleVehicleStatus = useCallback(async (id: string): Promise<Vehicle | null> => {
    try {
      const vehicle = await dispatch(toggleVehicleStatusThunk(id)).unwrap();
      return vehicle;
    } catch (error) {
      console.error('Failed to toggle vehicle status:', error);
      return null;
    }
  }, [dispatch]);

  // Search vehicles
  const searchVehicles = useCallback(async (query: string, params?: PaginationParams) => {
    try {
      await dispatch(searchVehiclesThunk({ query, params })).unwrap();
    } catch (error) {
      console.error('Failed to search vehicles:', error);
    }
  }, [dispatch]);

  // Set filters
  const setVehiclesFilters = useCallback((newFilters: Partial<typeof filters>) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  // Clear filters
  const clearVehiclesFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  // Clear error
  const clearVehiclesError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Get vehicle display name
  const getVehicleDisplayName = useCallback((vehicle: Vehicle): string => {
    return `${vehicle.vehicleNumber} - ${vehicle.model}`;
  }, []);

  // Get vehicle type display name
  const getVehicleTypeDisplayName = useCallback((type: VehicleType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }, []);

  // Get vehicle status display name
  const getVehicleStatusDisplayName = useCallback((status: VehicleCurrentStatus | string): string => {
    const statusMap: Record<string, string> = {
      'choose_here': 'Choose here',
      'idle': 'Idle',
      'assigned': 'Assigned',
      'ongoing': 'Ongoing',
      [VehicleCurrentStatus.CHOOSE_HERE]: 'Choose here',
      [VehicleCurrentStatus.IDLE]: 'Idle',
      [VehicleCurrentStatus.ASSIGNED]: 'Assigned',
      [VehicleCurrentStatus.ONGOING]: 'Ongoing',
    };
    return statusMap[status] || status;
  }, []);

  // Get vehicle status color
  const getVehicleStatusColor = useCallback((status: VehicleCurrentStatus | string): string => {
    const colorMap: Record<string, string> = {
      'choose_here': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      'idle': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      'assigned': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'ongoing': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      [VehicleCurrentStatus.CHOOSE_HERE]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      [VehicleCurrentStatus.IDLE]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      [VehicleCurrentStatus.ASSIGNED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [VehicleCurrentStatus.ONGOING]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }, []);

  // Check if vehicle is active
  const isVehicleActive = useCallback((vehicle: Vehicle): boolean => {
    return vehicle.isActive === true;
  }, []);

  // Get vehicles count by status
  const getVehiclesCountByStatus = useCallback((active: boolean): number => {
    return vehicles.vehicles.filter(vehicle => isVehicleActive(vehicle) === active).length;
  }, [vehicles, isVehicleActive]);

  // Get vehicles count by current status
  const getVehiclesCountByCurrentStatus = useCallback((currentStatus: VehicleCurrentStatus): number => {
    return vehicles.vehicles.filter(vehicle => vehicle.currentStatus === currentStatus).length;
  }, [vehicles]);

  // Get vehicles count by type
  const getVehiclesCountByType = useCallback((type: VehicleType): number => {
    return vehicles.vehicles.filter(vehicle => vehicle.type === type).length;
  }, [vehicles]);

  // Get total vehicles count
  const getTotalVehiclesCount = useCallback((): number => {
    return vehicles.vehicles.length;
  }, [vehicles]);

  // Get active vehicles count
  const getActiveVehiclesCount = useCallback((): number => {
    return getVehiclesCountByStatus(true);
  }, [getVehiclesCountByStatus]);

  // Get inactive vehicles count
  const getInactiveVehiclesCount = useCallback((): number => {
    return getVehiclesCountByStatus(false);
  }, [getVehiclesCountByStatus]);

  // Get idle vehicles count
  const getIdleVehiclesCount = useCallback((): number => {
    return getVehiclesCountByCurrentStatus(VehicleCurrentStatus.IDLE);
  }, [getVehiclesCountByCurrentStatus]);

  // Get assigned vehicles count
  const getAssignedVehiclesCount = useCallback((): number => {
    return getVehiclesCountByCurrentStatus(VehicleCurrentStatus.ASSIGNED);
  }, [getVehiclesCountByCurrentStatus]);

  // Get ongoing vehicles count
  const getOngoingVehiclesCount = useCallback((): number => {
    return getVehiclesCountByCurrentStatus(VehicleCurrentStatus.ONGOING);
  }, [getVehiclesCountByCurrentStatus]);

  // Get choose here vehicles count
  const getChooseHereVehiclesCount = useCallback((): number => {
    return getVehiclesCountByCurrentStatus(VehicleCurrentStatus.CHOOSE_HERE);
  }, [getVehiclesCountByCurrentStatus]);

  return {
    // State
    vehicles: vehicles.vehicles,
    currentVehicle,
    isLoading,
    error,
    pagination,
    filters,
    isAuthenticated,

    // Actions
    getVehicles,
    getVehicle,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    toggleVehicleStatus,
    searchVehicles,

    // Filter actions
    setVehiclesFilters,
    clearVehiclesFilters,

    // Utility actions
    clearVehiclesError,

    // Utility functions
    getVehicleDisplayName,
    getVehicleTypeDisplayName,
    getVehicleStatusDisplayName,
    getVehicleStatusColor,
    isVehicleActive,
    getVehiclesCountByStatus,
    getVehiclesCountByCurrentStatus,
    getVehiclesCountByType,
    getTotalVehiclesCount,
    getActiveVehiclesCount,
    getInactiveVehiclesCount,
    getIdleVehiclesCount,
    getAssignedVehiclesCount,
    getOngoingVehiclesCount,
    getChooseHereVehiclesCount,
  };
};

export default useVehicles;
