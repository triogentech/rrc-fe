"use client";
import React, { useState } from 'react';
import { useTrips } from '@/store/hooks/useTrips';
import type { TripCreateRequest, Trip, TripStatus } from '@/store/api/types';

interface TripCreateFormProps {
  onSuccess: (trip: Trip) => void;
  onCancel: () => void;
}

export default function TripCreateForm({ onSuccess, onCancel }: TripCreateFormProps) {
  const { createTrip, isLoading, error: apiError, clearTripsError } = useTrips();

  const [formData, setFormData] = useState<TripCreateRequest>({
    tripNumber: '',
    estimatedStartTime: '',
    estimatedEndTime: '',
    actualEndTime: null,
    startPointCoords: null,
    endPointCoords: null,
    currentStatus: 'created' as TripStatus,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof TripCreateRequest, value: string | null) => {
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
    { value: 'created', label: 'Created' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
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

        {/* Actual End Time */}
        <div>
          <label htmlFor="actualEndTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Actual End Time (Optional)
          </label>
          <input
            type="datetime-local"
            id="actualEndTime"
            value={formData.actualEndTime || ''}
            onChange={(e) => handleInputChange('actualEndTime', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
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
