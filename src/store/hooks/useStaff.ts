import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectStaff,
  selectCurrentStaff,
  selectStaffLoading,
  selectStaffError,
  selectStaffPagination,
  selectStaffFilters,
  setFilters,
  clearFilters,
  clearError,
} from '../slices/staffSlice';
import { selectIsAuthenticated } from '../slices/authSlice';
import {
  getStaffThunk,
  getStaffMemberThunk,
  createStaffThunk,
  updateStaffThunk,
  deleteStaffThunk,
  searchStaffThunk,
} from '../thunks/staffThunks';
import type { Staff, StaffCreateRequest, StaffUpdateRequest, PaginationParams } from '../api/types';

export const useStaff = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const staff = useAppSelector(selectStaff);
  const currentStaff = useAppSelector(selectCurrentStaff);
  const isLoading = useAppSelector(selectStaffLoading);
  const error = useAppSelector(selectStaffError);
  const pagination = useAppSelector(selectStaffPagination);
  const filters = useAppSelector(selectStaffFilters);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Actions
  const getStaff = useCallback(async (params?: PaginationParams & { search?: string }) => {
    return dispatch(getStaffThunk(params));
  }, [dispatch]);

  const getStaffMember = useCallback(async (id: string): Promise<Staff | null> => {
    try {
      const result = await dispatch(getStaffMemberThunk(id)).unwrap();
      return result;
    } catch (error) {
      console.error('Failed to get staff member:', error);
      return null;
    }
  }, [dispatch]);

  const createStaff = useCallback(async (staffData: StaffCreateRequest): Promise<Staff | null> => {
    try {
      const result = await dispatch(createStaffThunk(staffData)).unwrap();
      return result;
    } catch (error) {
      console.error('Failed to create staff member:', error);
      return null;
    }
  }, [dispatch]);

  const updateStaff = useCallback(async (id: string, data: StaffUpdateRequest): Promise<Staff | null> => {
    try {
      const result = await dispatch(updateStaffThunk({ id, data })).unwrap();
      return result;
    } catch (error) {
      console.error('Failed to update staff member:', error);
      return null;
    }
  }, [dispatch]);

  const deleteStaff = useCallback(async (id: string): Promise<boolean> => {
    try {
      await dispatch(deleteStaffThunk(id)).unwrap();
      return true;
    } catch (error) {
      console.error('Failed to delete staff member:', error);
      return false;
    }
  }, [dispatch]);

  const searchStaff = useCallback(async (query: string, params?: PaginationParams) => {
    return dispatch(searchStaffThunk({ query, params }));
  }, [dispatch]);

  const setStaffFilters = useCallback((newFilters: Partial<typeof filters>) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  const clearStaffFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const clearStaffError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Utility functions
  const getStaffDisplayName = useCallback((staff: Staff): string => {
    return staff.fullName || 'Unknown Staff';
  }, []);

  const getStaffContactInfo = useCallback((staffMember: Staff): string => {
    return `${staffMember.countryDialCode} ${staffMember.contactNumber}`;
  }, []);

  const getStaffEmergencyContact = useCallback((staffMember: Staff): string => {
    // Parameter required by interface but not used in implementation
    void staffMember;
    return 'N/A'; // Staff doesn't have emergency contact in the current API
  }, []);

  const isStaffActive = useCallback((staffMember: Staff): boolean => {
    // Parameter required by interface but not used in implementation
    void staffMember;
    return true; // All staff are considered active in the current API
  }, []);

  // Count functions
  const getTotalStaffCount = useCallback((): number => {
    return staff.staff.length;
  }, [staff]);

  const getActiveStaffCount = useCallback((): number => {
    return staff.staff.filter((staffMember: Staff) => isStaffActive(staffMember)).length;
  }, [staff, isStaffActive]);

  const getInactiveStaffCount = useCallback((): number => {
    return staff.staff.filter((staffMember: Staff) => !isStaffActive(staffMember)).length;
  }, [staff, isStaffActive]);

  return {
    // State
    staff,
    currentStaff,
    isLoading,
    error,
    pagination,
    filters,
    isAuthenticated,

    // Actions
    getStaff,
    getStaffMember,
    createStaff,
    updateStaff,
    deleteStaff,
    searchStaff,
    setStaffFilters,
    clearStaffFilters,
    clearStaffError,

    // Utility functions
    getStaffDisplayName,
    getStaffContactInfo,
    getStaffEmergencyContact,
    isStaffActive,

    // Count functions
    getTotalStaffCount,
    getActiveStaffCount,
    getInactiveStaffCount,
  };
};
