import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Trip, StrapiResponse } from '../api/types';

export interface TripsState {
  trips: Trip[];
  currentTrip: Trip | null;
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
    status: string | null;
  };
}

const initialState: TripsState = {
  trips: [],
  currentTrip: null,
  isLoading: false,
  error: null,
  pagination: null,
  filters: {
    search: '',
    status: null,
  },
};

const tripsSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTrips: (state, action: PayloadAction<StrapiResponse<Trip> | Trip[]>) => {
      // Handle both Strapi response format and simple array format
      if (Array.isArray(action.payload)) {
        // Simple array format
        state.trips = action.payload;
        state.pagination = {
          page: 1,
          pageSize: action.payload.length,
          pageCount: 1,
          total: action.payload.length,
        };
      } else {
        // Strapi response format
        state.trips = action.payload.data;
        state.pagination = {
          page: action.payload.meta.pagination.page,
          pageSize: action.payload.meta.pagination.pageSize,
          pageCount: action.payload.meta.pagination.pageCount,
          total: action.payload.meta.pagination.total,
        };
      }
      state.error = null;
    },
    setCurrentTrip: (state, action: PayloadAction<Trip | null>) => {
      state.currentTrip = action.payload;
    },
    addTrip: (state, action: PayloadAction<Trip>) => {
      state.trips.unshift(action.payload);
      if (state.pagination) {
        state.pagination.total += 1;
      }
    },
    updateTrip: (state, action: PayloadAction<Trip>) => {
      const index = state.trips.findIndex(trip => trip.id === action.payload.id);
      if (index !== -1) {
        state.trips[index] = action.payload;
      }
      if (state.currentTrip?.id === action.payload.id) {
        state.currentTrip = action.payload;
      }
    },
    removeTrip: (state, action: PayloadAction<string>) => {
      console.log('Redux: Removing trip with documentId:', action.payload);
      console.log('Redux: Trips before removal:', state.trips.length);
      state.trips = state.trips.filter(trip => trip.documentId !== action.payload);
      console.log('Redux: Trips after removal:', state.trips.length);
      if (state.currentTrip?.documentId === action.payload) {
        state.currentTrip = null;
      }
      if (state.pagination) {
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<TripsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        status: null,
      };
    },
    resetTripsState: () => {
      return initialState;
    },
  },
});

export const {
  setLoading,
  setTrips,
  setCurrentTrip,
  addTrip,
  updateTrip,
  removeTrip,
  setError,
  clearError,
  setFilters,
  clearFilters,
  resetTripsState,
} = tripsSlice.actions;

export const selectTrips = (state: { trips: TripsState }) => state.trips;
export const selectCurrentTrip = (state: { trips: TripsState }) => state.trips.currentTrip;
export const selectTripsLoading = (state: { trips: TripsState }) => state.trips.isLoading;
export const selectTripsError = (state: { trips: TripsState }) => state.trips.error;
export const selectTripsPagination = (state: { trips: TripsState }) => state.trips.pagination;
export const selectTripsFilters = (state: { trips: TripsState }) => state.trips.filters;

export default tripsSlice.reducer;
