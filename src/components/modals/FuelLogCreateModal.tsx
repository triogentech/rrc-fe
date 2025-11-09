"use client";
import React, { useState, useEffect } from 'react';
import { fuelLogService, tripService, fuelStationService } from '@/store/api/services';
import { showSuccessToast, showErrorToast } from '@/utils/toastHelper';

interface FuelLogCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FuelLogFormData {
  date: string;
  fuelQuantityInLtr: string;
  fuelType: string;
  rate: string;
  amount: string;
  trip: string;
  fuelStation: string;
}

const FuelLogCreateModal: React.FC<FuelLogCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FuelLogFormData>({
    date: new Date().toISOString().split('T')[0],
    fuelQuantityInLtr: '',
    fuelType: 'diesel',
    rate: '',
    amount: '',
    trip: '',
    fuelStation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trips, setTrips] = useState<Array<{ documentId: string; tripNumber: string }>>([]);
  const [fuelStations, setFuelStations] = useState<Array<{ documentId: string; name: string }>>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  const fetchOptions = async () => {
    setIsLoadingOptions(true);
    try {
      const [tripsResponse, stationsResponse] = await Promise.all([
        tripService.getTrips({ page: 1, limit: 100 }),
        fuelStationService.getFuelStations({ page: 1, limit: 100 }),
      ]);

      let tripsList: Array<{ documentId: string; tripNumber: string }> = [];
      if (tripsResponse.data) {
        const tripsData: Record<string, unknown>[] = Array.isArray(tripsResponse.data) 
          ? tripsResponse.data as Record<string, unknown>[]
          : (((tripsResponse.data as unknown) as Record<string, unknown> & { data?: unknown[] }).data || []) as Record<string, unknown>[];
        tripsList = tripsData.map((t) => ({
          documentId: String(t.documentId || ''),
          tripNumber: String(t.tripNumber || 'N/A'),
        }));
      }

      let stationsList: Array<{ documentId: string; name: string }> = [];
      if (stationsResponse.data) {
        const stationsData: Record<string, unknown>[] = Array.isArray(stationsResponse.data)
          ? stationsResponse.data as Record<string, unknown>[]
          : (((stationsResponse.data as unknown) as Record<string, unknown> & { data?: unknown[] }).data || []) as Record<string, unknown>[];
        stationsList = stationsData.map((s) => ({
          documentId: String(s.documentId || ''),
          name: String(s.name || 'N/A'),
        }));
      }

      setTrips(tripsList);
      setFuelStations(stationsList);
    } catch (error) {
      console.error('Error fetching options:', error);
      showErrorToast('Failed to fetch options');
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleInputChange = (field: keyof FuelLogFormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Calculate amount if rate and quantity are provided
      if (field === 'rate' || field === 'fuelQuantityInLtr') {
        const rate = field === 'rate' ? parseFloat(value) : parseFloat(updated.rate);
        const quantity = field === 'fuelQuantityInLtr' ? parseFloat(value) : parseFloat(updated.fuelQuantityInLtr);
        if (!isNaN(rate) && !isNaN(quantity) && rate > 0 && quantity > 0) {
          updated.amount = (rate * quantity).toFixed(2);
        }
      }
      
      return updated;
    });

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

    if (!formData.date.trim()) {
      newErrors.date = 'Date is required';
    }
    if (!formData.fuelQuantityInLtr.trim() || parseFloat(formData.fuelQuantityInLtr) <= 0) {
      newErrors.fuelQuantityInLtr = 'Valid fuel quantity is required';
    }
    if (!formData.fuelType.trim()) {
      newErrors.fuelType = 'Fuel type is required';
    }
    if (!formData.rate.trim() || parseFloat(formData.rate) <= 0) {
      newErrors.rate = 'Valid rate is required';
    }
    if (!formData.amount.trim() || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
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
        date: formData.date,
        fuelQuantityInLtr: parseFloat(formData.fuelQuantityInLtr),
        fuelType: formData.fuelType,
        rate: parseFloat(formData.rate),
        amount: parseFloat(formData.amount),
      };

      if (formData.trip) {
        logData.trip = formData.trip;
      }
      if (formData.fuelStation) {
        logData.fuelStation = formData.fuelStation;
      }

      await fuelLogService.createFuelLog(logData);
      showSuccessToast('Fuel log created successfully!');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        fuelQuantityInLtr: '',
        fuelType: 'diesel',
        rate: '',
        amount: '',
        trip: '',
        fuelStation: '',
      });
      setErrors({});
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create fuel log:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create fuel log';
      showErrorToast(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        fuelQuantityInLtr: '',
        fuelType: 'diesel',
        rate: '',
        amount: '',
        trip: '',
        fuelStation: '',
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000074] bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Fuel Log</h2>
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
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isSubmitting}
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fuel Quantity (Ltr) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.fuelQuantityInLtr}
                onChange={(e) => handleInputChange('fuelQuantityInLtr', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.fuelQuantityInLtr ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isSubmitting}
                placeholder="0.00"
              />
              {errors.fuelQuantityInLtr && <p className="mt-1 text-sm text-red-600">{errors.fuelQuantityInLtr}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fuel Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.fuelType}
                onChange={(e) => handleInputChange('fuelType', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.fuelType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isSubmitting}
              >
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="cng">CNG</option>
                <option value="electric">Electric</option>
              </select>
              {errors.fuelType && <p className="mt-1 text-sm text-red-600">{errors.fuelType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rate (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => handleInputChange('rate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.rate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isSubmitting}
                placeholder="0.00"
              />
              {errors.rate && <p className="mt-1 text-sm text-red-600">{errors.rate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isSubmitting}
                placeholder="0.00"
              />
              {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trip (Optional)
              </label>
              <select
                value={formData.trip}
                onChange={(e) => handleInputChange('trip', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isSubmitting || isLoadingOptions}
              >
                <option value="">Select a trip (optional)</option>
                {trips.map((trip) => (
                  <option key={trip.documentId} value={trip.documentId}>
                    {trip.tripNumber}
                  </option>
                ))}
              </select>
              {isLoadingOptions && <p className="mt-1 text-sm text-gray-500">Loading trips...</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fuel Station (Optional)
              </label>
              <select
                value={formData.fuelStation}
                onChange={(e) => handleInputChange('fuelStation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isSubmitting || isLoadingOptions}
              >
                <option value="">Select a fuel station (optional)</option>
                {fuelStations.map((station) => (
                  <option key={station.documentId} value={station.documentId}>
                    {station.name}
                  </option>
                ))}
              </select>
              {isLoadingOptions && <p className="mt-1 text-sm text-gray-500">Loading fuel stations...</p>}
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
              {isSubmitting ? 'Creating...' : 'Create Fuel Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FuelLogCreateModal;

