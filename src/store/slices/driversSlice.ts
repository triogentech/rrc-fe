import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Driver, StrapiResponse } from '../api/types';

// Driver state interface
export interface DriversState {
  drivers: Driver[];
  currentDriver: Driver | null;
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
    isActive: boolean | null;
  };
}

// Initial state
const initialState: DriversState = {
  drivers: [],
  currentDriver: null,
  isLoading: false,
  error: null,
  pagination: null,
  filters: {
    search: '',
    isActive: null,
  },
};

// Create the drivers slice
const driversSlice = createSlice({
  name: 'drivers',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set drivers data
    setDrivers: (state, action: PayloadAction<StrapiResponse<Driver> | Driver[]>) => {
      // Handle both Strapi response format and simple array format
      if (Array.isArray(action.payload)) {
        // Simple array format
        state.drivers = action.payload;
        state.pagination = {
          page: 1,
          pageSize: action.payload.length,
          pageCount: 1,
          total: action.payload.length,
        };
      } else {
        // Strapi response format
        state.drivers = action.payload.data;
        state.pagination = {
          page: action.payload.meta.pagination.page,
          pageSize: action.payload.meta.pagination.pageSize,
          pageCount: action.payload.meta.pagination.pageCount,
          total: action.payload.meta.pagination.total,
        };
      }
      state.error = null;
    },

    // Set current driver
    setCurrentDriver: (state, action: PayloadAction<Driver | null>) => {
      state.currentDriver = action.payload;
    },

    // Add new driver
    addDriver: (state, action: PayloadAction<Driver>) => {
      state.drivers.unshift(action.payload);
      if (state.pagination) {
        state.pagination.total += 1;
      }
    },

    // Update driver
    updateDriver: (state, action: PayloadAction<Driver>) => {
      const index = state.drivers.findIndex(driver => driver.id === action.payload.id);
      if (index !== -1) {
        state.drivers[index] = action.payload;
      }
      if (state.currentDriver?.id === action.payload.id) {
        state.currentDriver = action.payload;
      }
    },

    // Remove driver
    removeDriver: (state, action: PayloadAction<string>) => {
      console.log('Redux: Removing driver with documentId:', action.payload);
      console.log('Redux: Drivers before removal:', state.drivers.length);
      state.drivers = state.drivers.filter(driver => driver.documentId !== action.payload);
      console.log('Redux: Drivers after removal:', state.drivers.length);
      if (state.currentDriver?.documentId === action.payload) {
        state.currentDriver = null;
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
    setFilters: (state, action: PayloadAction<Partial<DriversState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = {
        search: '',
        isActive: null,
      };
    },

    // Reset state
    resetDriversState: () => {
      return initialState;
    },
  },
});

// Export actions
export const {
  setLoading,
  setDrivers,
  setCurrentDriver,
  addDriver,
  updateDriver,
  removeDriver,
  setError,
  clearError,
  setFilters,
  clearFilters,
  resetDriversState,
} = driversSlice.actions;

// Selectors
export const selectDrivers = (state: { drivers: DriversState }) => state.drivers;
export const selectCurrentDriver = (state: { drivers: DriversState }) => state.drivers.currentDriver;
export const selectDriversLoading = (state: { drivers: DriversState }) => state.drivers.isLoading;
export const selectDriversError = (state: { drivers: DriversState }) => state.drivers.error;
export const selectDriversPagination = (state: { drivers: DriversState }) => state.drivers.pagination;
export const selectDriversFilters = (state: { drivers: DriversState }) => state.drivers.filters;

// Export reducer
export default driversSlice.reducer;
