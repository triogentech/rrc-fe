"use client";
import React, { useState, useEffect } from 'react';
import { garageLogService, garageService } from '@/store/api/services';
import { useVehicles } from '@/store/hooks/useVehicles';
import { useReduxAuth } from '@/store/hooks/useReduxAuth';
import { api } from '@/store/api/baseApi';
import type { Vehicle, GarageLog } from '@/store/api/types';
import { showSuccessToast, showErrorToast } from '@/utils/toastHelper';

interface GarageLogEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  garageLog: GarageLog & Record<string, unknown> | null;
  onSuccess: () => void;
}

interface GarageLogFormData {
  invoiceDate: string;
  invoiceTime: string;
  particular: string;
  invoiceRaisedAmount: string;
  invoicePassedAmount: string;
  invoiceDoc: File | null;
  vehicle: string;
  garage: string;
}

const GarageLogEditModal: React.FC<GarageLogEditModalProps> = ({
  isOpen,
  onClose,
  garageLog,
  onSuccess,
}) => {
  const { user } = useReduxAuth();
  const { vehicles, getVehicles, isLoading: vehiclesLoading } = useVehicles();
  
  const [formData, setFormData] = useState<GarageLogFormData>({
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceTime: new Date().toTimeString().slice(0, 5),
    particular: '',
    invoiceRaisedAmount: '0',
    invoicePassedAmount: '0',
    invoiceDoc: null,
    vehicle: '',
    garage: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [garages, setGarages] = useState<Array<{ documentId: string; name: string }>>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');

  // Initialize form data when garageLog changes
  useEffect(() => {
    if (garageLog && isOpen) {
      const logData = garageLog as Record<string, unknown>;
      
      // Format invoice date and time
      let dateValue = '';
      let timeValue = '';
      if (logData.invoiceDate) {
        const invoiceDate = typeof logData.invoiceDate === 'string' ? new Date(logData.invoiceDate) : logData.invoiceDate as Date;
        if (!isNaN(invoiceDate.getTime())) {
          dateValue = invoiceDate.toISOString().split('T')[0];
          timeValue = invoiceDate.toTimeString().slice(0, 5);
        }
      }

      // Get garage documentId
      let garageValue = '';
      if (logData.garage && typeof logData.garage === 'object') {
        const garageObj = logData.garage as Record<string, unknown>;
        garageValue = String(garageObj.documentId || '');
      } else if (logData.garage) {
        garageValue = String(logData.garage);
      }

      // Get vehicle documentId
      let vehicleValue = '';
      if (logData.vehicle && typeof logData.vehicle === 'object') {
        const vehicleObj = logData.vehicle as Record<string, unknown>;
        vehicleValue = String(vehicleObj.documentId || '');
      } else if (logData.vehicle) {
        vehicleValue = String(logData.vehicle);
      }

      setFormData({
        invoiceDate: dateValue || new Date().toISOString().split('T')[0],
        invoiceTime: timeValue || new Date().toTimeString().slice(0, 5),
        particular: String(logData.particular || ''),
        invoiceRaisedAmount: String(logData.invoiceRaisedAmount || '0'),
        invoicePassedAmount: String(logData.invoicePassedAmount || '0'),
        invoiceDoc: null, // Don't pre-populate file input
        vehicle: vehicleValue,
        garage: garageValue,
      });

      fetchOptions();
      // Fetch vehicles when modal opens
      getVehicles({ page: 1, limit: 100, active: true });
    }
  }, [garageLog, isOpen, getVehicles]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        isVehicleDropdownOpen &&
        !target.closest('#vehicleDropdown') &&
        !target.closest('#vehicleDropdownButton')
      ) {
        setIsVehicleDropdownOpen(false);
        setVehicleSearchQuery('');
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVehicleDropdownOpen) {
        setIsVehicleDropdownOpen(false);
        setVehicleSearchQuery('');
      }
    };

    if (isVehicleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVehicleDropdownOpen]);

  // Process vehicles when they change
  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      const filteredVehicles = vehicles.filter((vehicle: Vehicle) => 
        vehicle.isActive !== false
      );
      setAvailableVehicles(filteredVehicles);
    }
  }, [vehicles]);

  // Debounced search for vehicles
  useEffect(() => {
    if (!isVehicleDropdownOpen || !vehicleSearchQuery.trim()) {
      return;
    }

    const searchVehicles = async () => {
      try {
        await getVehicles({
          page: 1,
          limit: 100,
          active: true,
          search: vehicleSearchQuery.trim(),
        });
      } catch (error) {
        console.error('Error searching vehicles:', error);
      }
    };

    const timeoutId = setTimeout(() => {
      searchVehicles();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [vehicleSearchQuery, isVehicleDropdownOpen, getVehicles]);

  const fetchOptions = async () => {
    setIsLoadingOptions(true);
    try {
      const garagesResponse = await garageService.getGarages({ page: 1, limit: 100 });

      let garagesList: Array<{ documentId: string; name: string }> = [];
      if (garagesResponse.data) {
        const garagesData: Record<string, unknown>[] = Array.isArray(garagesResponse.data)
          ? garagesResponse.data as Record<string, unknown>[]
          : (((garagesResponse.data as unknown) as Record<string, unknown> & { data?: unknown[] }).data || []) as Record<string, unknown>[];
        garagesList = garagesData.map((g) => ({
          documentId: String(g.documentId || ''),
          name: String(g.name || 'N/A'),
        }));
      }

      setGarages(garagesList);
    } catch (error) {
      console.error('Error fetching options:', error);
      showErrorToast('Failed to fetch options');
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleInputChange = (field: keyof GarageLogFormData, value: string | File | null) => {
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

    if (!formData.invoiceDate.trim()) {
      newErrors.invoiceDate = 'Invoice date is required';
    }
    if (!formData.particular.trim()) {
      newErrors.particular = 'Particular is required';
    }
    if (!formData.invoiceRaisedAmount.trim() || parseFloat(formData.invoiceRaisedAmount) < 0) {
      newErrors.invoiceRaisedAmount = 'Valid invoice raised amount is required';
    }
    if (!formData.invoicePassedAmount.trim() || parseFloat(formData.invoicePassedAmount) < 0) {
      newErrors.invoicePassedAmount = 'Valid invoice passed amount is required';
    }
    if (!formData.garage.trim()) {
      newErrors.garage = 'Garage is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !garageLog) {
      showErrorToast('Please fill in all required fields correctly');
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine date and time into ISO string
      const invoiceDateTime = new Date(`${formData.invoiceDate}T${formData.invoiceTime}`);
      
      const logData: Record<string, unknown> = {
        invoiceDate: invoiceDateTime.toISOString(),
        particular: formData.particular.trim(),
        invoiceRaisedAmount: parseFloat(formData.invoiceRaisedAmount),
        invoicePassedAmount: parseFloat(formData.invoicePassedAmount),
      };

      // Add relations
      if (formData.garage) {
        logData.garage = formData.garage;
      }
      if (formData.vehicle) {
        logData.vehicle = formData.vehicle;
      } else {
        // If vehicle is cleared, set to null
        logData.vehicle = null;
      }

      // Auto-set user fields for update
      const userId = user?.documentId || user?.id;
      if (userId) {
        logData.cstmUpdatedBy = userId;
        logData.lastUpdatedBy = userId;
      }

      // Handle file upload if present
      if (formData.invoiceDoc) {
        try {
          // Upload file to Strapi media library
          const uploadFormData = new FormData();
          uploadFormData.append('files', formData.invoiceDoc);
          
          const uploadResponse = await api.post<Array<{ id?: number; documentId?: string }>>('/api/upload', uploadFormData);

          if (uploadResponse.data && Array.isArray(uploadResponse.data) && uploadResponse.data.length > 0) {
            const uploadedFile = uploadResponse.data[0];
            const fileId = uploadedFile.documentId || uploadedFile.id;
            if (fileId) {
              logData.invoiceDoc = fileId;
              console.log('File uploaded successfully, file ID:', fileId);
            }
          }
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          const uploadErrorMessage = uploadError instanceof Error ? uploadError.message : 'Failed to upload invoice document';
          showErrorToast(`Failed to upload invoice document: ${uploadErrorMessage}`);
          setIsSubmitting(false);
          return;
        }
      }

      const logId = (garageLog as Record<string, unknown>).documentId || (garageLog as Record<string, unknown>).id;
      await garageLogService.updateGarageLog(String(logId), logData);
      showSuccessToast('Garage log updated successfully!');
      setErrors({});
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update garage log:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update garage log';
      showErrorToast(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({});
      setIsVehicleDropdownOpen(false);
      setVehicleSearchQuery('');
      onClose();
    }
  };

  if (!isOpen || !garageLog) return null;

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-2xl mx-auto">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Garage Log</h2>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Invoice Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Invoice Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        errors.invoiceDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      disabled={isSubmitting}
                    />
                    {errors.invoiceDate && <p className="mt-1 text-sm text-red-600">{errors.invoiceDate}</p>}
                  </div>

                  {/* Invoice Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Invoice Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.invoiceTime}
                      onChange={(e) => handleInputChange('invoiceTime', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        errors.invoiceTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      disabled={isSubmitting}
                    />
                    {errors.invoiceTime && <p className="mt-1 text-sm text-red-600">{errors.invoiceTime}</p>}
                  </div>

                  {/* Particular */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Particular <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.particular}
                      onChange={(e) => handleInputChange('particular', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        errors.particular ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      disabled={isSubmitting}
                      placeholder="Enter particular details"
                    />
                    {errors.particular && <p className="mt-1 text-sm text-red-600">{errors.particular}</p>}
                  </div>

                  {/* Invoice Raised Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Invoice Raised Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.invoiceRaisedAmount}
                      onChange={(e) => handleInputChange('invoiceRaisedAmount', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        errors.invoiceRaisedAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      disabled={isSubmitting}
                      placeholder="0.00"
                      min="0"
                    />
                    {errors.invoiceRaisedAmount && <p className="mt-1 text-sm text-red-600">{errors.invoiceRaisedAmount}</p>}
                  </div>

                  {/* Invoice Passed Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Invoice Passed Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.invoicePassedAmount}
                      onChange={(e) => handleInputChange('invoicePassedAmount', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        errors.invoicePassedAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      disabled={isSubmitting}
                      placeholder="0.00"
                      min="0"
                    />
                    {errors.invoicePassedAmount && <p className="mt-1 text-sm text-red-600">{errors.invoicePassedAmount}</p>}
                  </div>

                  {/* Garage Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Garage <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.garage}
                      onChange={(e) => handleInputChange('garage', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        errors.garage ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      disabled={isSubmitting || isLoadingOptions}
                    >
                      <option value="">Select a garage</option>
                      {garages.map((garage) => (
                        <option key={garage.documentId} value={garage.documentId}>
                          {garage.name}
                        </option>
                      ))}
                    </select>
                    {errors.garage && <p className="mt-1 text-sm text-red-600">{errors.garage}</p>}
                    {isLoadingOptions && <p className="mt-1 text-sm text-gray-500">Loading garages...</p>}
                  </div>

                  {/* Vehicle Selection with Search */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vehicle (Optional)
                    </label>
                    
                    {/* Dropdown Button */}
                    <button
                      id="vehicleDropdownButton"
                      type="button"
                      onClick={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
                      className={`w-full px-3 py-2 text-left border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white flex items-center justify-between ${
                        errors.vehicle ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } ${isSubmitting || vehiclesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isSubmitting || vehiclesLoading}
                    >
                      <span className={formData.vehicle ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                        {(() => {
                          if (!formData.vehicle) return 'Select a vehicle (optional)';
                          const selectedVehicle = availableVehicles.find(v => v.documentId === formData.vehicle);
                          return selectedVehicle 
                            ? `${selectedVehicle.vehicleNumber} - ${selectedVehicle.model}`
                            : 'Select a vehicle (optional)';
                        })()}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${isVehicleDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isVehicleDropdownOpen && (
                      <div
                        id="vehicleDropdown"
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-700 dark:border-gray-600"
                      >
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <svg
                                className="w-4 h-4 text-gray-500 dark:text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                            <input
                              type="text"
                              value={vehicleSearchQuery}
                              onChange={(e) => setVehicleSearchQuery(e.target.value)}
                              className="block w-full pl-10 pr-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                              placeholder="Search vehicles..."
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Vehicle List */}
                        <div className="max-h-60 overflow-y-auto">
                          {vehiclesLoading && availableVehicles.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                              Loading vehicles...
                            </div>
                          ) : (() => {
                            if (availableVehicles.length === 0) {
                              return (
                                <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                  {vehicleSearchQuery ? 'No vehicles found matching your search' : 'No available vehicles found'}
                                </div>
                              );
                            }

                            return (
                              <ul className="p-2 text-sm text-gray-700 dark:text-gray-200">
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleInputChange('vehicle', '');
                                      setIsVehicleDropdownOpen(false);
                                      setVehicleSearchQuery('');
                                    }}
                                    className={`inline-flex items-center w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 ${
                                      !formData.vehicle
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-700 dark:text-gray-200'
                                    }`}
                                  >
                                    <span className="font-medium">None (Optional)</span>
                                  </button>
                                </li>
                                {availableVehicles.map((vehicle) => (
                                  <li key={vehicle.documentId}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleInputChange('vehicle', vehicle.documentId);
                                        setIsVehicleDropdownOpen(false);
                                        setVehicleSearchQuery('');
                                      }}
                                      className={`inline-flex items-center w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 ${
                                        formData.vehicle === vehicle.documentId
                                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                          : 'text-gray-700 dark:text-gray-200'
                                      }`}
                                    >
                                      <div className="flex flex-col items-start">
                                        <span className="font-medium">
                                          {vehicle.vehicleNumber} - {vehicle.model}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {vehicle.type} • {vehicle.currentStatus}
                                        </span>
                                      </div>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                    {errors.vehicle && <p className="mt-1 text-sm text-red-600">{errors.vehicle}</p>}
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
                    {isSubmitting ? 'Updating...' : 'Update Garage Log'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GarageLogEditModal;

