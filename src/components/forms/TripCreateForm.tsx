"use client";
import React, { useState, useEffect } from 'react';
import { useTrips } from '@/store/hooks/useTrips';
import { useDrivers } from '@/store/hooks/useDrivers';
import { useVehicles } from '@/store/hooks/useVehicles';
import { useReduxAuth } from '@/store/hooks/useReduxAuth';
import { isVehicleInUse, isDriverInUse } from '@/utils/vehicleInUse';
import type { TripCreateRequest, Trip, LogisticsProvider, Vehicle, Driver } from '@/store/api/types';
import { TripStatus } from '@/store/api/types';

interface TripCreateFormProps {
  onSuccess: (trip: Trip) => void;
  onCancel: () => void;
}

export default function TripCreateForm({ onSuccess, onCancel }: TripCreateFormProps) {
  const { createTrip, isLoading, error: apiError, clearTripsError } = useTrips();
  const { drivers, getDrivers, isLoading: driversLoading } = useDrivers();
  const { vehicles, getVehicles, isLoading: vehiclesLoading } = useVehicles();
  const { user } = useReduxAuth();

  const [formData, setFormData] = useState<TripCreateRequest>({
    tripNumber: '',
    estimatedStartTime: '',
    estimatedEndTime: '',
    startPoint: '',
    endPoint: '',
    totalTripDistanceInKM: 0,
    startPointCoords: null,
    endPointCoords: null,
    currentStatus: 'created' as TripStatus,
    driver: undefined,
    vehicle: undefined,
    logisticsProvider: undefined,
    // Custom fields
    cstmCreatedBy: user?.documentId || user?.id || '',
    cstmUpdatedBy: user?.documentId || user?.id || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logisticsProviders, setLogisticsProviders] = useState<LogisticsProvider[]>([]);
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
          getDrivers({ isActive: true }),
          getVehicles({ isActive: true })
        ]);
        
        // For now, we'll create mock logistics providers
        // In a real app, you'd fetch these from an API
        setLogisticsProviders([
          {
            id: '1',
            documentId: 'lp1',
            name: 'ABC Logistics',
            contactNumber: '+1234567890',
            email: 'contact@abclogistics.com',
            address: '123 Main St, City, State',
            isActive: true,
            publishedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            documentId: 'lp2',
            name: 'XYZ Transport',
            contactNumber: '+0987654321',
            email: 'info@xyztransport.com',
            address: '456 Oak Ave, City, State',
            isActive: true,
            publishedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
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
      // Filter vehicles to only show those with "assigned" or "idle" status
      const filteredVehicles = vehicles.filter((vehicle: Vehicle) => 
        vehicle.currentStatus === 'assigned' || vehicle.currentStatus === 'idle'
      );
      
      setAvailableVehicles(filteredVehicles);
      
      // Check which vehicles are currently in use (in-transit status)
      const checkVehiclesInUse = async () => {
        const inUseChecks = await Promise.all(
          filteredVehicles.map(async (vehicle: Vehicle) => {
            const inUse = await isVehicleInUse(vehicle.documentId);
            return { vehicleId: vehicle.documentId, inUse };
          })
        );
        
        const inUseSet = new Set<string>(
          inUseChecks
            .filter((check: { vehicleId: string; inUse: boolean }) => check.inUse)
            .map((check: { vehicleId: string; inUse: boolean }) => check.vehicleId)
        );
        
        setVehiclesInUse(inUseSet);
      };
      
      checkVehiclesInUse();
    }
  }, [vehicles]);

  // Process drivers when they change
  useEffect(() => {
    if (drivers && drivers.length > 0) {
      // Set all drivers as available initially
      setAvailableDrivers(drivers);
      
      // Check which drivers are currently in use (assigned to in-transit trips)
      const checkDriversInUse = async () => {
        const inUseChecks = await Promise.all(
          drivers.map(async (driver: Driver) => {
            const inUse = await isDriverInUse(driver.documentId);
            return { driverId: driver.documentId, inUse };
          })
        );
        
        const inUseSet = new Set<string>(
          inUseChecks
            .filter((check: { driverId: string; inUse: boolean }) => check.inUse)
            .map((check: { driverId: string; inUse: boolean }) => check.driverId)
        );
        
        setDriversInUse(inUseSet);
      };
      
      checkDriversInUse();
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.tripNumber.trim()) {
      newErrors.tripNumber = 'Trip Number is required';
    }
    
    if (!formData.estimatedStartTime) {
      newErrors.estimatedStartTime = 'Estimated Start Time is required';
    }
    
    if (!formData.estimatedEndTime) {
      newErrors.estimatedEndTime = 'Estimated End Time is required';
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
    
    if (formData.estimatedStartTime && formData.estimatedEndTime) {
      const startTime = new Date(formData.estimatedStartTime);
      const endTime = new Date(formData.estimatedEndTime);
      if (endTime <= startTime) {
        newErrors.estimatedEndTime = 'End time must be after start time';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      const newTrip = await createTrip(formData);
      if (newTrip) {
        onSuccess(newTrip);
      }
    } catch (err) {
      console.error('Failed to create trip:', err);
      // Error is already handled by the thunk and set in Redux state
    }
  };

  const tripStatusOptions: { value: TripStatus; label: string }[] = [
    { value: TripStatus.CREATED, label: 'Created' },
    { value: TripStatus.IN_TRANSIT, label: 'In Transit' },
    { value: TripStatus.COMPLETED, label: 'Completed' },
  ];

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

        {/* Current Status */}
        <div>
          <label htmlFor="currentStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status *
          </label>
          <select
            id="currentStatus"
            value={formData.currentStatus}
            onChange={(e) => handleInputChange('currentStatus', e.target.value as TripStatus)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          >
            {tripStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.currentStatus && <p className="mt-1 text-sm text-red-600">{errors.currentStatus}</p>}
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

        {/* Estimated End Time */}
        <div>
          <label htmlFor="estimatedEndTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estimated End Time *
          </label>
          <input
            type="datetime-local"
            id="estimatedEndTime"
            value={formData.estimatedEndTime}
            onChange={(e) => handleInputChange('estimatedEndTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
          {errors.estimatedEndTime && <p className="mt-1 text-sm text-red-600">{errors.estimatedEndTime}</p>}
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

        {/* Driver Selection */}
        <div>
          <label htmlFor="driver" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Driver <span className="text-red-500">*</span>
          </label>
          <select
            id="driver"
            value={formData.driver || ''}
            onChange={(e) => handleInputChange('driver', e.target.value || null)}
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
        </div>

        {/* Vehicle Selection */}
        <div>
          <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vehicle <span className="text-red-500">*</span>
          </label>
          <select
            id="vehicle"
            value={formData.vehicle || ''}
            onChange={(e) => handleInputChange('vehicle', e.target.value || null)}
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
              No available vehicles found. Only vehicles with &quot;assigned&quot; or &quot;idle&quot; status are available for trips.
            </p>
          )}
        </div>

        {/* Logistics Provider Selection */}
        <div>
          <label htmlFor="logisticsProvider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Logistics Provider
          </label>
          <select
            id="logisticsProvider"
            value={formData.logisticsProvider || ''}
            onChange={(e) => handleInputChange('logisticsProvider', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          >
            <option value="">Select a logistics provider (optional)</option>
            {logisticsProviders.map((provider) => (
              <option key={provider.documentId} value={provider.documentId}>
                {provider.name} - {provider.contactNumber}
              </option>
            ))}
          </select>
        </div>

        {/* Start Point Coordinates */}
        <div>
          <label htmlFor="startPointCoords" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Point Coordinates (Optional)
          </label>
          <input
            type="text"
            id="startPointCoords"
            value={formData.startPointCoords || ''}
            onChange={(e) => handleInputChange('startPointCoords', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., 40.7128,-74.0060"
            disabled={isLoading}
          />
        </div>

        {/* End Point Coordinates */}
        <div>
          <label htmlFor="endPointCoords" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            End Point Coordinates (Optional)
          </label>
          <input
            type="text"
            id="endPointCoords"
            value={formData.endPointCoords || ''}
            onChange={(e) => handleInputChange('endPointCoords', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., 34.0522,-118.2437"
            disabled={isLoading}
          />
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
