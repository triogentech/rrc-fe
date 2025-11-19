import { createAsyncThunk } from '@reduxjs/toolkit';
import { vehicleService } from '../api/services';
import { ApiErrorHandler } from '../api/utils';
import type { Vehicle, VehicleCreateRequest, VehicleUpdateRequest, PaginationParams, StrapiResponse } from '../api/types';
import {
  setLoading,
  setVehicles,
  setCurrentVehicle,
  addVehicle,
  updateVehicle,
  removeVehicle,
  setError,
  clearError,
} from '../slices/vehiclesSlice';
import { logout } from '../slices/authSlice';

// Get vehicles thunk
export const getVehiclesThunk = createAsyncThunk<
  void,
  PaginationParams & { active?: boolean; currentStatus?: string; type?: string; search?: string } | undefined,
  { rejectValue: string }
>(
  'vehicles/getVehicles',
  async (params, { dispatch, rejectWithValue, getState }) => {
    try {
      // Check if user is authenticated before making API call
      const state = getState() as { auth: { isAuthenticated: boolean; token: string | null } };
      if (!state.auth.isAuthenticated || !state.auth.token) {
        console.log('Redux: User not authenticated, skipping vehicles fetch');
        dispatch(logout());
        return rejectWithValue('User not authenticated');
      }

      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Fetching vehicles with params:', params);
      
      const response = await vehicleService.getVehicles(params);
      
      console.log('Redux: Vehicles response:', response);
      
      if (response.success && response.data) {
        // Handle both cases: response.data could be array or StrapiResponse object
        let strapiResponse: StrapiResponse<Vehicle>;
        
        // Type assertion to access meta property
        const responseWithMeta = response as typeof response & { meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } } };
        
        if (Array.isArray(response.data)) {
          // response.data is an array, construct StrapiResponse from response.meta
          // Ensure pagination is always defined
          const pagination = responseWithMeta.meta?.pagination || {
            page: 1,
            pageSize: 25,
            pageCount: 1,
            total: response.data.length,
          };
          
          strapiResponse = {
            data: response.data,
            meta: {
              pagination: pagination,
            },
          };
        } else if (response.data && typeof response.data === 'object' && 'data' in response.data && 'meta' in response.data) {
          // response.data is already a StrapiResponse object
          strapiResponse = response.data as StrapiResponse<Vehicle>;
        } else {
          // Fallback: create empty response
          strapiResponse = {
            data: [],
            meta: {
              pagination: {
                page: 1,
                pageSize: 25,
                pageCount: 1,
                total: 0,
              },
            },
          };
        }
        
        console.log('Redux: Constructed StrapiResponse:', strapiResponse);
        dispatch(setVehicles(strapiResponse));
      } else {
        const errorMessage = 'Failed to fetch vehicles';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Get vehicles error:', errorMessage);
      
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

// Get vehicle by ID thunk
export const getVehicleThunk = createAsyncThunk<
  Vehicle,
  string,
  { rejectValue: string }
>(
  'vehicles/getVehicle',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Fetching vehicle with ID:', id);
      
      const response = await vehicleService.getVehicle(id);
      
      if (response.success && response.data) {
        dispatch(setCurrentVehicle(response.data));
        return response.data;
      } else {
        const errorMessage = 'Failed to fetch vehicle';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Get vehicle error:', errorMessage);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Create vehicle thunk
export const createVehicleThunk = createAsyncThunk<
  Vehicle,
  VehicleCreateRequest,
  { rejectValue: string }
>(
  'vehicles/createVehicle',
  async (vehicleData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Creating vehicle:', vehicleData);
      
      const response = await vehicleService.createVehicle(vehicleData);
      
      if (response.success && response.data) {
        dispatch(addVehicle(response.data));
        return response.data;
      } else {
        const errorMessage = 'Failed to create vehicle';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Create vehicle error:', error);
      console.error('Redux: Create vehicle error message:', errorMessage);
      
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

// Update vehicle thunk
export const updateVehicleThunk = createAsyncThunk<
  Vehicle,
  { id: string; data: VehicleUpdateRequest },
  { rejectValue: string }
>(
  'vehicles/updateVehicle',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Updating vehicle:', { id, data });
      
      const response = await vehicleService.updateVehicle(id, data);
      
      if (response.success && response.data) {
        dispatch(updateVehicle(response.data));
        return response.data;
      } else {
        const errorMessage = 'Failed to update vehicle';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Update vehicle error:', errorMessage);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Delete vehicle thunk
export const deleteVehicleThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  'vehicles/deleteVehicle',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Deleting vehicle with ID:', id);
      
      const response = await vehicleService.deleteVehicle(id);
      console.log('Redux: Delete vehicle response:', response);
      
      if (response.success) {
        console.log('Redux: Vehicle deleted successfully, removing from state');
        dispatch(removeVehicle(id));
      } else {
        const errorMessage = 'Failed to delete vehicle';
        console.log('Redux: Delete failed:', errorMessage);
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Delete vehicle error:', errorMessage);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Toggle vehicle status thunk
export const toggleVehicleStatusThunk = createAsyncThunk<
  Vehicle,
  string,
  { rejectValue: string }
>(
  'vehicles/toggleVehicleStatus',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Toggling vehicle status for ID:', id);
      
      const response = await vehicleService.toggleVehicleStatus(id);
      
      if (response.success && response.data) {
        dispatch(updateVehicle(response.data));
        return response.data;
      } else {
        const errorMessage = 'Failed to toggle vehicle status';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Toggle vehicle status error:', errorMessage);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Search vehicles thunk
export const searchVehiclesThunk = createAsyncThunk<
  void,
  { query: string; params?: PaginationParams },
  { rejectValue: string }
>(
  'vehicles/searchVehicles',
  async ({ query, params }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Searching vehicles with query:', query);
      
      const response = await vehicleService.searchVehicles(query, params);
      
      if (response.success && response.data) {
        dispatch(setVehicles(response.data));
      } else {
        const errorMessage = 'Failed to search vehicles';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Search vehicles error:', errorMessage);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);
