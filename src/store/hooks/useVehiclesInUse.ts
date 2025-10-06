import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setFilters,
  clearFilters,
  clearError,
  addVehicleInUse,
  removeVehicleInUse,
  updateVehicleInUse,
} from '../slices/vehiclesInUseSlice';
import {
  getVehiclesInUseThunk,
  getVehiclesInUseWithFiltersThunk,
  getVehicleInUseByIdThunk,
  checkVehicleInUseThunk,
  getVehiclesInUseCountThunk,
} from '../thunks/vehiclesInUseThunks';
import type { Vehicle } from '../api/types';
import type { RootState } from '../store';

// Selectors
export const selectVehiclesInUse = (state: RootState) => state.vehiclesInUse.vehicles;
export const selectCurrentVehicleInUse = (state: RootState) => state.vehiclesInUse.currentVehicle;
export const selectVehiclesInUseLoading = (state: RootState) => state.vehiclesInUse.isLoading;
export const selectVehiclesInUseError = (state: RootState) => state.vehiclesInUse.error;
export const selectVehiclesInUsePagination = (state: RootState) => state.vehiclesInUse.pagination;
export const selectVehiclesInUseFilters = (state: RootState) => state.vehiclesInUse.filters;

// Custom hook for vehicles in use management
export const useVehiclesInUse = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const vehicles = useAppSelector(selectVehiclesInUse);
  const currentVehicle = useAppSelector(selectCurrentVehicleInUse);
  const isLoading = useAppSelector(selectVehiclesInUseLoading);
  const error = useAppSelector(selectVehiclesInUseError);
  const pagination = useAppSelector(selectVehiclesInUsePagination);
  const filters = useAppSelector(selectVehiclesInUseFilters);

  // Actions
  const getVehiclesInUse = useCallback((params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    return dispatch(getVehiclesInUseThunk(params));
  }, [dispatch]);

  const getVehiclesInUseWithFilters = useCallback((filters: {
    vehicleType?: string;
    isActive?: boolean;
    dateRange?: {
      start: string;
      end: string;
    };
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    return dispatch(getVehiclesInUseWithFiltersThunk(filters));
  }, [dispatch]);

  const getVehicleInUseById = useCallback((vehicleId: string) => {
    return dispatch(getVehicleInUseByIdThunk(vehicleId));
  }, [dispatch]);

  const checkVehicleInUse = useCallback((vehicleId: string) => {
    return dispatch(checkVehicleInUseThunk(vehicleId));
  }, [dispatch]);

  const getVehiclesInUseCount = useCallback(() => {
    return dispatch(getVehiclesInUseCountThunk());
  }, [dispatch]);

  const setVehiclesInUseFilters = useCallback((newFilters: {
    vehicleType?: string;
    isActive?: boolean;
    dateRange?: {
      start: string;
      end: string;
    };
    search?: string;
  }) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  const clearVehiclesInUseFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const clearVehiclesInUseError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const addVehicleToInUse = useCallback((vehicle: Vehicle) => {
    dispatch(addVehicleInUse(vehicle));
  }, [dispatch]);

  const removeVehicleFromInUse = useCallback((vehicleId: string) => {
    dispatch(removeVehicleInUse(vehicleId));
  }, [dispatch]);

  const updateVehicleInUseStatus = useCallback((vehicle: Vehicle) => {
    dispatch(updateVehicleInUse(vehicle));
  }, [dispatch]);

  // Utility functions
  const getVehiclesInUseCountByType = useCallback((type: string): number => {
    return vehicles.filter(vehicle => vehicle.type === type).length;
  }, [vehicles]);

  const getVehiclesInUseCountByStatus = useCallback((isActive: boolean): number => {
    return vehicles.filter(vehicle => vehicle.isActive === isActive).length;
  }, [vehicles]);

  const getTotalVehiclesInUseCount = useCallback((): number => {
    return vehicles.length;
  }, [vehicles]);

  const isVehicleCurrentlyInUse = useCallback((vehicleId: string): boolean => {
    return vehicles.some(vehicle => vehicle.documentId === vehicleId);
  }, [vehicles]);

  return {
    // State
    vehicles,
    currentVehicle,
    isLoading,
    error,
    pagination,
    filters,

    // Actions
    getVehiclesInUse,
    getVehiclesInUseWithFilters,
    getVehicleInUseById,
    checkVehicleInUse,
    getVehiclesInUseCount,

    // Filter actions
    setVehiclesInUseFilters,
    clearVehiclesInUseFilters,

    // Utility actions
    clearVehiclesInUseError,
    addVehicleToInUse,
    removeVehicleFromInUse,
    updateVehicleInUseStatus,

    // Utility functions
    getVehiclesInUseCountByType,
    getVehiclesInUseCountByStatus,
    getTotalVehiclesInUseCount,
    isVehicleCurrentlyInUse,
  };
};

export default useVehiclesInUse;
