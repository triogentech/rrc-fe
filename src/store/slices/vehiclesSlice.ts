import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Vehicle, StrapiResponse } from '../api/types';

// Vehicle state interface
export interface VehiclesState {
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
    search: string;
    active: boolean | null;
    currentStatus: string | null;
    type: string | null;
  };
}

// Initial state
const initialState: VehiclesState = {
  vehicles: [],
  currentVehicle: null,
  isLoading: false,
  error: null,
  pagination: null,
  filters: {
    search: '',
    active: null,
    currentStatus: null,
    type: null,
  },
};

// Create the vehicles slice
const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set vehicles data
    setVehicles: (state, action: PayloadAction<StrapiResponse<Vehicle> | Vehicle[]>) => {
      // Handle both Strapi response format and simple array format
      if (Array.isArray(action.payload)) {
        // Simple array format
        state.vehicles = action.payload;
        state.pagination = {
          page: 1,
          pageSize: action.payload.length,
          pageCount: 1,
          total: action.payload.length,
        };
      } else {
        // Strapi response format
        state.vehicles = action.payload.data;
        state.pagination = {
          page: action.payload.meta.pagination.page,
          pageSize: action.payload.meta.pagination.pageSize,
          pageCount: action.payload.meta.pagination.pageCount,
          total: action.payload.meta.pagination.total,
        };
      }
      state.error = null;
    },

    // Set current vehicle
    setCurrentVehicle: (state, action: PayloadAction<Vehicle | null>) => {
      state.currentVehicle = action.payload;
    },

    // Add new vehicle
    addVehicle: (state, action: PayloadAction<Vehicle>) => {
      state.vehicles.unshift(action.payload);
      if (state.pagination) {
        state.pagination.total += 1;
      }
    },

    // Update vehicle
    updateVehicle: (state, action: PayloadAction<Vehicle>) => {
      const index = state.vehicles.findIndex(vehicle => vehicle.id === action.payload.id);
      if (index !== -1) {
        state.vehicles[index] = action.payload;
      }
      if (state.currentVehicle?.id === action.payload.id) {
        state.currentVehicle = action.payload;
      }
    },

    // Remove vehicle
    removeVehicle: (state, action: PayloadAction<string>) => {
      console.log('Redux: Removing vehicle with documentId:', action.payload);
      console.log('Redux: Vehicles before removal:', state.vehicles.length);
      state.vehicles = state.vehicles.filter(vehicle => vehicle.documentId !== action.payload);
      console.log('Redux: Vehicles after removal:', state.vehicles.length);
      if (state.currentVehicle?.documentId === action.payload) {
        state.currentVehicle = null;
      }
      if (state.pagination) {
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      }
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set filters
    setFilters: (state, action: PayloadAction<Partial<VehiclesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = {
        search: '',
        active: null,
        currentStatus: null,
        type: null,
      };
    },

    // Reset state
    resetVehiclesState: () => {
      return initialState;
    },
  },
});

// Export actions
export const {
  setLoading,
  setVehicles,
  setCurrentVehicle,
  addVehicle,
  updateVehicle,
  removeVehicle,
  setError,
  clearError,
  setFilters,
  clearFilters,
  resetVehiclesState,
} = vehiclesSlice.actions;

// Selectors
export const selectVehicles = (state: { vehicles: VehiclesState }) => state.vehicles;
export const selectCurrentVehicle = (state: { vehicles: VehiclesState }) => state.vehicles.currentVehicle;
export const selectVehiclesLoading = (state: { vehicles: VehiclesState }) => state.vehicles.isLoading;
export const selectVehiclesError = (state: { vehicles: VehiclesState }) => state.vehicles.error;
export const selectVehiclesPagination = (state: { vehicles: VehiclesState }) => state.vehicles.pagination;
export const selectVehiclesFilters = (state: { vehicles: VehiclesState }) => state.vehicles.filters;

// Export reducer
export default vehiclesSlice.reducer;
