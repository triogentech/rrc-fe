"use client";
import React, { useState, useEffect } from 'react';
import { cityService } from '@/store/api/services';
import type { City } from '@/store/api/types';
import { showSuccessToast, showErrorToast } from '@/utils/toastHelper';

interface CityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: City | null;
  onSuccess: () => void;
}

interface CityFormData {
  name: string;
  cityCode: string;
  state: string;
  stateCode: string;
  country: string;
  countryISOCode: string;
}

const CityEditModal: React.FC<CityEditModalProps> = ({
  isOpen,
  onClose,
  city,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CityFormData>({
    name: '',
    cityCode: '',
    state: '',
    stateCode: '',
    country: '',
    countryISOCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when modal opens or city changes
  useEffect(() => {
    if (isOpen && city) {
      setFormData({
        name: city.name || '',
        cityCode: city.cityCode || '',
        state: city.state || '',
        stateCode: city.stateCode || '',
        country: city.country || '',
        countryISOCode: city.countryISOCode || '',
      });
      setErrors({});
    }
  }, [isOpen, city]);

  const handleInputChange = (field: keyof CityFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'City name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!city) return;

    if (!validateForm()) {
      showErrorToast('Please fill in all required fields correctly');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare data - only send non-empty optional fields
      const cityData: {
        name: string;
        cityCode?: string;
        state?: string;
        stateCode?: string;
        country?: string;
        countryISOCode?: string;
      } = {
        name: formData.name.trim(),
      };

      if (formData.cityCode.trim()) {
        cityData.cityCode = formData.cityCode.trim();
      }
      if (formData.state.trim()) {
        cityData.state = formData.state.trim();
      }
      if (formData.stateCode.trim()) {
        cityData.stateCode = formData.stateCode.trim();
      }
      if (formData.country.trim()) {
        cityData.country = formData.country.trim();
      }
      if (formData.countryISOCode.trim()) {
        cityData.countryISOCode = formData.countryISOCode.trim();
      }

      await cityService.updateCity(city.documentId, cityData);
      showSuccessToast(`City "${formData.name}" updated successfully!`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update city:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update city';
      showErrorToast(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({});
      onClose();
    }
  };

  if (!isOpen || !city) return null;

  return (
    <div className="fixed inset-0 bg-[#00000074] bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit City
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* City Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter city name"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* City Code */}
            <div>
              <label htmlFor="cityCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City Code
              </label>
              <input
                type="text"
                id="cityCode"
                value={formData.cityCode}
                onChange={(e) => handleInputChange('cityCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter city code"
                disabled={isSubmitting}
              />
            </div>

            {/* State and State Code in a row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter state"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="stateCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State Code
                </label>
                <input
                  type="text"
                  id="stateCode"
                  value={formData.stateCode}
                  onChange={(e) => handleInputChange('stateCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter state code"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Country and Country ISO Code in a row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter country"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="countryISOCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Country ISO Code
                </label>
                <input
                  type="text"
                  id="countryISOCode"
                  value={formData.countryISOCode}
                  onChange={(e) => handleInputChange('countryISOCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter country ISO code (e.g., IN)"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                'Update City'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CityEditModal;

