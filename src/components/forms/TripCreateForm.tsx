"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useTrips } from '@/store/hooks/useTrips';
import { useDrivers } from '@/store/hooks/useDrivers';
import { useVehicles } from '@/store/hooks/useVehicles';
import { useReduxAuth } from '@/store/hooks/useReduxAuth';
import { loadProviderService } from '@/store/api/services';
import type { TripCreateRequest, Trip, Vehicle, Driver } from '@/store/api/types';
import { TripStatus, VehicleCurrentStatus } from '@/store/api/types';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/utils/toastHelper';

interface LoadProvider {
  id: number;
  documentId: string;
  name: string;
  shortName?: string;
  isActive: boolean;
}

interface TripCreateFormProps {
  onSuccess: (trip: Trip) => void;
  onCancel: () => void;
}

export default function TripCreateForm({ onSuccess, onCancel }: TripCreateFormProps) {
  const { createTrip, isLoading, error: apiError, clearTripsError } = useTrips();
  const { drivers, getDrivers, isLoading: driversLoading } = useDrivers();
  const { vehicles, getVehicles, isLoading: vehiclesLoading, updateVehicle, pagination } = useVehicles();
  const { user } = useReduxAuth();

  const [formData, setFormData] = useState<TripCreateRequest & { loadProvider?: string }>({
    tripNumber: '',
    estimatedStartTime: '',
    estimatedEndTime: '',
    startPoint: '',
    endPoint: '',
    totalTripDistanceInKM: 0,
    currentStatus: 'created' as TripStatus,
    driver: undefined,
    vehicle: undefined,
    loadProvider: undefined,
    // New fields
    freightTotalAmount: 0,
    advanceAmount: 0,
    totalTripTimeInMinutes: 0,
    isTouchingLocationAvailable: false,
    touchingLocations: [],
    // Custom fields
    cstmCreatedBy: user?.documentId || user?.id || '',
    cstmUpdatedBy: user?.documentId || user?.id || '',
  });

  // Add state for totalTripTimeInHours (UI field)
  const [totalTripTimeInHours, setTotalTripTimeInHours] = useState<number>(0);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadProviders, setLoadProviders] = useState<LoadProvider[]>([]);
  const [isLoadingLoadProviders, setIsLoadingLoadProviders] = useState(false);

  // Calculate estimatedEndTime and totalTripTimeInMinutes when totalTripTimeInHours or estimatedStartTime changes
  useEffect(() => {
    if (totalTripTimeInHours > 0 && formData.estimatedStartTime) {
      const startTime = new Date(formData.estimatedStartTime);
      const endTime = new Date(startTime.getTime() + (totalTripTimeInHours * 60 * 60 * 1000));
      
      setFormData(prev => ({
        ...prev,
        estimatedEndTime: endTime.toISOString().slice(0, 16), // Format for datetime-local input
        totalTripTimeInMinutes: totalTripTimeInHours * 60
      }));
    }
  }, [totalTripTimeInHours, formData.estimatedStartTime]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [driversInUse, setDriversInUse] = useState<Set<string>>(new Set());
  const [driversFetched, setDriversFetched] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  
  // Vehicle dropdown search state
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  
  // Vehicle infinite scroll state
  const [vehiclePageSize, setVehiclePageSize] = useState(10);
  const [isLoadingMoreVehicles, setIsLoadingMoreVehicles] = useState(false);
  const [hasMoreVehicles, setHasMoreVehicles] = useState(true);
  
  // Vehicle status update loading state
  const [isUpdatingVehicleStatus, setIsUpdatingVehicleStatus] = useState(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        isVehicleDropdownOpen &&
        !target.closest('#vehicleDropdown') &&
        !target.closest('#vehicleDropdownButton')
      ) {
        setIsVehicleDropdownOpen(false);
        setVehicleSearchQuery('');
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVehicleDropdownOpen) {
        setIsVehicleDropdownOpen(false);
        setVehicleSearchQuery('');
      }
    };

    if (isVehicleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVehicleDropdownOpen]);

  // Fetch load providers
  const fetchLoadProviders = useCallback(async () => {
    setIsLoadingLoadProviders(true);
    try {
      const response = await loadProviderService.getLoadProviders({ page: 1, limit: 100 });
      const providers = Array.isArray(response.data) ? response.data : [];
      // Filter only active load providers
      const activeProviders = providers.filter((provider: LoadProvider) => provider.isActive);
      setLoadProviders(activeProviders);
    } catch (error) {
      console.error('Error fetching load providers:', error);
    } finally {
      setIsLoadingLoadProviders(false);
    }
  }, []);

  // Fetch data automatically when form opens in sequence: vehicles → load providers → drivers
  useEffect(() => {
    if (initialFetchDone) return; // Only run once
    
    const fetchDataInSequence = async () => {
      try {
        setInitialFetchDone(true);
        
        // 1. Fetch vehicles first - only idle and active vehicles for trip creation
        // Start with pageSize 10, will load more via infinite scroll
        await getVehicles({
          page: 1,
          limit: 10,
          currentStatus: 'idle',
          active: true,
        });
        
        // 2. Then fetch load providers
        await fetchLoadProviders();
        
        // 3. Finally fetch drivers
        setDriversFetched(true);
        await getDrivers();
      } catch (error) {
        console.error('Error fetching data:', error);
        // Reset flag on error so it can retry
        setInitialFetchDone(false);
        setDriversFetched(false);
      }
    };

    fetchDataInSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Handler to fetch drivers when dropdown is opened (fallback if not fetched automatically)
  const handleDriverDropdownFocus = useCallback(async () => {
    if (!driversFetched && !driversLoading) {
      setDriversFetched(true);
      try {
        await getDrivers();
      } catch (error) {
        console.error('Error fetching drivers:', error);
        setDriversFetched(false); // Reset on error so it can retry
      }
    }
  }, [driversFetched, driversLoading, getDrivers]);

  // Process vehicles when they change
  // Note: Server-side filtering already handles idle status and active vehicles,
  // but we keep client-side filtering as a safety check
  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      // Filter vehicles to only show active ones with "idle" status
      // Server-side filtering should already handle this, but we do it client-side too as a safety check
      const filteredVehicles = vehicles.filter((vehicle: Vehicle) => 
        vehicle.isActive !== false && 
        vehicle.currentStatus === 'idle'
      );
      
      // If we're loading more, append to existing vehicles, otherwise replace
      if (isLoadingMoreVehicles) {
        setAvailableVehicles(prev => {
          // Avoid duplicates
          const existingIds = new Set(prev.map(v => v.documentId));
          const newVehicles = filteredVehicles.filter(v => !existingIds.has(v.documentId));
          const updated = [...prev, ...newVehicles];
          
          // Check if there are more vehicles to load
          if (pagination) {
            setHasMoreVehicles(updated.length < pagination.total);
          }
          
          return updated;
        });
        setIsLoadingMoreVehicles(false);
      } else {
        setAvailableVehicles(filteredVehicles);
        
        // Check if there are more vehicles to load
        if (pagination) {
          setHasMoreVehicles(filteredVehicles.length < pagination.total);
        }
      }
    } else if (vehicles && vehicles.length === 0 && !isLoadingMoreVehicles) {
      // Clear available vehicles if no vehicles returned (but not when loading more)
      setAvailableVehicles([]);
      setHasMoreVehicles(false);
    }
  }, [vehicles, pagination, isLoadingMoreVehicles]);

  // Reset pageSize when dropdown closes or search changes
  useEffect(() => {
    if (!isVehicleDropdownOpen) {
      setVehiclePageSize(10);
      setHasMoreVehicles(true);
      setIsLoadingMoreVehicles(false);
    }
  }, [isVehicleDropdownOpen, vehicleSearchQuery]);

  // Fetch vehicles when dropdown opens (same pattern as vehicles page)
  useEffect(() => {
    if (!isVehicleDropdownOpen) {
      return;
    }

    // Fetch vehicles when dropdown opens - start with pageSize 10
    const fetchVehiclesOnOpen = async () => {
      try {
        // Reset to initial state
        setVehiclePageSize(10);
        setHasMoreVehicles(true);
        
        // Use the same API pattern as vehicles page: getVehicles({ page: 1, limit: 10 })
        // Add currentStatus and active filters for trip creation context
        await getVehicles({
          page: 1,
          limit: 10, // Start with 10 vehicles
          currentStatus: 'idle', // Only get idle vehicles (required for trip creation)
          active: true, // Only get active vehicles (required for trip creation)
        });
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };

    // Fetch immediately when dropdown opens
    fetchVehiclesOnOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVehicleDropdownOpen]);

  // Reset search query when dropdown closes
  useEffect(() => {
    if (!isVehicleDropdownOpen && vehicleSearchQuery) {
      setVehicleSearchQuery('');
    }
  }, [isVehicleDropdownOpen, vehicleSearchQuery]);

  // Debounced search for vehicles using server-side API (same as vehicles page)
  useEffect(() => {
    if (!isVehicleDropdownOpen || !vehicleSearchQuery.trim()) {
      return;
    }

    const searchVehicles = async () => {
      try {
        // Reset pageSize when searching
        setVehiclePageSize(10);
        setHasMoreVehicles(true);
        
        // Use the same search API pattern as vehicles page
        // The vehicles page calls: getVehicles({ search: searchQuery.trim(), page: 1, limit: 25 })
        // We add currentStatus and active filters for trip creation context
        const searchParams: { 
          page?: number; 
          limit?: number; 
          search?: string;
          currentStatus?: string;
          active?: boolean;
        } = {
          page: 1,
          limit: 10, // Start with 10 vehicles for search too
          currentStatus: 'idle', // Only get idle vehicles (required for trip creation)
          active: true, // Only get active vehicles (required for trip creation)
          search: vehicleSearchQuery.trim(), // Use the same search parameter format as vehicles page
        };

        // Call with the same pattern as vehicles page: getVehicles({ search, page, limit, ... })
        // This will use the same $or and $containsi filters in the service
        await getVehicles(searchParams);
      } catch (error) {
        console.error('Error searching vehicles:', error);
      }
    };

    // Debounce search to avoid too many API calls (same as vehicles page pattern)
    const timeoutId = setTimeout(() => {
      searchVehicles();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [vehicleSearchQuery, isVehicleDropdownOpen, getVehicles]);

  // Load more vehicles when scrolling (infinite scroll)
  const loadMoreVehicles = useCallback(async () => {
    if (isLoadingMoreVehicles || !hasMoreVehicles || vehiclesLoading) {
      return;
    }

    setIsLoadingMoreVehicles(true);
    const newPageSize = vehiclePageSize + 5; // Increase by 5
    setVehiclePageSize(newPageSize);

    try {
      const searchParams: { 
        page?: number; 
        limit?: number; 
        search?: string;
        currentStatus?: string;
        active?: boolean;
      } = {
        page: 1,
        limit: newPageSize,
        currentStatus: 'idle',
        active: true,
      };

      if (vehicleSearchQuery.trim()) {
        searchParams.search = vehicleSearchQuery.trim();
      }

      await getVehicles(searchParams);
    } catch (error) {
      console.error('Error loading more vehicles:', error);
      setIsLoadingMoreVehicles(false);
    }
  }, [vehiclePageSize, hasMoreVehicles, isLoadingMoreVehicles, vehiclesLoading, vehicleSearchQuery, getVehicles]);

  // Process drivers when they change
  useEffect(() => {
    if (drivers && drivers.length > 0) {
      // Filter drivers to only show active ones (isActive !== false)
      const activeDrivers = drivers.filter((driver: Driver) => driver.isActive !== false);
      
      // Check which drivers are currently in use by looking at their trips
      const driversInUseSet = new Set<string>();
      
      activeDrivers.forEach((driver: Driver) => {
        if (driver.trips && Array.isArray(driver.trips)) {
          // Check if driver has any active trips (created or in-transit)
          const hasActiveTrips = driver.trips.some((trip: Trip) => 
            trip.currentStatus === 'created' || trip.currentStatus === 'in-transit'
          );
          
          if (hasActiveTrips) {
            driversInUseSet.add(driver.documentId);
          }
        }
      });
      
      setAvailableDrivers(activeDrivers);
      setDriversInUse(driversInUseSet);
    }
  }, [drivers]);

  const handleInputChange = (field: keyof (TripCreateRequest & { loadProvider?: string }), value: string | number | boolean | null | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (apiError) {
      clearTripsError();
    }
  };

  // Handler for touching locations
  const addTouchingLocation = () => {
    setFormData(prev => ({
      ...prev,
      touchingLocations: [...(prev.touchingLocations || []), { name: '' }]
    }));
  };

  const removeTouchingLocation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      touchingLocations: (prev.touchingLocations || []).filter((_, i) => i !== index)
    }));
  };

  const updateTouchingLocation = (index: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      touchingLocations: (prev.touchingLocations || []).map((loc, i) => 
        i === index ? { ...loc, name } : loc
      )
    }));
  };

  // Check if driver is available for real-time validation
  const checkAvailability = (field: 'driver' | 'vehicle', value: string | null) => {
    if (!value) return;
    
    if (field === 'driver' && driversInUse.has(value)) {
      setErrors(prev => ({ 
        ...prev, 
        driver: 'Selected driver is currently on another trip' 
      }));
    } else {
      // Clear the error if the selection is valid
      // Note: Vehicles are already filtered by status, so no need to check vehiclesInUse
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.tripNumber.trim()) {
      newErrors.tripNumber = 'Trip Number is required';
    }
    
    if (!formData.estimatedStartTime) {
      newErrors.estimatedStartTime = 'Estimated Start Time is required';
    }
    
    if (!formData.startPoint.trim()) {
      newErrors.startPoint = 'Start Point is required';
    }
    
    if (!formData.endPoint.trim()) {
      newErrors.endPoint = 'End Point is required';
    }
    
    if (formData.totalTripDistanceInKM <= 0) {
      newErrors.totalTripDistanceInKM = 'Total Trip Distance must be greater than 0';
    }
    
    // if (!formData.driver) {
    //   newErrors.driver = 'Driver is required';
    // }
    
    if (!formData.vehicle) {
      newErrors.vehicle = 'Vehicle is required';
    }
    
    // New mandatory field validations
    if (totalTripTimeInHours <= 0) {
      newErrors.totalTripTimeInHours = 'Total Trip Time in Hours is required and must be greater than 0';
    }
    
    if (!formData.freightTotalAmount || formData.freightTotalAmount <= 0) {
      newErrors.freightTotalAmount = 'Freight Total Amount is required and must be greater than 0';
    }
    
    if (formData.advanceAmount === undefined || formData.advanceAmount === null || formData.advanceAmount < 0) {
      newErrors.advanceAmount = 'Advance Amount is required and must be 0 or greater';
    }
    
    // Check if selected driver is currently in use
    if (formData.driver && driversInUse.has(formData.driver)) {
      newErrors.driver = 'Selected driver is currently on another trip';
    }
    
    // Note: Vehicles are already filtered by currentStatus === 'idle', so they should be available
    
    // Validate touching locations if enabled
    if (formData.isTouchingLocationAvailable) {
      if (!formData.touchingLocations || formData.touchingLocations.length === 0) {
        newErrors.touchingLocations = 'Please add at least one touching location';
      } else {
        // Check if all touching locations have names
        const hasEmptyLocations = formData.touchingLocations.some(loc => !loc.name || loc.name.trim() === '');
        if (hasEmptyLocations) {
          newErrors.touchingLocations = 'All touching locations must have a name';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to update vehicle status with retry logic (non-blocking)
  // This runs completely in the background and won't block the trip creation
  const updateVehicleStatusWithRetry = (
    vehicleId: string,
    maxRetries: number = 2,
    timeoutMs: number = 5000
  ): void => {
    // Set loading state
    setIsUpdatingVehicleStatus(true);
    
    // Run in background without blocking - use setTimeout to ensure it's truly async
    setTimeout(async () => {
      let lastError: unknown = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempting to update vehicle status (attempt ${attempt}/${maxRetries}) for vehicle: ${vehicleId}`);
          
          // Use Promise.race to add a shorter timeout
          const updatePromise = updateVehicle(vehicleId, {
            currentStatus: VehicleCurrentStatus.ASSIGNED,
          });
          
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Vehicle update timeout after ${timeoutMs}ms`)), timeoutMs);
          });
          
          const result = await Promise.race([updatePromise, timeoutPromise]);
          
          // Check if update was successful (updateVehicle returns Vehicle | null)
          if (result) {
            console.log('Vehicle status updated to assigned successfully');
            setIsUpdatingVehicleStatus(false);
            return; // Success, exit retry loop
          } else {
            throw new Error('Vehicle update returned null');
          }
        } catch (error) {
          lastError = error;
          console.error(`Error updating vehicle status (attempt ${attempt}/${maxRetries}):`, error);
          
          // If this is not the last attempt, wait before retrying with shorter delay
          if (attempt < maxRetries) {
            const delay = 1000 * attempt; // Linear backoff: 1s, 2s
            console.log(`Retrying vehicle status update in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // If all retries failed, log the error but don't throw
      console.error('Failed to update vehicle status after all retries:', lastError);
      setIsUpdatingVehicleStatus(false);
      showWarningToast('Trip created but failed to update vehicle status. Please update it manually.');
    }, 100); // Small delay to ensure trip creation completes first
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showErrorToast('Please fill in all required fields correctly');
      return;
    }

    // Double-check driver availability before creating trip
    if (formData.driver && driversInUse.has(formData.driver)) {
      setErrors(prev => ({ 
        ...prev, 
        driver: 'Selected driver is currently on another trip' 
      }));
      showErrorToast('Selected driver is currently on another trip');
      return;
    }
    
    // Note: Vehicles are already filtered by currentStatus === 'idle', so they should be available

    try {
      // Prepare the data for submission
      const submitData: TripCreateRequest & { loadProvider?: string } = { ...formData };
      
      // Clean up touching locations: trim names and filter out empty ones
      if (submitData.isTouchingLocationAvailable && submitData.touchingLocations) {
        submitData.touchingLocations = submitData.touchingLocations
          .map(loc => ({ ...loc, name: loc.name.trim() }))
          .filter(loc => loc.name !== '');
      } else {
        // If touching locations not available, ensure it's an empty array or undefined
        submitData.touchingLocations = [];
      }
      
      // Only include loadProvider if it's selected
      if (!submitData.loadProvider) {
        delete submitData.loadProvider;
      }
      
      console.log('Creating trip with data:', submitData);
      
      // Update vehicle status OPTIMISTICALLY before creating trip
      // This ensures vehicle status is updated even if trip creation times out
      let vehicleUpdateSuccess = false;
      if (formData.vehicle) {
        try {
          setIsUpdatingVehicleStatus(true);
          console.log('Updating vehicle status to assigned before trip creation...');
          const vehicleUpdateResult = await updateVehicle(formData.vehicle, {
            currentStatus: VehicleCurrentStatus.ASSIGNED,
          });
          if (vehicleUpdateResult) {
            vehicleUpdateSuccess = true;
            console.log('Vehicle status updated to assigned successfully');
          }
          setIsUpdatingVehicleStatus(false);
        } catch (vehicleError) {
          console.error('Failed to update vehicle status before trip creation:', vehicleError);
          setIsUpdatingVehicleStatus(false);
          // Continue with trip creation even if vehicle update fails
        }
      }
      
      // Create trip with timeout handling
      let newTrip: Trip | null = null;
      try {
        // Use Promise.race to add a timeout for trip creation
        const tripCreationPromise = createTrip(submitData);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Trip creation timeout after 30 seconds')), 30000);
        });
        
        newTrip = await Promise.race([tripCreationPromise, timeoutPromise]);
      } catch (tripError: unknown) {
        console.error('Trip creation error or timeout:', tripError);
        
        // If vehicle was updated but trip creation failed/timed out, revert vehicle status
        if (vehicleUpdateSuccess && formData.vehicle) {
          try {
            setIsUpdatingVehicleStatus(true);
            console.log('Reverting vehicle status to idle due to trip creation failure...');
            await updateVehicle(formData.vehicle, {
              currentStatus: VehicleCurrentStatus.IDLE,
            });
            setIsUpdatingVehicleStatus(false);
          } catch (revertError) {
            console.error('Failed to revert vehicle status:', revertError);
            setIsUpdatingVehicleStatus(false);
          }
        }
        
        // Check if it's a timeout error
        const errorMessage = tripError instanceof Error ? tripError.message : String(tripError);
        if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
          // Trip might have been created on backend despite timeout
          showWarningToast('Trip creation is taking longer than expected. Please check if the trip was created successfully.');
        } else {
          showErrorToast(tripError);
        }
        return;
      }
      
      if (newTrip) {
        // Show success notification
        showSuccessToast(`Trip "${newTrip.tripNumber}" created successfully!`);
        
        // Vehicle status should already be updated, but ensure it's set if it wasn't
        if (formData.vehicle && !vehicleUpdateSuccess) {
          // Retry vehicle update in background if initial update failed
          updateVehicleStatusWithRetry(formData.vehicle);
        }
        
        // Call onSuccess
        onSuccess(newTrip);
      }
    } catch (err) {
      console.error('Failed to create trip:', err);
      
      // Use the helper function to extract and display Strapi error
      showErrorToast(err);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {apiError && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trip Number */}
        <div>
          <label htmlFor="tripNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Trip Number *
          </label>
          <input
            type="text"
            id="tripNumber"
            value={formData.tripNumber}
            onChange={(e) => handleInputChange('tripNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., trip001"
            disabled={isLoading}
          />
          {errors.tripNumber && <p className="mt-1 text-sm text-red-600">{errors.tripNumber}</p>}
        </div>


        {/* Estimated Start Time */}
        <div>
          <label htmlFor="estimatedStartTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estimated Start Time *
          </label>
          <input
            type="datetime-local"
            id="estimatedStartTime"
            value={formData.estimatedStartTime}
            onChange={(e) => handleInputChange('estimatedStartTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
          {errors.estimatedStartTime && <p className="mt-1 text-sm text-red-600">{errors.estimatedStartTime}</p>}
        </div>


        {/* Start Point */}
        <div>
          <label htmlFor="startPoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Point *
          </label>
          <input
            type="text"
            id="startPoint"
            value={formData.startPoint}
            onChange={(e) => handleInputChange('startPoint', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., New York, NY"
            disabled={isLoading}
          />
          {errors.startPoint && <p className="mt-1 text-sm text-red-600">{errors.startPoint}</p>}
        </div>

        {/* End Point */}
        <div>
          <label htmlFor="endPoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            End Point *
          </label>
          <input
            type="text"
            id="endPoint"
            value={formData.endPoint}
            onChange={(e) => handleInputChange('endPoint', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Los Angeles, CA"
            disabled={isLoading}
          />
          {errors.endPoint && <p className="mt-1 text-sm text-red-600">{errors.endPoint}</p>}
        </div>

        {/* Total Trip Distance */}
        <div>
          <label htmlFor="totalTripDistanceInKM" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Total Trip Distance (KM) *
          </label>
          <input
            type="number"
            id="totalTripDistanceInKM"
            value={formData.totalTripDistanceInKM}
            onChange={(e) => handleInputChange('totalTripDistanceInKM', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., 150.5"
            min="0"
            step="0.1"
            disabled={isLoading}
          />
          {errors.totalTripDistanceInKM && <p className="mt-1 text-sm text-red-600">{errors.totalTripDistanceInKM}</p>}
        </div>

        {/* Total Trip Time in Hours */}
        <div>
          <label htmlFor="totalTripTimeInHours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Total Trip Time (Hours) *
          </label>
          <input
            type="number"
            id="totalTripTimeInHours"
            value={totalTripTimeInHours}
            onChange={(e) => {
              const hours = parseFloat(e.target.value) || 0;
              setTotalTripTimeInHours(hours);
              if (errors.totalTripTimeInHours) {
                setErrors(prev => ({ ...prev, totalTripTimeInHours: '' }));
              }
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.totalTripTimeInHours ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="e.g., 8.5"
            min="0"
            step="0.1"
            disabled={isLoading}
          />
          {errors.totalTripTimeInHours && <p className="mt-1 text-sm text-red-600">{errors.totalTripTimeInHours}</p>}
        </div>

        {/* Calculated Estimated End Time (Read-only) */}
        {formData.estimatedEndTime && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Calculated End Time
            </label>
            <input
              type="datetime-local"
              value={formData.estimatedEndTime}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              readOnly
            />
            <p className="mt-1 text-sm text-gray-500">This is automatically calculated based on start time and trip duration</p>
          </div>
        )}

        {/* Freight Total Amount */}
        <div>
          <label htmlFor="freightTotalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Freight Total Amount (₹) *
          </label>
          <input
            type="number"
            id="freightTotalAmount"
            value={formData.freightTotalAmount || ''}
            onChange={(e) => handleInputChange('freightTotalAmount', parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.freightTotalAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="e.g., 5000"
            min="0"
            step="0.01"
            disabled={isLoading}
          />
          {errors.freightTotalAmount && <p className="mt-1 text-sm text-red-600">{errors.freightTotalAmount}</p>}
        </div>

        {/* Advance Amount */}
        <div>
          <label htmlFor="advanceAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Advance Amount (₹) *
          </label>
          <input
            type="number"
            id="advanceAmount"
            value={formData.advanceAmount !== undefined && formData.advanceAmount !== null ? formData.advanceAmount : ''}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string during typing, but convert to 0 if empty on blur
              if (value === '') {
                handleInputChange('advanceAmount', undefined);
              } else {
                const numValue = parseFloat(value);
                handleInputChange('advanceAmount', isNaN(numValue) ? undefined : numValue);
              }
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.advanceAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="e.g., 2000 or 0"
            min="0"
            step="0.01"
            disabled={isLoading}
          />
          {errors.advanceAmount && <p className="mt-1 text-sm text-red-600">{errors.advanceAmount}</p>}
        </div>

        {/* Is Touching Location Available */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isTouchingLocationAvailable"
            checked={formData.isTouchingLocationAvailable || false}
            onChange={(e) => {
              const checked = e.target.checked;
              setFormData(prev => ({
                ...prev,
                isTouchingLocationAvailable: checked,
                // Clear touching locations when unchecked
                touchingLocations: checked ? prev.touchingLocations || [] : []
              }));
              // Clear any errors
              if (errors.touchingLocations) {
                setErrors(prev => ({ ...prev, touchingLocations: '' }));
              }
            }}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="isTouchingLocationAvailable" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Touching Locations Available
          </label>
        </div>

        {/* Vehicle Selection with Search */}
        <div className="relative">
          <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vehicle <span className="text-red-500">*</span>
          </label>
          
          {/* Dropdown Button */}
          <button
            id="vehicleDropdownButton"
            type="button"
            onClick={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
            className={`w-full px-3 py-2 text-left border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white flex items-center justify-between ${
              errors.vehicle ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } ${isLoading || vehiclesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading || vehiclesLoading}
          >
            <span className={formData.vehicle ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
              {(() => {
                if (!formData.vehicle) return 'Select a vehicle';
                const selectedVehicle = availableVehicles.find(v => v.documentId === formData.vehicle);
                return selectedVehicle 
                  ? `${selectedVehicle.vehicleNumber} - ${selectedVehicle.model}`
                  : 'Select a vehicle';
              })()}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${isVehicleDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isVehicleDropdownOpen && (
            <div
              id="vehicleDropdown"
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600"
            >
              {/* Search Input */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-500 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={vehicleSearchQuery}
                    onChange={(e) => setVehicleSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    placeholder="Search vehicles..."
                    autoFocus
                  />
                </div>
              </div>

              {/* Vehicle List */}
              <div 
                className="max-h-60 overflow-y-auto"
                onScroll={(e) => {
                  const target = e.target as HTMLElement;
                  const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                  // Load more when user scrolls within 50px of bottom
                  if (scrollBottom < 50 && hasMoreVehicles && !isLoadingMoreVehicles && !vehiclesLoading) {
                    loadMoreVehicles();
                  }
                }}
              >
                {vehiclesLoading && availableVehicles.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    Loading vehicles...
                  </div>
                ) : (() => {
                  // Vehicles are already filtered server-side, so just display them
                  // No need for client-side filtering since we're using the same search API as vehicles page
                  if (availableVehicles.length === 0) {
                    return (
                      <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                        {vehicleSearchQuery ? 'No vehicles found matching your search' : 'No available vehicles found'}
                      </div>
                    );
                  }

                  return (
                    <>
                      <ul className="p-2 text-sm text-gray-700 dark:text-gray-200">
                        {availableVehicles.map((vehicle) => (
                          <li key={vehicle.documentId}>
                            <button
                              type="button"
                              onClick={() => {
                                handleInputChange('vehicle', vehicle.documentId);
                                checkAvailability('vehicle', vehicle.documentId);
                                setIsVehicleDropdownOpen(false);
                                setVehicleSearchQuery('');
                              }}
                              className={`inline-flex items-center w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 ${
                                formData.vehicle === vehicle.documentId
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                  : 'text-gray-700 dark:text-gray-200'
                              }`}
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-medium">
                                  {vehicle.vehicleNumber} - {vehicle.model}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {vehicle.type} • {vehicle.currentStatus}
                                  {vehicle.chassisNumber && ` • ${vehicle.chassisNumber}`}
                                </span>
                              </div>
                              {formData.vehicle === vehicle.documentId && (
                                <svg
                                  className="w-4 h-4 ml-auto"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                      {isLoadingMoreVehicles && (
                        <div className="p-3 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <svg className="animate-spin h-4 w-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Loading more vehicles...</span>
                        </div>
                      )}
                      {!hasMoreVehicles && availableVehicles.length > 0 && !isLoadingMoreVehicles && (
                        <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                          No more vehicles to load
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {errors.vehicle && <p className="mt-1 text-sm text-red-600">{errors.vehicle}</p>}
          {availableVehicles.length === 0 && !vehiclesLoading && (
            <p className="mt-1 text-sm text-yellow-600">
              No available vehicles found. Only vehicles with &quot;idle&quot; status are available for new trips.
            </p>
          )}
          {availableVehicles.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Only vehicles with &quot;idle&quot; status are shown. Use search to find vehicles quickly.
            </p>
          )}
        </div>

        {/* Driver Selection */}
        <div>
          <label htmlFor="driver" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Driver
          </label>
          <select
            id="driver"
            value={formData.driver || ''}
            onFocus={handleDriverDropdownFocus}
            onChange={(e) => {
              const value = e.target.value || null;
              handleInputChange('driver', value);
              checkAvailability('driver', value);
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.driver ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isLoading || driversLoading}
          >
            <option value="">Select a driver (Optional)</option>
            {availableDrivers.map((driver) => {
              const isInUse = driversInUse.has(driver.documentId);
              const isDisabled = isInUse;
              
              return (
                <option 
                  key={driver.documentId} 
                  value={driver.documentId}
                  disabled={isDisabled}
                  className={isDisabled ? 'text-gray-400' : ''}
                >
                  {driver.fullName} - {driver.contactNumber}
                  {isInUse ? ' - Currently on trip' : ''}
                </option>
              );
            })}
          </select>
          {errors.driver && <p className="mt-1 text-sm text-red-600">{errors.driver}</p>}
          {driversLoading && (
            <p className="mt-1 text-sm text-gray-500">Loading drivers...</p>
          )}
          {availableDrivers.length === 0 && !driversLoading && (
            <p className="mt-1 text-sm text-yellow-600">
              No available drivers found. All drivers are currently on trips.
            </p>
          )}
          {availableDrivers.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Drivers currently on trips are disabled and cannot be selected.
            </p>
          )}
        </div>

        {/* Load Provider Selection */}
        <div>
          <label htmlFor="loadProvider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Load Provider
          </label>
          <select
            id="loadProvider"
            value={formData.loadProvider || ''}
            onChange={(e) => {
              const value = e.target.value || undefined;
              handleInputChange('loadProvider', value);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading || isLoadingLoadProviders}
          >
            <option value="">Select a load provider (Optional)</option>
            {loadProviders.map((provider) => (
              <option 
                key={provider.documentId} 
                value={provider.documentId}
              >
                {provider.name}{provider.shortName ? ` (${provider.shortName})` : ''}
              </option>
            ))}
          </select>
          {isLoadingLoadProviders && (
            <p className="mt-1 text-sm text-gray-500">Loading load providers...</p>
          )}
          {loadProviders.length === 0 && !isLoadingLoadProviders && (
            <p className="mt-1 text-sm text-gray-500">No active load providers available</p>
          )}
        </div>
      </div>

      {/* Touching Locations Section */}
      {formData.isTouchingLocationAvailable && (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white">Touching Locations</h4>
            <button
              type="button"
              onClick={addTouchingLocation}
              disabled={isLoading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Location
            </button>
          </div>
          
          {formData.touchingLocations && formData.touchingLocations.length > 0 ? (
            <div className="space-y-3">
              {formData.touchingLocations.map((location, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={location.name || ''}
                    onChange={(e) => {
                      updateTouchingLocation(index, e.target.value);
                      // Clear error when user starts typing
                      if (errors.touchingLocations) {
                        setErrors(prev => ({ ...prev, touchingLocations: '' }));
                      }
                    }}
                    placeholder={`Location ${index + 1} name`}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      errors.touchingLocations ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => removeTouchingLocation(index)}
                    disabled={isLoading}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No touching locations added. Click &quot;Add Location&quot; to add one.</p>
          )}
          {errors.touchingLocations && <p className="mt-2 text-sm text-red-600">{errors.touchingLocations}</p>}
        </div>
      )}

      {/* Vehicle Status Update Loading Indicator */}
      {isUpdatingVehicleStatus && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center">
            <svg className="animate-spin h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Updating vehicle status...
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading || isUpdatingVehicleStatus}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || isUpdatingVehicleStatus}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading || isUpdatingVehicleStatus ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isUpdatingVehicleStatus ? 'Updating vehicle...' : 'Creating...'}
            </span>
          ) : (
            'Create Trip'
          )}
        </button>
      </div>
    </form>
  );
}
