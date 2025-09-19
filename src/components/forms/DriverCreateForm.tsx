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
    // User creation fields
    username: '',
    email: '',
    password: '',
    confirmed: true,
    blocked: false,
    role: 'Driver',
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

    // User validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
        // User fields
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmed: formData.confirmed,
        blocked: formData.blocked,
        role: formData.role,
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
          // User fields
          username: '',
          email: '',
          password: '',
          confirmed: true,
          blocked: false,
          role: 'Driver',
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

        {/* User Creation Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Account Creation
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Create a user account for this driver to access the system.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - User Fields */}
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter username"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">min. 3 characters</p>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter email address"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">min. 6 characters</p>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10 ${
                      errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">min. 6 characters</p>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>
            </div>

            {/* Right Column - Status Fields */}
            <div className="space-y-4">
              {/* Confirmed Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmed
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="confirmed"
                      checked={formData.confirmed === true}
                      onChange={() => setFormData(prev => ({ ...prev, confirmed: true }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">TRUE</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="confirmed"
                      checked={formData.confirmed === false}
                      onChange={() => setFormData(prev => ({ ...prev, confirmed: false }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">FALSE</span>
                  </label>
                </div>
              </div>

              {/* Blocked Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Blocked
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="blocked"
                      checked={formData.blocked === false}
                      onChange={() => setFormData(prev => ({ ...prev, blocked: false }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">FALSE</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="blocked"
                      checked={formData.blocked === true}
                      onChange={() => setFormData(prev => ({ ...prev, blocked: true }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">TRUE</span>
                  </label>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="Driver">Driver</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default role is set to Driver</p>
              </div>
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
