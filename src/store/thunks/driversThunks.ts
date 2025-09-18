import { createAsyncThunk } from '@reduxjs/toolkit';
import { driverService } from '../api/services';
import { ApiErrorHandler } from '../api/utils';
import type { Driver, DriverCreateRequest, DriverUpdateRequest, PaginationParams } from '../api/types';
import {
  setLoading,
  setDrivers,
  setCurrentDriver,
  addDriver,
  updateDriver,
  removeDriver,
  setError,
  clearError,
} from '../slices/driversSlice';
import { logout } from '../slices/authSlice';

// Get drivers thunk
export const getDriversThunk = createAsyncThunk<
  void,
  PaginationParams & { isActive?: boolean; search?: string } | undefined,
  { rejectValue: string }
>(
  'drivers/getDrivers',
  async (params, { dispatch, rejectWithValue, getState }) => {
    try {
      // Check if user is authenticated before making API call
      const state = getState() as { auth: { isAuthenticated: boolean; token: string | null } };
      if (!state.auth.isAuthenticated || !state.auth.token) {
        console.log('Redux: User not authenticated, skipping drivers fetch');
        dispatch(logout());
        return rejectWithValue('User not authenticated');
      }

      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Fetching drivers with params:', params);
      
      const response = await driverService.getDrivers(params);
      
      console.log('Redux: Drivers response:', response);
      
      if (response.success && response.data) {
        // Pass the array directly since the slice now handles both formats
        dispatch(setDrivers(response.data));
      } else {
        const errorMessage = 'Failed to fetch drivers';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Get drivers error:', errorMessage);
      
      // If it's a 403 error, logout the user
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

// Get driver by ID thunk
export const getDriverThunk = createAsyncThunk<
  Driver,
  string,
  { rejectValue: string }
>(
  'drivers/getDriver',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Fetching driver with ID:', id);
      
      const response = await driverService.getDriver(id);
      
      if (response.success && response.data) {
        dispatch(setCurrentDriver(response.data));
        return response.data;
      } else {
        const errorMessage = 'Failed to fetch driver';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Get driver error:', errorMessage);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Create driver thunk
export const createDriverThunk = createAsyncThunk<
  Driver,
  DriverCreateRequest,
  { rejectValue: string }
>(
  'drivers/createDriver',
  async (driverData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Creating driver:', driverData);
      
      const response = await driverService.createDriver(driverData);
      
      if (response.success && response.data) {
        dispatch(addDriver(response.data));
        return response.data;
      } else {
        const errorMessage = 'Failed to create driver';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Create driver error:', error);
      console.error('Redux: Create driver error message:', errorMessage);
      
      // Log the full error for debugging
      if (error && typeof error === 'object' && 'status' in error) {
        console.error('Redux: API Error Status:', error.status);
        console.error('Redux: API Error Details:', error);
      }
      
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Update driver thunk
export const updateDriverThunk = createAsyncThunk<
  Driver,
  { id: string; data: DriverUpdateRequest },
  { rejectValue: string }
>(
  'drivers/updateDriver',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Updating driver:', { id, data });
      
      const response = await driverService.updateDriver(id, data);
      
      if (response.success && response.data) {
        dispatch(updateDriver(response.data));
        return response.data;
      } else {
        const errorMessage = 'Failed to update driver';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Update driver error:', errorMessage);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Delete driver thunk
export const deleteDriverThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  'drivers/deleteDriver',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Deleting driver with ID:', id);
      
      const response = await driverService.deleteDriver(id);
      console.log('Redux: Delete driver response:', response);
      
      if (response.success) {
        console.log('Redux: Driver deleted successfully, removing from state');
        dispatch(removeDriver(id));
      } else {
        const errorMessage = 'Failed to delete driver';
        console.log('Redux: Delete failed:', errorMessage);
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Delete driver error:', errorMessage);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Toggle driver status thunk
export const toggleDriverStatusThunk = createAsyncThunk<
  Driver,
  string,
  { rejectValue: string }
>(
  'drivers/toggleDriverStatus',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Toggling driver status for ID:', id);
      
      const response = await driverService.updateDriver(id, { isActive: undefined });
      
      if (response.success && response.data) {
        dispatch(updateDriver(response.data));
        return response.data;
      } else {
        const errorMessage = 'Failed to toggle driver status';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Toggle driver status error:', errorMessage);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Search drivers thunk
export const searchDriversThunk = createAsyncThunk<
  void,
  { query: string; params?: PaginationParams },
  { rejectValue: string }
>(
  'drivers/searchDrivers',
  async ({ query, params }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Searching drivers with query:', query);
      
      const response = await driverService.searchDrivers(query, params);
      
      if (response.success && response.data) {
        dispatch(setDrivers(response.data));
      } else {
        const errorMessage = 'Failed to search drivers';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Search drivers error:', errorMessage);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);
