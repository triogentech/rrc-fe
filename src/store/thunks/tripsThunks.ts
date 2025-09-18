import { createAsyncThunk } from '@reduxjs/toolkit';
import { tripService } from '../api/services';
import { ApiErrorHandler } from '../api/utils';
import type { Trip, TripCreateRequest, TripUpdateRequest, PaginationParams } from '../api/types';
import {
  setLoading,
  setTrips,
  setCurrentTrip,
  addTrip,
  updateTrip,
  removeTrip,
  setError,
  clearError,
} from '../slices/tripsSlice';
import { logout } from '../slices/authSlice';

export const getTripsThunk = createAsyncThunk<
  void,
  PaginationParams & { search?: string } | undefined,
  { rejectValue: string }
>(
  'trips/getTrips',
  async (params, { dispatch, rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { isAuthenticated: boolean; token: string | null } };
      if (!state.auth.isAuthenticated || !state.auth.token) {
        console.log('Redux: User not authenticated, skipping trips fetch');
        dispatch(logout());
        return rejectWithValue('User not authenticated');
      }

      dispatch(setLoading(true));
      dispatch(clearError());

      console.log('Redux: Fetching trips with params:', params);

      const response = await tripService.getTrips(params);

      console.log('Redux: Trips response:', response);

      if (response.success && response.data) {
        // Pass the array directly since the slice now handles both formats
        dispatch(setTrips(response.data));
      } else {
        const errorMessage = 'Failed to fetch trips';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Get trips error:', errorMessage);
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        console.log('Redux: 403 error detected, logging out user');
        dispatch(logout());
      }
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const getTripThunk = createAsyncThunk<
  Trip,
  string,
  { rejectValue: string }
>(
  'trips/getTrip',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      const response = await tripService.getTrip(id);
      if (response.success && response.data) {
        dispatch(setCurrentTrip(response.data));
        return response.data;
      } else {
        const errorMessage = 'Failed to fetch trip';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const createTripThunk = createAsyncThunk<
  Trip,
  TripCreateRequest,
  { rejectValue: string }
>(
  'trips/createTrip',
  async (tripData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      const response = await tripService.createTrip(tripData);
      if (response.success && response.data) {
        dispatch(addTrip(response.data));
        return response.data;
      } else {
        const errorMessage = 'Failed to create trip';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const updateTripThunk = createAsyncThunk<
  Trip,
  { id: string; data: TripUpdateRequest },
  { rejectValue: string }
>(
  'trips/updateTrip',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      const response = await tripService.updateTrip(id, data);
      if (response.success && response.data) {
        dispatch(updateTrip(response.data));
        return response.data;
      } else {
        const errorMessage = 'Failed to update trip';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const deleteTripThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  'trips/deleteTrip',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      console.log('Redux: Deleting trip with ID:', id);

      const response = await tripService.deleteTrip(id);
      console.log('Redux: Delete trip response:', response);

      if (response.success) {
        console.log('Redux: Trip deleted successfully, removing from state');
        dispatch(removeTrip(id));
      } else {
        const errorMessage = 'Failed to delete trip';
        console.log('Redux: Delete failed:', errorMessage);
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Delete trip error:', errorMessage);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const searchTripsThunk = createAsyncThunk<
  void,
  { query: string; params?: PaginationParams },
  { rejectValue: string }
>(
  'trips/searchTrips',
  async ({ query, params }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      const response = await tripService.searchTrips(query, params);
      if (response.success && response.data) {
        dispatch(setTrips(response.data));
      } else {
        const errorMessage = 'Failed to search trips';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);
