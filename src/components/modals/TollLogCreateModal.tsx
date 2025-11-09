"use client";
import React, { useState } from 'react';
import { tollLogService } from '@/store/api/services';
import { showSuccessToast, showErrorToast } from '@/utils/toastHelper';

interface TollLogCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TollLogFormData {
  totalTollAmount: string;
  numberOfTollCrosses: string;
}

const TollLogCreateModal: React.FC<TollLogCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<TollLogFormData>({
    totalTollAmount: '',
    numberOfTollCrosses: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof TollLogFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    if (!formData.totalTollAmount.trim() || parseFloat(formData.totalTollAmount) <= 0) {
      newErrors.totalTollAmount = 'Valid toll amount is required';
    }
    if (!formData.numberOfTollCrosses.trim() || parseInt(formData.numberOfTollCrosses) <= 0) {
      newErrors.numberOfTollCrosses = 'Valid number of toll crosses is required';
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

    setIsSubmitting(true);
    try {
      const logData: Record<string, unknown> = {
        totalTollAmount: parseFloat(formData.totalTollAmount),
        numberOfTollCrosses: parseInt(formData.numberOfTollCrosses),
      };

      await tollLogService.createTollLog(logData);
      showSuccessToast('Toll log created successfully!');
      setFormData({
        totalTollAmount: '',
        numberOfTollCrosses: '',
      });
      setErrors({});
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create toll log:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create toll log';
      showErrorToast(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        totalTollAmount: '',
        numberOfTollCrosses: '',
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000074] bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Toll Log</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total Toll Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.totalTollAmount}
              onChange={(e) => handleInputChange('totalTollAmount', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.totalTollAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isSubmitting}
              placeholder="0.00"
            />
            {errors.totalTollAmount && <p className="mt-1 text-sm text-red-600">{errors.totalTollAmount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Toll Crosses <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.numberOfTollCrosses}
              onChange={(e) => handleInputChange('numberOfTollCrosses', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.numberOfTollCrosses ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isSubmitting}
              placeholder="0"
              min="1"
            />
            {errors.numberOfTollCrosses && <p className="mt-1 text-sm text-red-600">{errors.numberOfTollCrosses}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Toll Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TollLogCreateModal;

