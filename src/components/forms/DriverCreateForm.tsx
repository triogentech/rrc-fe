"use client";
import React, { useState } from 'react';
import { useDrivers } from '@/store/hooks/useDrivers';
import type { DriverCreateRequest, Driver } from '@/store/api/types';

interface DriverCreateFormProps {
  onSuccess?: (driver: Driver) => void;
  onCancel?: () => void;
}

export default function DriverCreateForm({ onSuccess, onCancel }: DriverCreateFormProps) {
  const { createDriver, isLoading } = useDrivers();
  
  const [formData, setFormData] = useState<DriverCreateRequest>({
    fullName: '',
    countryDialCode: '+91',
    contactNumber: '',
    emgCountryDialCode: '+91',
    emgContactNumber: '',
    aadhaarNumber: '',
    panNumber: '',
    address: '',
    reference: '',
  });

  const [errors, setErrors] = useState<Partial<DriverCreateRequest>>({});

  const handleInputChange = (field: keyof DriverCreateRequest, value: string) => {
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
    const newErrors: Partial<DriverCreateRequest> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    }

    if (!formData.emgContactNumber.trim()) {
      newErrors.emgContactNumber = 'Emergency contact number is required';
    }

    if (!formData.aadhaarNumber.trim()) {
      newErrors.aadhaarNumber = 'Aadhaar number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Additional validation
    if (formData.contactNumber && !/^\d{10}$/.test(formData.contactNumber.replace(/\D/g, ''))) {
      newErrors.contactNumber = 'Contact number must be 10 digits';
    }

    if (formData.emgContactNumber && !/^\d{10}$/.test(formData.emgContactNumber.replace(/\D/g, ''))) {
      newErrors.emgContactNumber = 'Emergency contact number must be 10 digits';
    }

    if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber.replace(/\D/g, ''))) {
      newErrors.aadhaarNumber = 'Aadhaar number must be 12 digits';
    }

    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      newErrors.panNumber = 'PAN number must be in valid format (e.g., ABCDE1234F)';
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
      const cleanedData: DriverCreateRequest = {
        fullName: formData.fullName.trim(),
        countryDialCode: formData.countryDialCode.trim(),
        contactNumber: formData.contactNumber.trim(),
        emgCountryDialCode: formData.emgCountryDialCode.trim(),
        emgContactNumber: formData.emgContactNumber.trim(),
        aadhaarNumber: formData.aadhaarNumber.trim(),
        address: formData.address.trim(),
        // Only include optional fields if they have values
        ...(formData.panNumber?.trim() && { panNumber: formData.panNumber.trim() }),
        ...(formData.reference?.trim() && { reference: formData.reference.trim() }),
      };

      console.log('Submitting driver data:', cleanedData);

      const newDriver = await createDriver(cleanedData);
      if (newDriver) {
        onSuccess?.(newDriver);
        // Reset form
        setFormData({
          fullName: '',
          countryDialCode: '+91',
          contactNumber: '',
          emgCountryDialCode: '+91',
          emgContactNumber: '',
          aadhaarNumber: '',
          panNumber: '',
          address: '',
          reference: '',
        });
      }
    } catch (error) {
      console.error('Failed to create driver:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Add New Driver
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Fill in the driver information below. Fields marked with * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.contactNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter contact number"
              />
              {errors.contactNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.contactNumber}</p>
              )}
            </div>

            {/* Emergency Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emergency Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.emgContactNumber}
                onChange={(e) => handleInputChange('emgContactNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.emgContactNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter emergency contact number"
              />
              {errors.emgContactNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.emgContactNumber}</p>
              )}
            </div>

            {/* PAN Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PAN Number
              </label>
              <input
                type="text"
                value={formData.panNumber}
                onChange={(e) => handleInputChange('panNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter PAN number"
              />
            </div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter reference"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Country Dial Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country Dial Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.countryDialCode}
                onChange={(e) => handleInputChange('countryDialCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="+91"
              />
            </div>

            {/* Emergency Country Dial Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emergency Country Dial Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.emgCountryDialCode}
                onChange={(e) => handleInputChange('emgCountryDialCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="+91"
              />
            </div>

            {/* Aadhaar Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Aadhaar Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.aadhaarNumber}
                onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.aadhaarNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter Aadhaar number"
              />
              {errors.aadhaarNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.aadhaarNumber}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none ${
                  errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter address"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Driver'}
          </button>
        </div>
      </form>
    </div>
  );
}
