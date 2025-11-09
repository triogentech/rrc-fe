"use client";
import React, { useState, useEffect } from 'react';
import { tyreLogService } from '@/store/api/services';
import { vehicleService } from '@/store/api/services';
import { showSuccessToast, showErrorToast } from '@/utils/toastHelper';

interface TyreLogCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TyreLogFormData {
  tyreNumber: string;
  fitmentDate: string;
  fitmentKM: string;
  brand: string;
  tyrePosition: string;
  removalTyreNumber: string;
  removalKM: string;
  removalReason: string;
  vehicle: string;
}

const TyreLogCreateModal: React.FC<TyreLogCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<TyreLogFormData>({
    tyreNumber: '',
    fitmentDate: new Date().toISOString().split('T')[0],
    fitmentKM: '',
    brand: '',
    tyrePosition: 'front',
    removalTyreNumber: '',
    removalKM: '',
    removalReason: '',
    vehicle: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<Array<{ documentId: string; vehicleNumber: string }>>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
    }
  }, [isOpen]);

  const fetchVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      const response = await vehicleService.getVehicles({ page: 1, limit: 100 });
      let vehiclesList: Array<{ documentId: string; vehicleNumber: string }> = [];
      if (response.data) {
        const vehiclesData: Record<string, unknown>[] = Array.isArray(response.data)
          ? response.data as Record<string, unknown>[]
          : (((response.data as unknown) as Record<string, unknown> & { data?: unknown[] }).data || []) as Record<string, unknown>[];
        vehiclesList = vehiclesData.map((v) => ({
          documentId: String(v.documentId || ''),
          vehicleNumber: String(v.vehicleNumber || 'N/A'),
        }));
      }
      setVehicles(vehiclesList);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showErrorToast('Failed to fetch vehicles');
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleInputChange = (field: keyof TyreLogFormData, value: string) => {
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
    if (!formData.tyreNumber.trim()) {
      newErrors.tyreNumber = 'Tyre number is required';
    }
    if (!formData.fitmentDate.trim()) {
      newErrors.fitmentDate = 'Fitment date is required';
    }
    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }
    if (!formData.vehicle.trim()) {
      newErrors.vehicle = 'Vehicle is required';
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
        tyreNumber: formData.tyreNumber.trim(),
        fitmentDate: formData.fitmentDate,
        fitmentKM: formData.fitmentKM ? parseInt(formData.fitmentKM) : undefined,
        brand: formData.brand.trim(),
        tyrePosition: formData.tyrePosition,
        removalTyreNumber: formData.removalTyreNumber.trim() || undefined,
        removalKM: formData.removalKM ? parseInt(formData.removalKM) : undefined,
        removalReason: formData.removalReason.trim() || undefined,
        vehicle: formData.vehicle,
      };

      await tyreLogService.createTyreLog(logData);
      showSuccessToast('Tyre log created successfully!');
      setFormData({
        tyreNumber: '',
        fitmentDate: new Date().toISOString().split('T')[0],
        fitmentKM: '',
        brand: '',
        tyrePosition: 'front',
        removalTyreNumber: '',
        removalKM: '',
        removalReason: '',
        vehicle: '',
      });
      setErrors({});
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create tyre log:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create tyre log';
      showErrorToast(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        tyreNumber: '',
        fitmentDate: new Date().toISOString().split('T')[0],
        fitmentKM: '',
        brand: '',
        tyrePosition: 'front',
        removalTyreNumber: '',
        removalKM: '',
        removalReason: '',
        vehicle: '',
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000074] bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Tyre Log</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tyre Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.tyreNumber}
                onChange={(e) => handleInputChange('tyreNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.tyreNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isSubmitting}
              />
              {errors.tyreNumber && <p className="mt-1 text-sm text-red-600">{errors.tyreNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fitment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.fitmentDate}
                onChange={(e) => handleInputChange('fitmentDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.fitmentDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isSubmitting}
              />
              {errors.fitmentDate && <p className="mt-1 text-sm text-red-600">{errors.fitmentDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fitment KM
              </label>
              <input
                type="number"
                value={formData.fitmentKM}
                onChange={(e) => handleInputChange('fitmentKM', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isSubmitting}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Brand <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.brand ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isSubmitting}
              />
              {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Position
              </label>
              <select
                value={formData.tyrePosition}
                onChange={(e) => handleInputChange('tyrePosition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isSubmitting}
              >
                <option value="front">Front</option>
                <option value="rear">Rear</option>
                <option value="spare">Spare</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vehicle <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vehicle}
                onChange={(e) => handleInputChange('vehicle', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.vehicle ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isSubmitting || isLoadingVehicles}
              >
                <option value="">Select a vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.documentId} value={vehicle.documentId}>
                    {vehicle.vehicleNumber}
                  </option>
                ))}
              </select>
              {errors.vehicle && <p className="mt-1 text-sm text-red-600">{errors.vehicle}</p>}
              {isLoadingVehicles && <p className="mt-1 text-sm text-gray-500">Loading vehicles...</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Removal Tyre Number
              </label>
              <input
                type="text"
                value={formData.removalTyreNumber}
                onChange={(e) => handleInputChange('removalTyreNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Removal KM
              </label>
              <input
                type="number"
                value={formData.removalKM}
                onChange={(e) => handleInputChange('removalKM', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isSubmitting}
                placeholder="0"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Removal Reason
              </label>
              <textarea
                value={formData.removalReason}
                onChange={(e) => handleInputChange('removalReason', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isSubmitting}
                rows={3}
              />
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Tyre Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TyreLogCreateModal;

