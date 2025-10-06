import { createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getVehiclesInUse, 
  getVehicleInUseById, 
  isVehicleInUse, 
  getVehiclesInUseCount,
  getVehiclesInUseWithFilters 
} from '@/utils/vehicleInUse';
// Vehicle type is not directly used in this file

// Fetch vehicles in use
export const getVehiclesInUseThunk = createAsyncThunk(
  'vehiclesInUse/getVehiclesInUse',
  async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    const response = await getVehiclesInUse(params);
    return response;
  }
);

// Fetch vehicles in use with filters
export const getVehiclesInUseWithFiltersThunk = createAsyncThunk(
  'vehiclesInUse/getVehiclesInUseWithFilters',
  async (filters: {
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
    const response = await getVehiclesInUseWithFilters(filters);
    return response;
  }
);

// Get single vehicle in use by ID
export const getVehicleInUseByIdThunk = createAsyncThunk(
  'vehiclesInUse/getVehicleInUseById',
  async (vehicleId: string) => {
    const vehicle = await getVehicleInUseById(vehicleId);
    return vehicle;
  }
);

// Check if vehicle is in use
export const checkVehicleInUseThunk = createAsyncThunk(
  'vehiclesInUse/checkVehicleInUse',
  async (vehicleId: string) => {
    const inUse = await isVehicleInUse(vehicleId);
    return { vehicleId, inUse };
  }
);

// Get count of vehicles in use
export const getVehiclesInUseCountThunk = createAsyncThunk(
  'vehiclesInUse/getVehiclesInUseCount',
  async () => {
    const count = await getVehiclesInUseCount();
    return count;
  }
);

