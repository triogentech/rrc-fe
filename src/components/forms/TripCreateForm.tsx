"use client";
import React, { useState, useEffect } from 'react';
import { useTrips } from '@/store/hooks/useTrips';
import { useDrivers } from '@/store/hooks/useDrivers';
import { useVehicles } from '@/store/hooks/useVehicles';
import { useReduxAuth } from '@/store/hooks/useReduxAuth';
import type { TripCreateRequest, Trip, Vehicle, Driver } from '@/store/api/types';
import { TripStatus, VehicleCurrentStatus } from '@/store/api/types';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/utils/toastHelper';

interface TripCreateFormProps {
  onSuccess: (trip: Trip) => void;
  onCancel: () => void;
}

export default function TripCreateForm({ onSuccess, onCancel }: TripCreateFormProps) {
  const { createTrip, isLoading, error: apiError, clearTripsError } = useTrips();
  const { drivers, getDrivers, isLoading: driversLoading } = useDrivers();
  const { vehicles, getVehicles, isLoading: vehiclesLoading, updateVehicle } = useVehicles();
  const { user } = useReduxAuth();

  const [formData, setFormData] = useState<TripCreateRequest>({
    tripNumber: '',
    estimatedStartTime: '',
    estimatedEndTime: '',
    startPoint: '',
    endPoint: '',
    totalTripDistanceInKM: 0,
    currentStatus: 'created' as TripStatus,
    driver: undefined,
    vehicle: undefined,
    // New fields
    freightTotalAmount: 0,
    advanceAmount: 0,
    totalTripTimeInMinutes: 0,
    // Custom fields
    cstmCreatedBy: user?.documentId || user?.id || '',
    cstmUpdatedBy: user?.documentId || user?.id || '',
  });

  // Add state for totalTripTimeInHours (UI field)
  const [totalTripTimeInHours, setTotalTripTimeInHours] = useState<number>(0);

  const [errors, setErrors] = useState<Record<string, string>>({});

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
  const [vehiclesInUse, setVehiclesInUse] = useState<Set<string>>(new Set());
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [driversInUse, setDriversInUse] = useState<Set<string>>(new Set());

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch drivers and vehicles
        await Promise.all([
          getDrivers(),
          getVehicles()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [getDrivers, getVehicles]);

  // Process vehicles when they change
  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      // Filter vehicles to only show active ones with "idle" status
      // "assigned" vehicles are already assigned to trips and shouldn't be available for new trips
      const filteredVehicles = vehicles.filter((vehicle: Vehicle) => 
        vehicle.isActive !== false && 
        vehicle.currentStatus === 'idle'
      );
      
      setAvailableVehicles(filteredVehicles);
      
      // Check which vehicles are currently in use by making API calls
      const checkVehiclesInUse = async () => {
        try {
          const { isVehicleInUse } = await import('@/utils/vehicleInUse');
          const inUseChecks = await Promise.allSettled(
            filteredVehicles.map(async (vehicle: Vehicle) => {
              try {
                const inUse = await isVehicleInUse(vehicle.documentId);
                return { vehicleId: vehicle.documentId, inUse };
              } catch (error) {
                console.warn(`Error checking vehicle ${vehicle.documentId}:`, error);
                return { vehicleId: vehicle.documentId, inUse: false };
              }
            })
          );
          
          const inUseSet = new Set<string>(
            inUseChecks
              .filter((result): result is PromiseFulfilledResult<{ vehicleId: string; inUse: boolean }> => 
                result.status === 'fulfilled'
              )
              .map(result => result.value)
              .filter((check: { vehicleId: string; inUse: boolean }) => check.inUse)
              .map((check: { vehicleId: string; inUse: boolean }) => check.vehicleId)
          );
          
          setVehiclesInUse(inUseSet);
        } catch (error) {
          console.error('Error checking vehicle availability:', error);
          // Set empty set to allow form to continue working
          setVehiclesInUse(new Set());
        }
      };
      
      checkVehiclesInUse();
    }
  }, [vehicles]);

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

  const handleInputChange = (field: keyof TripCreateRequest, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (apiError) {
      clearTripsError();
    }
  };

  // Check if driver or vehicle is available for real-time validation
  const checkAvailability = (field: 'driver' | 'vehicle', value: string | null) => {
    if (!value) return;
    
    if (field === 'driver' && driversInUse.has(value)) {
      setErrors(prev => ({ 
        ...prev, 
        driver: 'Selected driver is currently on another trip' 
      }));
    } else if (field === 'vehicle' && vehiclesInUse.has(value)) {
      setErrors(prev => ({ 
        ...prev, 
        vehicle: 'Selected vehicle is currently in use' 
      }));
    } else {
      // Clear the error if the selection is valid
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
    
    if (!formData.driver) {
      newErrors.driver = 'Driver is required';
    }
    
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
    
    if (!formData.advanceAmount || formData.advanceAmount <= 0) {
      newErrors.advanceAmount = 'Advance Amount is required and must be greater than 0';
    }
    
    // Check if selected driver is currently in use
    if (formData.driver && driversInUse.has(formData.driver)) {
      newErrors.driver = 'Selected driver is currently on another trip';
    }
    
    // Check if selected vehicle is currently in use
    if (formData.vehicle && vehiclesInUse.has(formData.vehicle)) {
      newErrors.vehicle = 'Selected vehicle is currently in use';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showErrorToast('Please fill in all required fields correctly');
      return;
    }

    // Double-check availability before creating trip
    if (formData.driver && driversInUse.has(formData.driver)) {
      setErrors(prev => ({ 
        ...prev, 
        driver: 'Selected driver is currently on another trip' 
      }));
      showErrorToast('Selected driver is currently on another trip');
      return;
    }
    
    if (formData.vehicle && vehiclesInUse.has(formData.vehicle)) {
      setErrors(prev => ({ 
        ...prev, 
        vehicle: 'Selected vehicle is currently in use' 
      }));
      showErrorToast('Selected vehicle is currently in use');
      return;
    }

    try {
      const newTrip = await createTrip(formData);
      if (newTrip) {
        // Update vehicle status to "assigned" after successful trip creation
        if (formData.vehicle) {
          try {
            await updateVehicle(formData.vehicle, {
              currentStatus: VehicleCurrentStatus.ASSIGNED,
            });
            console.log('Vehicle status updated to assigned successfully');
          } catch (vehicleError) {
            console.error('Error updating vehicle status:', vehicleError);
            showWarningToast('Trip created but failed to update vehicle status');
            // Don't throw here, as trip was already created successfully
          }
        }
        
        // Show success notification
        showSuccessToast(`Trip "${newTrip.tripNumber}" created successfully!`);
        
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
            value={formData.advanceAmount || ''}
            onChange={(e) => handleInputChange('advanceAmount', parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.advanceAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="e.g., 2000"
            min="0"
            step="0.01"
            disabled={isLoading}
          />
          {errors.advanceAmount && <p className="mt-1 text-sm text-red-600">{errors.advanceAmount}</p>}
        </div>

        {/* Driver Selection */}
        <div>
          <label htmlFor="driver" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Driver <span className="text-red-500">*</span>
          </label>
          <select
            id="driver"
            value={formData.driver || ''}
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
            <option value="">Select a driver</option>
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

        {/* Vehicle Selection */}
        <div>
          <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vehicle <span className="text-red-500">*</span>
          </label>
          <select
            id="vehicle"
            value={formData.vehicle || ''}
            onChange={(e) => {
              const value = e.target.value || null;
              handleInputChange('vehicle', value);
              checkAvailability('vehicle', value);
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.vehicle ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isLoading || vehiclesLoading}
          >
            <option value="">Select a vehicle</option>
            {availableVehicles.map((vehicle) => {
              const isInUse = vehiclesInUse.has(vehicle.documentId);
              const isDisabled = isInUse;
              
              return (
                <option 
                  key={vehicle.documentId} 
                  value={vehicle.documentId}
                  disabled={isDisabled}
                  className={isDisabled ? 'text-gray-400' : ''}
                >
                  {vehicle.vehicleNumber} - {vehicle.model} ({vehicle.type}) 
                  {isInUse ? ' - Currently in use' : ` - ${vehicle.currentStatus}`}
                </option>
              );
            })}
          </select>
          {errors.vehicle && <p className="mt-1 text-sm text-red-600">{errors.vehicle}</p>}
          {vehiclesLoading && (
            <p className="mt-1 text-sm text-gray-500">Loading vehicles...</p>
          )}
          {availableVehicles.length === 0 && !vehiclesLoading && (
            <p className="mt-1 text-sm text-yellow-600">
              No available vehicles found. Only vehicles with &quot;idle&quot; status are available for new trips.
            </p>
          )}
          {availableVehicles.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Vehicles currently in use are disabled and cannot be selected.
            </p>
          )}
        </div>



      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : (
            'Create Trip'
          )}
        </button>
      </div>
    </form>
  );
}
