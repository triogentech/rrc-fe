import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import driversReducer from './slices/driversSlice';
import vehiclesReducer from './slices/vehiclesSlice';
import vehiclesInUseReducer from './slices/vehiclesInUseSlice';
import staffReducer from './slices/staffSlice';
import tripsReducer from './slices/tripsSlice';
import userReducer from './slices/userSlice';

// Configure the store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    drivers: driversReducer,
    vehicles: vehiclesReducer,
    vehiclesInUse: vehiclesInUseReducer,
    staff: staffReducer,
    trips: tripsReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization check
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.lastLoginTime'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Export store instance
export default store;
