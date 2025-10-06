import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectTrips,
  selectCurrentTrip,
  selectTripsLoading,
  selectTripsError,
  selectTripsPagination,
  selectTripsFilters,
  setFilters,
  clearFilters,
  clearError,
} from '../slices/tripsSlice';
import { selectIsAuthenticated } from '../slices/authSlice';
import {
  getTripsThunk,
  getTripThunk,
  createTripThunk,
  updateTripThunk,
  deleteTripThunk,
  searchTripsThunk,
} from '../thunks/tripsThunks';
import type { Trip, TripCreateRequest, TripUpdateRequest, PaginationParams, TripStatus } from '../api/types';

export const useTrips = () => {
  const dispatch = useAppDispatch();
  const tripsState = useAppSelector(selectTrips);
  const currentTrip = useAppSelector(selectCurrentTrip);
  const isLoading = useAppSelector(selectTripsLoading);
  const error = useAppSelector(selectTripsError);
  const pagination = useAppSelector(selectTripsPagination);
  const filters = useAppSelector(selectTripsFilters);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // API Actions
  const getTrips = useCallback(async (params?: PaginationParams & { search?: string; status?: string }): Promise<void> => {
    await dispatch(getTripsThunk(params));
  }, [dispatch]);

  const getTrip = useCallback(async (id: string): Promise<Trip | null> => {
    try {
      const result = await dispatch(getTripThunk(id)).unwrap();
      return result;
    } catch (error) {
      console.error('Failed to fetch trip:', error);
      return null;
    }
  }, [dispatch]);

  const createTrip = useCallback(async (tripData: TripCreateRequest): Promise<Trip | null> => {
    try {
      const result = await dispatch(createTripThunk(tripData)).unwrap();
      return result;
    } catch (error) {
      console.error('Failed to create trip:', error);
      return null;
    }
  }, [dispatch]);

  const updateTrip = useCallback(async (id: string, data: TripUpdateRequest): Promise<Trip | null> => {
    try {
      const result = await dispatch(updateTripThunk({ id, data })).unwrap();
      return result;
    } catch (error) {
      console.error('Failed to update trip:', error);
      return null;
    }
  }, [dispatch]);

  const deleteTrip = useCallback(async (id: string): Promise<boolean> => {
    try {
      await dispatch(deleteTripThunk(id)).unwrap();
      return true;
    } catch (error) {
      console.error('Failed to delete trip:', error);
      return false;
    }
  }, [dispatch]);

  const searchTrips = useCallback(async (query: string, params?: PaginationParams): Promise<void> => {
    await dispatch(searchTripsThunk({ query, params }));
  }, [dispatch]);

  // Filter Actions
  const setTripsFilters = useCallback((newFilters: Partial<typeof filters>) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  const clearTripsFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  // Error Actions
  const clearTripsError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Utility functions
  const getTripDisplayName = useCallback((trip: Trip): string => {
    return trip.tripNumber;
  }, []);

  const getTripStatusDisplayName = useCallback((status: TripStatus): string => {
    switch (status) {
      case 'created':
        return 'Created';
      case 'in-transit':
        return 'In Transit';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  }, []);

  const getTripStatusColor = useCallback((status: TripStatus): string => {
    switch (status) {
      case 'created':
        return 'bg-blue-100 text-blue-800';
      case 'in-transit':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const formatTripDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getTripDuration = useCallback((trip: Trip): string => {
    const start = new Date(trip.estimatedStartTime);
    const end = new Date(trip.estimatedEndTime);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }, []);

  const isTripActive = useCallback((trip: Trip): boolean => {
    return trip.currentStatus === 'in-transit';
  }, []);

  // Count functions
  const getTotalTripsCount = useCallback((): number => {
    return tripsState.trips.length;
  }, [tripsState]);

  const getActiveTripsCount = useCallback((): number => {
    return tripsState.trips.filter((trip: Trip) => isTripActive(trip)).length;
  }, [tripsState, isTripActive]);

  const getCompletedTripsCount = useCallback((): number => {
    return tripsState.trips.filter((trip: Trip) => trip.currentStatus === 'completed').length;
  }, [tripsState]);

  const getOngoingTripsCount = useCallback((): number => {
    return tripsState.trips.filter((trip: Trip) => trip.currentStatus === 'in-transit').length;
  }, [tripsState]);

  return {
    // State
    trips: tripsState.trips,
    currentTrip,
    isLoading,
    error,
    pagination,
    filters,
    isAuthenticated,

    // Actions
    getTrips,
    getTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    searchTrips,
    setTripsFilters,
    clearTripsFilters,
    clearTripsError,

    // Utilities
    getTripDisplayName,
    getTripStatusDisplayName,
    getTripStatusColor,
    formatTripDate,
    getTripDuration,
    isTripActive,
    getTotalTripsCount,
    getActiveTripsCount,
    getCompletedTripsCount,
    getOngoingTripsCount,
  };
};
