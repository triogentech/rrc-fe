import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Vehicle } from '../api/types';

interface VehiclesInUseState {
  vehicles: Vehicle[];
  currentVehicle: Vehicle | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  } | null;
  filters: {
    vehicleType?: string;
    isActive?: boolean;
    dateRange?: {
      start: string;
      end: string;
    };
    search?: string;
  };
}

const initialState: VehiclesInUseState = {
  vehicles: [],
  currentVehicle: null,
  isLoading: false,
  error: null,
  pagination: null,
  filters: {},
};

const vehiclesInUseSlice = createSlice({
  name: 'vehiclesInUse',
  initialState,
  reducers: {
    setVehiclesInUse: (state, action: PayloadAction<Vehicle[]>) => {
      state.vehicles = action.payload;
    },
    setCurrentVehicleInUse: (state, action: PayloadAction<Vehicle | null>) => {
      state.currentVehicle = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPagination: (state, action: PayloadAction<{
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    } | null>) => {
      state.pagination = action.payload;
    },
    setFilters: (state, action: PayloadAction<{
      vehicleType?: string;
      isActive?: boolean;
      dateRange?: {
        start: string;
        end: string;
      };
      search?: string;
    }>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearError: (state) => {
      state.error = null;
    },
    addVehicleInUse: (state, action: PayloadAction<Vehicle>) => {
      const existingIndex = state.vehicles.findIndex(
        vehicle => vehicle.documentId === action.payload.documentId
      );
      if (existingIndex === -1) {
        state.vehicles.unshift(action.payload);
      } else {
        state.vehicles[existingIndex] = action.payload;
      }
    },
    removeVehicleInUse: (state, action: PayloadAction<string>) => {
      state.vehicles = state.vehicles.filter(
        vehicle => vehicle.documentId !== action.payload
      );
    },
    updateVehicleInUse: (state, action: PayloadAction<Vehicle>) => {
      const index = state.vehicles.findIndex(
        vehicle => vehicle.documentId === action.payload.documentId
      );
      if (index !== -1) {
        state.vehicles[index] = action.payload;
      }
    },
  },
});

export const {
  setVehiclesInUse,
  setCurrentVehicleInUse,
  setLoading,
  setError,
  setPagination,
  setFilters,
  clearFilters,
  clearError,
  addVehicleInUse,
  removeVehicleInUse,
  updateVehicleInUse,
} = vehiclesInUseSlice.actions;

export default vehiclesInUseSlice.reducer;

