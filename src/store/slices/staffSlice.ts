import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Staff, StrapiResponse } from '../api/types';

export interface StaffState {
  staff: Staff[];
  currentStaff: Staff | null;
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
  };
}

const initialState: StaffState = {
  staff: [],
  currentStaff: null,
  isLoading: false,
  error: null,
  pagination: null,
  filters: {
    search: '',
  },
};

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setStaff: (state, action: PayloadAction<StrapiResponse<Staff> | Staff[]>) => {
      // Handle both Strapi response format and simple array format
      if (Array.isArray(action.payload)) {
        // Simple array format
        state.staff = action.payload;
        state.pagination = {
          page: 1,
          pageSize: action.payload.length,
          pageCount: 1,
          total: action.payload.length,
        };
      } else {
        // Strapi response format
        state.staff = action.payload.data;
        state.pagination = {
          page: action.payload.meta.pagination.page,
          pageSize: action.payload.meta.pagination.pageSize,
          pageCount: action.payload.meta.pagination.pageCount,
          total: action.payload.meta.pagination.total,
        };
      }
      state.error = null;
    },
    setCurrentStaff: (state, action: PayloadAction<Staff | null>) => {
      state.currentStaff = action.payload;
    },
    addStaff: (state, action: PayloadAction<Staff>) => {
      state.staff.unshift(action.payload);
      if (state.pagination) {
        state.pagination.total += 1;
      }
    },
    updateStaff: (state, action: PayloadAction<Staff>) => {
      const index = state.staff.findIndex(staff => staff.id === action.payload.id);
      if (index !== -1) {
        state.staff[index] = action.payload;
      }
      if (state.currentStaff?.id === action.payload.id) {
        state.currentStaff = action.payload;
      }
    },
    removeStaff: (state, action: PayloadAction<string>) => {
      console.log('Redux: Removing staff with documentId:', action.payload);
      console.log('Redux: Staff before removal:', state.staff.length);
      state.staff = state.staff.filter(staff => staff.documentId !== action.payload);
      console.log('Redux: Staff after removal:', state.staff.length);
      if (state.currentStaff?.documentId === action.payload) {
        state.currentStaff = null;
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
    setFilters: (state, action: PayloadAction<Partial<StaffState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
      };
    },
    resetStaffState: () => {
      return initialState;
    },
  },
});

export const {
  setLoading,
  setStaff,
  setCurrentStaff,
  addStaff,
  updateStaff,
  removeStaff,
  setError,
  clearError,
  setFilters,
  clearFilters,
  resetStaffState,
} = staffSlice.actions;

export const selectStaff = (state: { staff: StaffState }) => state.staff;
export const selectCurrentStaff = (state: { staff: StaffState }) => state.staff.currentStaff;
export const selectStaffLoading = (state: { staff: StaffState }) => state.staff.isLoading;
export const selectStaffError = (state: { staff: StaffState }) => state.staff.error;
export const selectStaffPagination = (state: { staff: StaffState }) => state.staff.pagination;
export const selectStaffFilters = (state: { staff: StaffState }) => state.staff.filters;

export default staffSlice.reducer;
