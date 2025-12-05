"use client";
import React, { useState, useEffect } from 'react';
import { useTrips } from '@/store/hooks/useTrips';
import { useDrivers } from '@/store/hooks/useDrivers';
import { useVehicles } from '@/store/hooks/useVehicles';
import { useReduxAuth } from '@/store/hooks/useReduxAuth';
import type { Trip, TripUpdateRequest, LogisticsProvider } from '@/store/api/types';
import { TripStatus } from '@/store/api/types';
import { showSuccessToast, showErrorToast } from '@/utils/toastHelper';
import { convertDatetimeLocalToUTC, convertUTCToDatetimeLocal } from '@/utils/dateFormatter';

interface TripEditFormProps {
  trip: Trip;
  onSuccess: (trip: Trip) => void;
  onCancel: () => void;
}

export default function TripEditForm({ trip, onSuccess, onCancel }: TripEditFormProps) {
  const { updateTrip, isLoading, error: apiError, clearTripsError } = useTrips();
  const { drivers, getDrivers, isLoading: driversLoading } = useDrivers();
  const { vehicles, getVehicles, isLoading: vehiclesLoading } = useVehicles();
  const { user } = useReduxAuth();

  const [formData, setFormData] = useState<TripUpdateRequest>({
    tripNumber: trip.tripNumber,
    estimatedStartTime: trip.estimatedStartTime,
    estimatedEndTime: trip.estimatedEndTime,
    startPoint: trip.startPoint || '',
    endPoint: trip.endPoint || '',
    totalTripDistanceInKM: trip.totalTripDistanceInKM || 0,
    startPointCoords: trip.startPointCoords,
    endPointCoords: trip.endPointCoords,
    currentStatus: trip.currentStatus,
    driver: typeof trip.driver === 'string' ? trip.driver : trip.driver?.documentId,
    vehicle: typeof trip.vehicle === 'string' ? trip.vehicle : trip.vehicle?.documentId,
    logisticsProvider: typeof trip.logisticsProvider === 'string' ? trip.logisticsProvider : trip.logisticsProvider?.documentId,
    // New fields
    freightTotalAmount: trip.freightTotalAmount || 0,
    advanceAmount: trip.advanceAmount || 0,
    // Custom fields
    cstmCreatedBy: typeof trip.cstmCreatedBy === 'string' ? trip.cstmCreatedBy : trip.cstmCreatedBy?.documentId,
    cstmUpdatedBy: user?.documentId || user?.id || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logisticsProviders, setLogisticsProviders] = useState<LogisticsProvider[]>([]);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch drivers and vehicles
        await Promise.all([
          getDrivers({ isActive: true }),
          getVehicles({ active: true })
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

  useEffect(() => {
    setFormData({
      tripNumber: trip.tripNumber,
      estimatedStartTime: trip.estimatedStartTime,
      estimatedEndTime: trip.estimatedEndTime,
      startPoint: trip.startPoint || '',
      endPoint: trip.endPoint || '',
      totalTripDistanceInKM: trip.totalTripDistanceInKM || 0,
      startPointCoords: trip.startPointCoords,
      endPointCoords: trip.endPointCoords,
      currentStatus: trip.currentStatus,
      driver: typeof trip.driver === 'string' ? trip.driver : trip.driver?.documentId,
      vehicle: typeof trip.vehicle === 'string' ? trip.vehicle : trip.vehicle?.documentId,
      logisticsProvider: typeof trip.logisticsProvider === 'string' ? trip.logisticsProvider : trip.logisticsProvider?.documentId,
      // New fields
      freightTotalAmount: trip.freightTotalAmount || 0,
      advanceAmount: trip.advanceAmount || 0,
      // Custom fields
      cstmCreatedBy: typeof trip.cstmCreatedBy === 'string' ? trip.cstmCreatedBy : trip.cstmCreatedBy?.documentId,
      cstmUpdatedBy: user?.documentId || user?.id || '',
    });
  }, [trip, user]);

  const handleInputChange = (field: keyof TripUpdateRequest, value: string | number | null) => {
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
    
    if (!formData.tripNumber?.trim()) {
      newErrors.tripNumber = 'Trip Number is required';
    }
    
    if (!formData.estimatedStartTime) {
      newErrors.estimatedStartTime = 'Estimated Start Time is required';
    }
    
    if (!formData.startPoint?.trim()) {
      newErrors.startPoint = 'Start Point is required';
    }
    
    if (!formData.endPoint?.trim()) {
      newErrors.endPoint = 'End Point is required';
    }
    
    if (!formData.totalTripDistanceInKM || formData.totalTripDistanceInKM <= 0) {
      newErrors.totalTripDistanceInKM = 'Total Trip Distance must be greater than 0';
    }
    
    if (!formData.freightTotalAmount || formData.freightTotalAmount <= 0) {
      newErrors.freightTotalAmount = 'Freight Total Amount is required and must be greater than 0';
    }
    
    if (formData.advanceAmount === undefined || formData.advanceAmount === null || formData.advanceAmount < 0) {
      newErrors.advanceAmount = 'Advance Amount is required and must be 0 or greater';
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

    try {
      // Prepare the data for submission with ISO UTC dates
      const submitData = { ...formData };
      
      // Convert datetime-local values to ISO UTC format for API using utility function
      submitData.estimatedStartTime = convertDatetimeLocalToUTC(submitData.estimatedStartTime);
      submitData.estimatedEndTime = convertDatetimeLocalToUTC(submitData.estimatedEndTime);
      
      const updatedTrip = await updateTrip(trip.documentId, submitData);
      if (updatedTrip) {
        showSuccessToast(`Trip "${updatedTrip.tripNumber}" updated successfully!`);
        onSuccess(updatedTrip);
      }
    } catch (err) {
      console.error('Failed to update trip:', err);
      showErrorToast(err);
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
            value={formData.tripNumber || ''}
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
            value={formData.currentStatus || 'created'}
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
            value={convertUTCToDatetimeLocal(formData.estimatedStartTime)}
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
            value={convertUTCToDatetimeLocal(formData.estimatedEndTime)}
            onChange={(e) => handleInputChange('estimatedEndTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
        </div>

        {/* Start Point */}
        <div>
          <label htmlFor="startPoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Point *
          </label>
          <input
            type="text"
            id="startPoint"
            value={formData.startPoint || ''}
            onChange={(e) => handleInputChange('startPoint', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Mumbai"
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
            value={formData.endPoint || ''}
            onChange={(e) => handleInputChange('endPoint', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Delhi"
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
            value={formData.totalTripDistanceInKM || 0}
            onChange={(e) => handleInputChange('totalTripDistanceInKM', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., 150.5"
            min="0"
            step="0.1"
            disabled={isLoading}
          />
          {errors.totalTripDistanceInKM && <p className="mt-1 text-sm text-red-600">{errors.totalTripDistanceInKM}</p>}
        </div>

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
            placeholder="e.g., 50000"
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
              if (value === '') {
                handleInputChange('advanceAmount', null);
              } else {
                const numValue = parseFloat(value);
                handleInputChange('advanceAmount', isNaN(numValue) ? null : numValue);
              }
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.advanceAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="e.g., 10000"
            min="0"
            step="0.01"
            disabled={isLoading}
          />
          {errors.advanceAmount && <p className="mt-1 text-sm text-red-600">{errors.advanceAmount}</p>}
        </div>

        {/* Driver Selection */}
        <div>
          <label htmlFor="driver" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Driver
          </label>
          <select
            id="driver"
            value={formData.driver || ''}
            onChange={(e) => handleInputChange('driver', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading || driversLoading}
          >
            <option value="">Select a driver (optional)</option>
            {drivers.map((driver) => (
              <option key={driver.documentId} value={driver.documentId}>
                {driver.fullName} - {driver.contactNumber}
              </option>
            ))}
          </select>
          {driversLoading && (
            <p className="mt-1 text-sm text-gray-500">Loading drivers...</p>
          )}
        </div>

        {/* Vehicle Selection */}
        <div>
          <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vehicle
          </label>
          <select
            id="vehicle"
            value={formData.vehicle || ''}
            onChange={(e) => handleInputChange('vehicle', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading || vehiclesLoading}
          >
            <option value="">Select a vehicle (optional)</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.documentId} value={vehicle.documentId}>
                {vehicle.vehicleNumber} - {vehicle.model} ({vehicle.type})
              </option>
            ))}
          </select>
          {vehiclesLoading && (
            <p className="mt-1 text-sm text-gray-500">Loading vehicles...</p>
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            disabled={true}
            readOnly
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">This field cannot be edited</p>
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            disabled={true}
            readOnly
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">This field cannot be edited</p>
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
              Updating...
            </span>
          ) : (
            'Update Trip'
          )}
        </button>
      </div>
    </form>
  );
}
