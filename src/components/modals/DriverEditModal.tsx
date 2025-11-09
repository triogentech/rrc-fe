"use client";
import React, { useEffect, useState } from 'react';
import { useDrivers } from '@/store/hooks/useDrivers';
import { useReduxAuth } from '@/store/hooks/useReduxAuth';
import type { Driver, DriverUpdateRequest } from '@/store/api/types';

interface DriverEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
  onSuccess?: (driver: Driver) => void;
}

export default function DriverEditModal({ isOpen, onClose, driver, onSuccess }: DriverEditModalProps) {
  const { updateDriver, isLoading } = useDrivers();
  const { user } = useReduxAuth();
  
  const [formData, setFormData] = useState<DriverUpdateRequest>({
    fullName: '',
    countryDialCode: '+91',
    contactNumber: '',
    emgCountryDialCode: '+91',
    emgContactNumber: '',
    aadhaarNumber: '',
    panNumber: '',
    address: '',
    reference: '',
    licenseNumber: '',
    licenseExpiry: '',
    dateOfBirth: '',
    bloodGroup: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    isActive: true,
    // New banking and license fields
    currentStatus: '',
    drivingLicenceNumber: '',
    accountHolderName: '',
    accountNumber: '',
    branchName: '',
    ifscCode: '',
    accountType: '',
    // Custom fields
    cstmCreatedBy: '',
    cstmUpdatedBy: user?.documentId || user?.id || '',
  });

  const [errors, setErrors] = useState<Partial<DriverUpdateRequest>>({});

  // Initialize form data when driver changes
  useEffect(() => {
    if (driver) {
      setFormData({
        fullName: driver.fullName || '',
        countryDialCode: driver.countryDialCode || '+91',
        contactNumber: driver.contactNumber || '',
        emgCountryDialCode: driver.emgCountryDialCode || '+91',
        emgContactNumber: driver.emgContactNumber || '',
        aadhaarNumber: driver.aadhaarNumber || '',
        panNumber: driver.panNumber || '',
        address: driver.address || '',
        reference: driver.reference || '',
        licenseNumber: driver.licenseNumber || '',
        licenseExpiry: driver.licenseExpiry || '',
        dateOfBirth: driver.dateOfBirth || '',
        bloodGroup: driver.bloodGroup || '',
        emergencyContactName: driver.emergencyContactName || '',
        emergencyContactRelation: driver.emergencyContactRelation || '',
        isActive: driver.isActive ?? true,
        // New banking and license fields
        currentStatus: driver.currentStatus || '',
        drivingLicenceNumber: driver.drivingLicenceNumber || '',
        accountHolderName: driver.accountHolderName || '',
        accountNumber: driver.accountNumber || '',
        branchName: driver.branchName || '',
        ifscCode: driver.ifscCode || '',
        accountType: driver.accountType || '',
        // Custom fields
        cstmCreatedBy: typeof driver.cstmCreatedBy === 'string' ? driver.cstmCreatedBy : driver.cstmCreatedBy?.documentId || '',
        cstmUpdatedBy: user?.documentId || user?.id || '',
      });
    }
  }, [driver, user]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !driver) return null;

  const handleInputChange = (field: keyof DriverUpdateRequest, value: string | boolean) => {
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
    const newErrors: Partial<DriverUpdateRequest> = {};

    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.contactNumber?.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    }

    if (!formData.emgContactNumber?.trim()) {
      newErrors.emgContactNumber = 'Emergency contact number is required';
    }

    if (!formData.aadhaarNumber?.trim()) {
      newErrors.aadhaarNumber = 'Aadhaar number is required';
    }

    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required';
    }

    // New field validations
    if (formData.drivingLicenceNumber && !formData.drivingLicenceNumber.trim()) {
      newErrors.drivingLicenceNumber = 'Driving license number is required';
    }

    if (formData.accountNumber && !formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    }

    if (formData.ifscCode && !formData.ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
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
      const cleanedData: DriverUpdateRequest = {
        fullName: formData.fullName?.trim(),
        countryDialCode: formData.countryDialCode?.trim(),
        contactNumber: formData.contactNumber?.trim(),
        emgCountryDialCode: formData.emgCountryDialCode?.trim(),
        emgContactNumber: formData.emgContactNumber?.trim(),
        aadhaarNumber: formData.aadhaarNumber?.trim(),
        address: formData.address?.trim(),
        // Custom fields
        cstmUpdatedBy: formData.cstmUpdatedBy,
      };

      // Only include optional fields if they have values
      if (formData.panNumber?.trim()) {
        cleanedData.panNumber = formData.panNumber.trim();
      }
      if (formData.reference?.trim()) {
        cleanedData.reference = formData.reference.trim();
      }
      if (formData.licenseNumber?.trim()) {
        cleanedData.licenseNumber = formData.licenseNumber.trim();
      }
      if (formData.licenseExpiry?.trim()) {
        cleanedData.licenseExpiry = formData.licenseExpiry.trim();
      }
      if (formData.dateOfBirth?.trim()) {
        cleanedData.dateOfBirth = formData.dateOfBirth.trim();
      }
      if (formData.bloodGroup?.trim()) {
        cleanedData.bloodGroup = formData.bloodGroup.trim();
      }
      if (formData.emergencyContactName?.trim()) {
        cleanedData.emergencyContactName = formData.emergencyContactName.trim();
      }
      if (formData.emergencyContactRelation?.trim()) {
        cleanedData.emergencyContactRelation = formData.emergencyContactRelation.trim();
      }
      // New banking and license fields
      if (formData.drivingLicenceNumber?.trim()) {
        cleanedData.drivingLicenceNumber = formData.drivingLicenceNumber.trim();
      }
      if (formData.accountHolderName?.trim()) {
        cleanedData.accountHolderName = formData.accountHolderName.trim();
      }
      if (formData.accountNumber?.trim()) {
        cleanedData.accountNumber = formData.accountNumber.trim();
      }
      if (formData.branchName?.trim()) {
        cleanedData.branchName = formData.branchName.trim();
      }
      if (formData.ifscCode?.trim()) {
        cleanedData.ifscCode = formData.ifscCode.trim();
      }
      if (formData.accountType?.trim()) {
        cleanedData.accountType = formData.accountType.trim();
      }

      console.log('Updating driver data:', cleanedData);

      const updatedDriver = await updateDriver(driver.documentId, cleanedData);
      if (updatedDriver) {
        onSuccess?.(updatedDriver);
        onClose();
      }
    } catch (error) {
      console.error('Failed to update driver:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto">
      {/* Backdrop that covers the entire screen including header */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-4xl mx-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Edit Driver
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Update the driver information below. Fields marked with * are required.
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

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.isActive ? 'active' : 'inactive'}
                      onChange={(e) => handleInputChange('isActive', e.target.value === 'active')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Driving License Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Driving License Number
                    </label>
                    <input
                      type="text"
                      value={formData.drivingLicenceNumber}
                      onChange={(e) => handleInputChange('drivingLicenceNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.drivingLicenceNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter driving license number"
                    />
                    {errors.drivingLicenceNumber && (
                      <p className="mt-1 text-sm text-red-500">{errors.drivingLicenceNumber}</p>
                    )}
                  </div>

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
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.accountNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter account number"
                    />
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
                      onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.ifscCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter IFSC code"
                    />
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
                    >
                      <option value="">Select account type</option>
                      <option value="savings">Savings</option>
                      <option value="current">Current</option>
                      <option value="salary">Salary</option>
                    </select>
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
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Updating...' : 'Update Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
