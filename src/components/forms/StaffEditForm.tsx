"use client";
import React, { useState } from 'react';
import { useStaff } from '@/store/hooks/useStaff';
import type { Staff, StaffUpdateRequest } from '@/store/api/types';

interface StaffEditFormProps {
  staff: Staff;
  onSuccess: (staff: Staff) => void;
  onCancel: () => void;
}

export default function StaffEditForm({ staff, onSuccess, onCancel }: StaffEditFormProps) {
  const { updateStaff, isLoading } = useStaff();

  const [formData, setFormData] = useState<StaffUpdateRequest>({
    id: staff.id,
    fullName: staff.fullName,
    countryDialCode: staff.countryDialCode,
    contactNumber: staff.contactNumber,
  });

  const [errors, setErrors] = useState<Partial<StaffUpdateRequest>>({});

  const handleInputChange = (field: keyof StaffUpdateRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<StaffUpdateRequest> = {};

    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.countryDialCode?.trim()) {
      newErrors.countryDialCode = 'Country dial code is required';
    }

    if (!formData.contactNumber?.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.contactNumber || '')) {
      newErrors.contactNumber = 'Contact number must be 10 digits';
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
      const result = await updateStaff(staff.documentId, formData);
      if (result) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Error updating staff member:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="fullName"
            value={formData.fullName || ''}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.fullName
                ? 'border-red-500 dark:border-red-400'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter full name"
            disabled={isLoading}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>
          )}
        </div>

        {/* Country Dial Code */}
        <div>
          <label htmlFor="countryDialCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Country Dial Code *
          </label>
          <select
            id="countryDialCode"
            value={formData.countryDialCode || ''}
            onChange={(e) => handleInputChange('countryDialCode', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.countryDialCode
                ? 'border-red-500 dark:border-red-400'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isLoading}
          >
            <option value="+91">+91 (India)</option>
            <option value="+1">+1 (USA)</option>
            <option value="+44">+44 (UK)</option>
            <option value="+86">+86 (China)</option>
            <option value="+81">+81 (Japan)</option>
            <option value="+49">+49 (Germany)</option>
            <option value="+33">+33 (France)</option>
            <option value="+61">+61 (Australia)</option>
          </select>
          {errors.countryDialCode && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.countryDialCode}</p>
          )}
        </div>

        {/* Contact Number */}
        <div className="md:col-span-2">
          <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Contact Number *
          </label>
          <input
            type="tel"
            id="contactNumber"
            value={formData.contactNumber || ''}
            onChange={(e) => handleInputChange('contactNumber', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.contactNumber
                ? 'border-red-500 dark:border-red-400'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter 10-digit contact number"
            maxLength={10}
            disabled={isLoading}
          />
          {errors.contactNumber && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contactNumber}</p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
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
              Updating...
            </span>
          ) : (
            'Update Staff Member'
          )}
        </button>
      </div>
    </form>
  );
}
