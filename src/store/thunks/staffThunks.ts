import { createAsyncThunk } from '@reduxjs/toolkit';
import { staffService } from '../api/services';
import { ApiErrorHandler } from '../api/utils';
import type { Staff, StaffCreateRequest, StaffUpdateRequest, PaginationParams } from '../api/types';
import {
  setLoading,
  setStaff,
  setCurrentStaff,
  addStaff,
  updateStaff,
  removeStaff,
  setError,
  clearError,
} from '../slices/staffSlice';
import { logout } from '../slices/authSlice';

export const getStaffThunk = createAsyncThunk<
  void,
  PaginationParams & { search?: string } | undefined,
  { rejectValue: string }
>(
  'staff/getStaff',
  async (params, { dispatch, rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: { isAuthenticated: boolean; token: string | null } };
      if (!state.auth.isAuthenticated || !state.auth.token) {
        console.log('Redux: User not authenticated, skipping staff fetch');
        dispatch(logout());
        return rejectWithValue('User not authenticated');
      }

      dispatch(setLoading(true));
      dispatch(clearError());

      console.log('Redux: Fetching staff with params:', params);

      const response = await staffService.getStaff(params);

      console.log('Redux: Staff response:', response);

      if (response.success && response.data) {
        // Pass the array directly since the slice now handles both formats
        dispatch(setStaff(response.data));
      } else {
        const errorMessage = 'Failed to fetch staff';
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Get staff error:', errorMessage);
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

export const getStaffMemberThunk = createAsyncThunk<
  Staff,
  string,
  { rejectValue: string }
>(
  'staff/getStaffMember',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      const response = await staffService.getStaffMember(id);
      if (response.success && response.data) {
        dispatch(setCurrentStaff(response.data));
        return response.data;
      } else {
        const errorMessage = 'Failed to fetch staff member';
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

export const createStaffThunk = createAsyncThunk<
  Staff,
  StaffCreateRequest,
  { rejectValue: string }
>(
  'staff/createStaff',
  async (staffData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      const response = await staffService.createStaff(staffData);
      if (response.success && response.data) {
        dispatch(addStaff(response.data));
        return response.data;
      } else {
        const errorMessage = 'Failed to create staff member';
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

export const updateStaffThunk = createAsyncThunk<
  Staff,
  { id: string; data: StaffUpdateRequest },
  { rejectValue: string }
>(
  'staff/updateStaff',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      const response = await staffService.updateStaff(id, data);
      if (response.success && response.data) {
        dispatch(updateStaff(response.data));
        return response.data;
      } else {
        const errorMessage = 'Failed to update staff member';
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

export const deleteStaffThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  'staff/deleteStaff',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Redux: Deleting staff with ID:', id);
      
      const response = await staffService.deleteStaff(id);
      console.log('Redux: Delete staff response:', response);
      
      if (response.success) {
        console.log('Redux: Staff deleted successfully, removing from state');
        dispatch(removeStaff(id));
      } else {
        const errorMessage = 'Failed to delete staff member';
        console.log('Redux: Delete failed:', errorMessage);
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error);
      console.error('Redux: Delete staff error:', errorMessage);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const searchStaffThunk = createAsyncThunk<
  void,
  { query: string; params?: PaginationParams },
  { rejectValue: string }
>(
  'staff/searchStaff',
  async ({ query, params }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      const response = await staffService.searchStaff(query, params);
      if (response.success && response.data) {
        dispatch(setStaff(response.data));
      } else {
        const errorMessage = 'Failed to search staff';
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
