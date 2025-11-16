"use client";
import React, { useState, useCallback } from 'react';
import { useVehicles } from '@/store/hooks/useVehicles';
import { useReduxAuth } from '@/store/hooks/useReduxAuth';
import type { VehicleCreateRequest, Vehicle } from '@/store/api/types';
import { VehicleType, VehicleCurrentStatus } from '@/store/api/types';
import { showSuccessToast, showErrorToast } from '@/utils/toastHelper';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalenderIcon } from '@/icons';

interface VehicleCreateFormProps {
  onSuccess?: (vehicle: Vehicle) => void;
  onCancel?: () => void;
}

export default function VehicleCreateForm({ onSuccess, onCancel }: VehicleCreateFormProps) {
  const { createVehicle, isLoading } = useVehicles();
  const { user } = useReduxAuth();
  
  const [formData, setFormData] = useState<VehicleCreateRequest>({
    vehicleNumber: '',
    model: '',
    type: VehicleType.TRUCK,
    currentStatus: VehicleCurrentStatus.IDLE,
    isActive: true,
    // New mandatory fields
    odometerReading: '',
    engineNumber: '',
    chassisNumber: '',
    typeOfVehicleAxle: '',
    // Mandatory date fields
    registrationDate: '',
    fitnessDate: '',
    insuranceDate: '',
    taxDueDate: '',
    permitDate: '',
    puccDate: '',
    npValidUpto: '',
    // Custom fields
    cstmCreatedBy: user?.documentId || user?.id || '',
    cstmUpdatedBy: user?.documentId || user?.id || '',
  });

  const [errors, setErrors] = useState<Partial<VehicleCreateRequest>>({});

  // Handle input changes with useCallback to prevent unnecessary re-renders
  const handleInputChange = useCallback((field: keyof VehicleCreateRequest, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  }, []);

  // Helper function to parse date from string
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  // Helper function to format date for form data
  const formatDateForStorage = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<VehicleCreateRequest> = {};

    if (!formData.vehicleNumber.trim()) {
      newErrors.vehicleNumber = 'Vehicle number is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!formData.odometerReading.trim()) {
      newErrors.odometerReading = 'Odometer reading is required';
    }

    if (!formData.engineNumber.trim()) {
      newErrors.engineNumber = 'Engine number is required';
    }

    if (!formData.chassisNumber.trim()) {
      newErrors.chassisNumber = 'Chassis number is required';
    }

    if (!formData.typeOfVehicleAxle.trim()) {
      newErrors.typeOfVehicleAxle = 'Type of vehicle axle is required';
    }

    if (!formData.registrationDate.trim()) {
      newErrors.registrationDate = 'Registration date is required';
    }

    if (!formData.fitnessDate.trim()) {
      newErrors.fitnessDate = 'Fitness date is required';
    }

    if (!formData.insuranceDate.trim()) {
      newErrors.insuranceDate = 'Insurance date is required';
    }

    if (!formData.taxDueDate.trim()) {
      newErrors.taxDueDate = 'Tax due date is required';
    }

    if (!formData.permitDate.trim()) {
      newErrors.permitDate = 'Permit date is required';
    }

    if (!formData.puccDate.trim()) {
      newErrors.puccDate = 'PUCC date is required';
    }

    if (!formData.npValidUpto.trim()) {
      newErrors.npValidUpto = 'NP valid upto date is required';
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
      // Clean and prepare data for API
      const cleanedData: VehicleCreateRequest = {
        vehicleNumber: formData.vehicleNumber.trim(),
        model: formData.model.trim(),
        type: formData.type,
        currentStatus: formData.currentStatus,
        isActive: formData.isActive,
        // New mandatory fields - only include if not empty
        odometerReading: formData.odometerReading.trim() || '0',
        engineNumber: formData.engineNumber.trim(),
        chassisNumber: formData.chassisNumber.trim(),
        typeOfVehicleAxle: formData.typeOfVehicleAxle.trim(),
        // Mandatory date fields
        registrationDate: formData.registrationDate.trim(),
        fitnessDate: formData.fitnessDate.trim(),
        insuranceDate: formData.insuranceDate.trim(),
        taxDueDate: formData.taxDueDate.trim(),
        permitDate: formData.permitDate.trim(),
        puccDate: formData.puccDate.trim(),
        npValidUpto: formData.npValidUpto.trim(),
      };

      // Only add custom fields if they exist
      if (formData.cstmCreatedBy) {
        cleanedData.cstmCreatedBy = formData.cstmCreatedBy;
      }
      if (formData.cstmUpdatedBy) {
        cleanedData.cstmUpdatedBy = formData.cstmUpdatedBy;
      }

      console.log('Submitting vehicle data:', JSON.stringify(cleanedData, null, 2));
      
      const vehicle = await createVehicle(cleanedData);
      
      if (vehicle) {
        console.log('Vehicle created successfully:', vehicle);
        showSuccessToast(`Vehicle "${vehicle.vehicleNumber}" created successfully!`);
        onSuccess?.(vehicle);
      } else {
        showErrorToast('Failed to create vehicle. Please check all required fields.');
      }
    } catch (error) {
      console.error('Error creating vehicle:', error);
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
      showErrorToast(error);
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
            value={formData.vehicleNumber}
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
            value={formData.model}
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
            value={formData.type}
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


        {/* Odometer Reading */}
        <div>
          <label htmlFor="odometerReading" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Odometer Reading <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="odometerReading"
            value={formData.odometerReading}
            onChange={(e) => handleInputChange('odometerReading', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
              errors.odometerReading ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter odometer reading"
            disabled={isLoading}
          />
          {errors.odometerReading && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.odometerReading}</p>
          )}
        </div>

        {/* Engine Number */}
        <div>
          <label htmlFor="engineNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Engine Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="engineNumber"
            value={formData.engineNumber}
            onChange={(e) => handleInputChange('engineNumber', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
              errors.engineNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter engine number"
            disabled={isLoading}
          />
          {errors.engineNumber && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.engineNumber}</p>
          )}
        </div>

        {/* Chassis Number */}
        <div>
          <label htmlFor="chassisNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Chassis Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="chassisNumber"
            value={formData.chassisNumber}
            onChange={(e) => handleInputChange('chassisNumber', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
              errors.chassisNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter chassis number"
            disabled={isLoading}
          />
          {errors.chassisNumber && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.chassisNumber}</p>
          )}
        </div>

        {/* Type of Vehicle Axle */}
        <div>
          <label htmlFor="typeOfVehicleAxle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type of Vehicle Axle <span className="text-red-500">*</span>
          </label>
          <select
            id="typeOfVehicleAxle"
            value={formData.typeOfVehicleAxle}
            onChange={(e) => handleInputChange('typeOfVehicleAxle', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.typeOfVehicleAxle ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isLoading}
          >
            <option value="">Select axle type</option>
            <option value="single">Single</option>
            <option value="multi">Multi</option>
          </select>
          {errors.typeOfVehicleAxle && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.typeOfVehicleAxle}</p>
          )}
        </div>

        {/* Registration Date */}
        <div>
          <label htmlFor="registrationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Registration Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DatePicker
              selected={parseDate(formData.registrationDate)}
              onChange={(date) => handleInputChange('registrationDate', formatDateForStorage(date))}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select registration date"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              scrollableYearDropdown
              yearDropdownItemNumber={100}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 cursor-pointer ${
                errors.registrationDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isLoading}
              wrapperClassName="w-full"
            />
            <span className="absolute text-gray-500 dark:text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2">
              <CalenderIcon className="size-5" />
            </span>
          </div>
          {errors.registrationDate && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.registrationDate}</p>
          )}
        </div>

        {/* Fitness Date */}
        <div>
          <label htmlFor="fitnessDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fitness Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DatePicker
              selected={parseDate(formData.fitnessDate)}
              onChange={(date) => handleInputChange('fitnessDate', formatDateForStorage(date))}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select fitness date"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              scrollableYearDropdown
              yearDropdownItemNumber={100}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 cursor-pointer ${
                errors.fitnessDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isLoading}
              wrapperClassName="w-full"
            />
            <span className="absolute text-gray-500 dark:text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2">
              <CalenderIcon className="size-5" />
            </span>
          </div>
          {errors.fitnessDate && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fitnessDate}</p>
          )}
        </div>

        {/* Insurance Date */}
        <div>
          <label htmlFor="insuranceDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Insurance Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DatePicker
              selected={parseDate(formData.insuranceDate)}
              onChange={(date) => handleInputChange('insuranceDate', formatDateForStorage(date))}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select insurance date"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              scrollableYearDropdown
              yearDropdownItemNumber={100}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 cursor-pointer ${
                errors.insuranceDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isLoading}
              wrapperClassName="w-full"
            />
            <span className="absolute text-gray-500 dark:text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2">
              <CalenderIcon className="size-5" />
            </span>
          </div>
          {errors.insuranceDate && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.insuranceDate}</p>
          )}
        </div>

        {/* Tax Due Date */}
        <div>
          <label htmlFor="taxDueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tax Due Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DatePicker
              selected={parseDate(formData.taxDueDate)}
              onChange={(date) => handleInputChange('taxDueDate', formatDateForStorage(date))}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select tax due date"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              scrollableYearDropdown
              yearDropdownItemNumber={100}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 cursor-pointer ${
                errors.taxDueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isLoading}
              wrapperClassName="w-full"
            />
            <span className="absolute text-gray-500 dark:text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2">
              <CalenderIcon className="size-5" />
            </span>
          </div>
          {errors.taxDueDate && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.taxDueDate}</p>
          )}
        </div>

        {/* Permit Date */}
        <div>
          <label htmlFor="permitDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Permit Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DatePicker
              selected={parseDate(formData.permitDate)}
              onChange={(date) => handleInputChange('permitDate', formatDateForStorage(date))}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select permit date"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              scrollableYearDropdown
              yearDropdownItemNumber={100}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 cursor-pointer ${
                errors.permitDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isLoading}
              wrapperClassName="w-full"
            />
            <span className="absolute text-gray-500 dark:text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2">
              <CalenderIcon className="size-5" />
            </span>
          </div>
          {errors.permitDate && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.permitDate}</p>
          )}
        </div>

        {/* PUCC Date */}
        <div>
          <label htmlFor="puccDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            PUCC Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DatePicker
              selected={parseDate(formData.puccDate)}
              onChange={(date) => handleInputChange('puccDate', formatDateForStorage(date))}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select PUCC date"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              scrollableYearDropdown
              yearDropdownItemNumber={100}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 cursor-pointer ${
                errors.puccDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isLoading}
              wrapperClassName="w-full"
            />
            <span className="absolute text-gray-500 dark:text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2">
              <CalenderIcon className="size-5" />
            </span>
          </div>
          {errors.puccDate && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.puccDate}</p>
          )}
        </div>

        {/* NP Valid Upto */}
        <div>
          <label htmlFor="npValidUpto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            NP Valid Upto <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DatePicker
              selected={parseDate(formData.npValidUpto)}
              onChange={(date) => handleInputChange('npValidUpto', formatDateForStorage(date))}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select NP valid upto date"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              scrollableYearDropdown
              yearDropdownItemNumber={100}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 cursor-pointer ${
                errors.npValidUpto ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isLoading}
              wrapperClassName="w-full"
            />
            <span className="absolute text-gray-500 dark:text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2">
              <CalenderIcon className="size-5" />
            </span>
          </div>
          {errors.npValidUpto && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.npValidUpto}</p>
          )}
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
              Creating...
            </div>
          ) : (
            'Create Vehicle'
          )}
        </button>
      </div>
    </form>
  );
}
