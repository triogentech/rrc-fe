"use client";
import React, { useState, useEffect } from 'react';
import { useVehicles } from '@/store/hooks/useVehicles';
import { useReduxAuth } from '@/store/hooks/useReduxAuth';
import type { Vehicle, VehicleUpdateRequest } from '@/store/api/types';
import { VehicleType, VehicleCurrentStatus } from '@/store/api/types';

interface VehicleEditFormProps {
  vehicle: Vehicle;
  onSuccess?: (vehicle: Vehicle) => void;
  onCancel?: () => void;
}

export default function VehicleEditForm({ vehicle, onSuccess, onCancel }: VehicleEditFormProps) {
  const { updateVehicle, isLoading } = useVehicles();
  const { user } = useReduxAuth();
  
  const [formData, setFormData] = useState<VehicleUpdateRequest>({
    vehicleNumber: vehicle.vehicleNumber,
    model: vehicle.model,
    type: vehicle.type,
    currentStatus: vehicle.currentStatus,
    isActive: vehicle.isActive ?? true, // Use isActive and default to true if null
    // Custom fields
    cstmCreatedBy: typeof vehicle.cstmCreatedBy === 'string' ? vehicle.cstmCreatedBy : vehicle.cstmCreatedBy?.documentId || '',
    cstmUpdatedBy: user?.documentId || user?.id || '',
  });

  const [errors, setErrors] = useState<Partial<VehicleUpdateRequest>>({});

  // Update form data when vehicle prop changes
  useEffect(() => {
    setFormData({
      vehicleNumber: vehicle.vehicleNumber,
      model: vehicle.model,
      type: vehicle.type,
      currentStatus: vehicle.currentStatus,
      isActive: vehicle.isActive ?? true, // Use isActive and default to true if null
      // Custom fields
      cstmCreatedBy: typeof vehicle.cstmCreatedBy === 'string' ? vehicle.cstmCreatedBy : vehicle.cstmCreatedBy?.documentId || '',
      cstmUpdatedBy: user?.documentId || user?.id || '',
    });
  }, [vehicle, user]);

  const handleInputChange = (field: keyof VehicleUpdateRequest, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<VehicleUpdateRequest> = {};

    if (!formData.vehicleNumber?.trim()) {
      newErrors.vehicleNumber = 'Vehicle number is required';
    }

    if (!formData.model?.trim()) {
      newErrors.model = 'Model is required';
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
      // Clean and prepare data for API
      const cleanedData = {
        vehicleNumber: formData.vehicleNumber?.trim(),
        model: formData.model?.trim(),
        type: formData.type,
        currentStatus: formData.currentStatus,
        isActive: formData.isActive, // Include isActive in the request
        // Custom fields
        cstmUpdatedBy: formData.cstmUpdatedBy,
      };

      console.log('Updating vehicle with data:', cleanedData);
      
      const updatedVehicle = await updateVehicle(vehicle.documentId, cleanedData);
      
      if (updatedVehicle) {
        console.log('Vehicle updated successfully:', updatedVehicle);
        onSuccess?.(updatedVehicle);
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle Number */}
        <div>
          <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vehicle Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="vehicleNumber"
            value={formData.vehicleNumber || ''}
            onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
              errors.vehicleNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter vehicle number"
            disabled={isLoading}
          />
          {errors.vehicleNumber && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.vehicleNumber}</p>
          )}
        </div>

        {/* Model */}
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Model <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="model"
            value={formData.model || ''}
            onChange={(e) => handleInputChange('model', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
              errors.model ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter vehicle model"
            disabled={isLoading}
          />
          {errors.model && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.model}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type
          </label>
          <select
            id="type"
            value={formData.type || VehicleType.TRUCK}
            onChange={(e) => handleInputChange('type', e.target.value as VehicleType)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          >
            <option value={VehicleType.TRUCK}>Truck</option>
            {/* <option value={VehicleType.CAR}>Car</option>
            <option value={VehicleType.VAN}>Van</option>
            <option value={VehicleType.BUS}>Bus</option>
            <option value={VehicleType.MOTORCYCLE}>Motorcycle</option> */}
          </select>
        </div>

        {/* Current Status */}
        <div>
          <label htmlFor="currentStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Status
          </label>
          <select
            id="currentStatus"
            value={formData.currentStatus || VehicleCurrentStatus.CHOOSE_HERE}
            onChange={(e) => handleInputChange('currentStatus', e.target.value as VehicleCurrentStatus)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          >
            <option value={VehicleCurrentStatus.CHOOSE_HERE}>Choose here</option>
            <option value={VehicleCurrentStatus.IDLE}>Idle</option>
            <option value={VehicleCurrentStatus.ASSIGNED}>Assigned</option>
            <option value={VehicleCurrentStatus.ONGOING}>Ongoing</option>
          </select>
        </div>

        {/* Active Status */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Active Status
          </label>
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium ${!formData.isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Inactive
            </span>
            <button
              type="button"
              onClick={() => handleInputChange('isActive', !formData.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                formData.isActive 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200 dark:bg-gray-700'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={isLoading}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${formData.isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Updating...
            </div>
          ) : (
            'Update Vehicle'
          )}
        </button>
      </div>
    </form>
  );
}
