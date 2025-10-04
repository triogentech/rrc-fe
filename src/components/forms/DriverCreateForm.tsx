"use client";
import React, { useState, useEffect } from 'react';
import { useDrivers } from '@/store/hooks/useDrivers';
import { useReduxAuth } from '@/store/hooks/useReduxAuth';
import { useAadhaarValidation } from '@/hooks/useAadhaarValidation';
import type { DriverCreateRequest, Driver } from '@/store/api/types';
import { showSuccessToast, showErrorToast } from '@/utils/toastHelper';

interface DriverCreateFormProps {
  onSuccess?: (driver: Driver) => void;
  onCancel?: () => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  totalSteps: number;
}

export default function DriverCreateForm({ onSuccess, onCancel, currentStep, onStepChange, totalSteps }: DriverCreateFormProps) {
  const { createDriver, isLoading } = useDrivers();
  const { user } = useReduxAuth();
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
    // New fields
    drivingLicenceNumber: '',
    accountHolderName: '',
    accountNumber: '',
    branchName: '',
    ifscCode: '',
    accountType: '',
    // User creation fields
    username: '',
    email: '',
    password: '',
    confirmed: true,
    blocked: false,
    role: 'Driver',
    // Custom fields
    cstmCreatedBy: user?.documentId || user?.id || '',
    cstmUpdatedBy: user?.documentId || user?.id || '',
  });

  const [errors, setErrors] = useState<Partial<DriverCreateRequest>>({});

  // Aadhaar validation hook
  const { 
    isValid: isAadhaarValid, 
    isChecking: isCheckingAadhaar, 
    isUsed: isAadhaarUsed, 
    existingDriver,
    error: aadhaarError, 
    validateAadhaar,
    clearValidation: clearAadhaarValidation,
    formatNumber: formatAadhaarNumber
  } = useAadhaarValidation({
    enableRealTimeCheck: true,
    debounceDelay: 800
  });
  
  // Trigger Aadhaar validation when aadhaarNumber changes
  useEffect(() => {
    if (formData.aadhaarNumber && formData.aadhaarNumber.trim().length >= 12) {
      validateAadhaar(formData.aadhaarNumber);
    } else if (formData.aadhaarNumber.trim().length === 0) {
      clearAadhaarValidation();
    }
  }, [formData.aadhaarNumber, validateAadhaar, clearAadhaarValidation]);

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

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<DriverCreateRequest> = {};

    if (step === 1) {
      // Basic Information validation
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }
      if (!formData.contactNumber.trim()) {
        newErrors.contactNumber = 'Contact number is required';
      } else if (!/^\d{10}$/.test(formData.contactNumber.replace(/\D/g, ''))) {
        newErrors.contactNumber = 'Contact number must be exactly 10 digits';
      } else if (!/^[6-9]\d{9}$/.test(formData.contactNumber.replace(/\D/g, ''))) {
        newErrors.contactNumber = 'Contact number must start with 6, 7, 8, or 9';
      }
      if (!formData.emgContactNumber.trim()) {
        newErrors.emgContactNumber = 'Emergency contact number is required';
      } else if (!/^\d{10}$/.test(formData.emgContactNumber.replace(/\D/g, ''))) {
        newErrors.emgContactNumber = 'Emergency contact number must be exactly 10 digits';
      } else if (!/^[6-9]\d{9}$/.test(formData.emgContactNumber.replace(/\D/g, ''))) {
        newErrors.emgContactNumber = 'Emergency contact number must start with 6, 7, 8, or 9';
      }
      if (!formData.aadhaarNumber.trim()) {
        newErrors.aadhaarNumber = 'Aadhaar number is required';
      } else if (!/^\d{12}$/.test(formData.aadhaarNumber.replace(/\D/g, ''))) {
        newErrors.aadhaarNumber = 'Aadhaar number must be 12 digits';
      } else if (aadhaarError) {
        newErrors.aadhaarNumber = aadhaarError;
      } else if (isAadhaarUsed) {
        newErrors.aadhaarNumber = 'This Aadhaar card is already registered with another driver';
      }
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      }
      if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
        newErrors.panNumber = 'PAN number must be in valid format (e.g., ABCDE1234F)';
      }
    } else if (step === 2) {
      // User Account validation
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
    } else if (step === 3) {
      // Banking Details validation
      if (formData.drivingLicenceNumber && !/^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/.test(formData.drivingLicenceNumber)) {
        newErrors.drivingLicenceNumber = 'Driving license number must be in valid format (e.g., DL01234567890123)';
      }
      if (formData.accountNumber && !/^\d{9,18}$/.test(formData.accountNumber)) {
        newErrors.accountNumber = 'Account number must be 9-18 digits';
      }
      if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
        newErrors.ifscCode = 'IFSC code must be in valid format (e.g., SBIN0001234)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    onStepChange(currentStep - 1);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) { // Validate the current (last) step before submission
      showErrorToast('Please fill in all required fields correctly');
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
        // Custom fields
        cstmCreatedBy: formData.cstmCreatedBy,
        cstmUpdatedBy: formData.cstmUpdatedBy,
        // Only include optional fields if they have values
        ...(formData.panNumber?.trim() && { panNumber: formData.panNumber.trim() }),
        ...(formData.reference?.trim() && { reference: formData.reference.trim() }),
        ...(formData.drivingLicenceNumber?.trim() && { drivingLicenceNumber: formData.drivingLicenceNumber.trim() }),
        ...(formData.accountHolderName?.trim() && { accountHolderName: formData.accountHolderName.trim() }),
        ...(formData.accountNumber?.trim() && { accountNumber: formData.accountNumber.trim() }),
        ...(formData.branchName?.trim() && { branchName: formData.branchName.trim() }),
        ...(formData.ifscCode?.trim() && { ifscCode: formData.ifscCode.trim() }),
        ...(formData.accountType?.trim() && { accountType: formData.accountType.trim() }),
      };

      console.log('Submitting driver data:', cleanedData);

      const newDriver = await createDriver(cleanedData);
      if (newDriver) {
        showSuccessToast(`Driver "${newDriver.fullName}" created successfully!`);
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
          // New fields
          drivingLicenceNumber: '',
          accountHolderName: '',
          accountNumber: '',
          branchName: '',
          ifscCode: '',
          accountType: '',
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
      showErrorToast(error);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
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
              disabled={isLoading}
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
              onChange={(e) => {
                // Only allow digits and limit to 10 characters
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleInputChange('contactNumber', value);
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.contactNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter 10-digit contact number"
              disabled={isLoading}
              maxLength={10}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must start with 6, 7, 8, or 9
            </p>
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
              onChange={(e) => {
                // Only allow digits and limit to 10 characters
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleInputChange('emgContactNumber', value);
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.emgContactNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter 10-digit emergency contact number"
              disabled={isLoading}
              maxLength={10}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must start with 6, 7, 8, or 9
            </p>
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.panNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter PAN number"
              disabled={isLoading}
            />
            {errors.panNumber && (
              <p className="mt-1 text-sm text-red-500">{errors.panNumber}</p>
            )}
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
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">


          {/* Aadhaar Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Aadhaar Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.aadhaarNumber}
                onChange={(e) => {
                  // Only allow digits and limit to 12 characters
                  const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                  handleInputChange('aadhaarNumber', value);
                }}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.aadhaarNumber ? 'border-red-500' : 
                  isAadhaarValid && formData.aadhaarNumber.length === 12 ? 'border-green-500' :
                  'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter 12-digit Aadhaar number"
                disabled={isLoading}
                maxLength={12}
              />
              {/* Validation Status Icon */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {isCheckingAadhaar && (
                  <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {!isCheckingAadhaar && formData.aadhaarNumber.length === 12 && (
                  <>
                    {isAadhaarValid && !isAadhaarUsed && (
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                    {(aadhaarError || isAadhaarUsed) && (
                      <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Validation Messages */}
            {errors.aadhaarNumber && (
              <p className="mt-1 text-sm text-red-500">{errors.aadhaarNumber}</p>
            )}
            {!errors.aadhaarNumber && isAadhaarValid && !isAadhaarUsed && formData.aadhaarNumber.length === 12 && (
              <p className="mt-1 text-sm text-green-600">✓ Aadhaar number is valid and available</p>
            )}
            {existingDriver && (
              <p className="mt-1 text-sm text-red-500">
                This Aadhaar is already registered with {existingDriver.fullName} ({existingDriver.contactNumber})
              </p>
            )}
            {formData.aadhaarNumber.length > 0 && formData.aadhaarNumber.length < 12 && (
              <p className="mt-1 text-sm text-gray-500">
                {12 - formData.aadhaarNumber.length} more digits required
              </p>
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
              disabled={isLoading}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-500">{errors.address}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Username and Email */}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Right Column - Password */}
        <div className="space-y-4">
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
                disabled={isLoading}
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
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - License Details */}
        <div className="space-y-4">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">License Information</h5>
          
          {/* Driving License Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Driving License Number
            </label>
            <input
              type="text"
              value={formData.drivingLicenceNumber}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                handleInputChange('drivingLicenceNumber', value);
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.drivingLicenceNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter driving license number"
              disabled={isLoading}
              maxLength={15}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Format: DL01234567890123 (15 characters)
            </p>
            {errors.drivingLicenceNumber && (
              <p className="mt-1 text-sm text-red-500">{errors.drivingLicenceNumber}</p>
            )}
          </div>
        </div>

        {/* Right Column - Banking Details */}
        <div className="space-y-4">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Banking Information</h5>
          
          {/* Account Holder Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Holder Name
            </label>
            <input
              type="text"
              value={formData.accountHolderName}
              onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter account holder name"
              disabled={isLoading}
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 18);
                handleInputChange('accountNumber', value);
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.accountNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter account number"
              disabled={isLoading}
              maxLength={18}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              9-18 digits
            </p>
            {errors.accountNumber && (
              <p className="mt-1 text-sm text-red-500">{errors.accountNumber}</p>
            )}
          </div>

          {/* Branch Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Branch Name
            </label>
            <input
              type="text"
              value={formData.branchName}
              onChange={(e) => handleInputChange('branchName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter branch name"
              disabled={isLoading}
            />
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              IFSC Code
            </label>
            <input
              type="text"
              value={formData.ifscCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                handleInputChange('ifscCode', value);
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.ifscCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter IFSC code"
              disabled={isLoading}
              maxLength={11}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Format: SBIN0001234 (11 characters)
            </p>
            {errors.ifscCode && (
              <p className="mt-1 text-sm text-red-500">{errors.ifscCode}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Type
            </label>
            <select
              value={formData.accountType}
              onChange={(e) => handleInputChange('accountType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            >
              <option value="">Select account type</option>
              <option value="savings">Savings</option>
              <option value="current">Current</option>
              <option value="salary">Salary</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Review Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Basic Information</h5>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Full Name:</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.fullName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Contact:</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  +91 {formData.contactNumber}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Emergency Contact:</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  +91 {formData.emgContactNumber}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Aadhaar Number:</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatAadhaarNumber(formData.aadhaarNumber)}
                  {isAadhaarValid && !isAadhaarUsed && (
                    <span className="ml-2 text-green-600">✓ Verified</span>
                  )}
                </p>
              </div>
              {formData.panNumber && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">PAN Number:</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.panNumber}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Address:</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.address}</p>
              </div>
              {formData.reference && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Reference:</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.reference}</p>
                </div>
              )}
            </div>
          </div>

          {/* User Account */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">User Account</h5>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Username:</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.username}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Role:</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.role}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formData.confirmed ? 'Confirmed' : 'Not Confirmed'} • {formData.blocked ? 'Blocked' : 'Active'}
                </p>
              </div>
            </div>
          </div>

          {/* Banking & License Details */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Banking & License</h5>
            <div className="space-y-2">
              {formData.drivingLicenceNumber && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Driving License:</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.drivingLicenceNumber}</p>
                </div>
              )}
              {formData.accountHolderName && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Account Holder:</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.accountHolderName}</p>
                </div>
              )}
              {formData.accountNumber && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Account Number:</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.accountNumber}</p>
                </div>
              )}
              {formData.branchName && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Branch:</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.branchName}</p>
                </div>
              )}
              {formData.ifscCode && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">IFSC Code:</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.ifscCode}</p>
                </div>
              )}
              {formData.accountType && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Account Type:</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{formData.accountType}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {renderStepContent()}

      {/* Form Actions */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <div>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              Previous
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
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
                'Create Driver'
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
