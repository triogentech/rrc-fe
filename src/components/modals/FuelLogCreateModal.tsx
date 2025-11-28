"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { fuelLogService, tripService, fuelStationService } from '@/store/api/services';
import { useVehicles } from '@/store/hooks/useVehicles';
import type { Vehicle } from '@/store/api/types';
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
  vehicle: string;
}

const FuelLogCreateModal: React.FC<FuelLogCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { vehicles, getVehicles, isLoading: vehiclesLoading, pagination } = useVehicles();
  
  const [formData, setFormData] = useState<FuelLogFormData>({
    date: new Date().toISOString().split('T')[0],
    fuelQuantityInLtr: '',
    fuelType: 'diesel',
    rate: '',
    amount: '',
    trip: '',
    fuelStation: '',
    vehicle: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trips, setTrips] = useState<Array<{ documentId: string; tripNumber: string }>>([]);
  const [fuelStations, setFuelStations] = useState<Array<{ documentId: string; name: string }>>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Vehicle dropdown search state
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [vehiclePageSize, setVehiclePageSize] = useState(10);
  const [isLoadingMoreVehicles, setIsLoadingMoreVehicles] = useState(false);
  const [hasMoreVehicles, setHasMoreVehicles] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      // Fetch vehicles when modal opens
      getVehicles({ page: 1, limit: 10, active: true });
    }
  }, [isOpen, getVehicles]);

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
      
      if (isLoadingMoreVehicles) {
        setAvailableVehicles(prev => {
          const existingIds = new Set(prev.map(v => v.documentId));
          const newVehicles = filteredVehicles.filter(v => !existingIds.has(v.documentId));
          const updated = [...prev, ...newVehicles];
          
          if (pagination) {
            setHasMoreVehicles(updated.length < pagination.total);
          }
          
          return updated;
        });
        setIsLoadingMoreVehicles(false);
      } else {
        setAvailableVehicles(filteredVehicles);
        
        if (pagination) {
          setHasMoreVehicles(filteredVehicles.length < pagination.total);
        }
      }
    } else if (vehicles && vehicles.length === 0 && !isLoadingMoreVehicles) {
      setAvailableVehicles([]);
      setHasMoreVehicles(false);
    }
  }, [vehicles, pagination, isLoadingMoreVehicles]);

  // Fetch vehicles when dropdown opens
  useEffect(() => {
    if (!isVehicleDropdownOpen) {
      return;
    }

    const fetchVehiclesOnOpen = async () => {
      try {
        setVehiclePageSize(10);
        setHasMoreVehicles(true);
        
        await getVehicles({
          page: 1,
          limit: 10,
          active: true,
        });
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };

    fetchVehiclesOnOpen();
  }, [isVehicleDropdownOpen, getVehicles]);

  // Reset search query when dropdown closes
  useEffect(() => {
    if (!isVehicleDropdownOpen && vehicleSearchQuery) {
      setVehicleSearchQuery('');
    }
  }, [isVehicleDropdownOpen, vehicleSearchQuery]);

  // Debounced search for vehicles
  useEffect(() => {
    if (!isVehicleDropdownOpen || !vehicleSearchQuery.trim()) {
      return;
    }

    const searchVehicles = async () => {
      try {
        setVehiclePageSize(10);
        setHasMoreVehicles(true);
        
        await getVehicles({
          page: 1,
          limit: 10,
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

  // Load more vehicles when scrolling
  const loadMoreVehicles = useCallback(async () => {
    if (isLoadingMoreVehicles || !hasMoreVehicles || vehiclesLoading) {
      return;
    }

    setIsLoadingMoreVehicles(true);
    const newPageSize = vehiclePageSize + 5;
    setVehiclePageSize(newPageSize);

    try {
      const searchParams: { 
        page?: number; 
        limit?: number; 
        search?: string;
        active?: boolean;
      } = {
        page: 1,
        limit: newPageSize,
        active: true,
      };

      if (vehicleSearchQuery.trim()) {
        searchParams.search = vehicleSearchQuery.trim();
      }

      await getVehicles(searchParams);
    } catch (error) {
      console.error('Error loading more vehicles:', error);
      setIsLoadingMoreVehicles(false);
    }
  }, [vehiclePageSize, hasMoreVehicles, isLoadingMoreVehicles, vehiclesLoading, vehicleSearchQuery, getVehicles]);

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
      if (formData.vehicle) {
        logData.vehicle = formData.vehicle;
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
        vehicle: '',
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
        vehicle: '',
      });
      setErrors({});
      setIsVehicleDropdownOpen(false);
      setVehicleSearchQuery('');
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
                  <div 
                    className="max-h-60 overflow-y-auto"
                    onScroll={(e) => {
                      const target = e.target as HTMLElement;
                      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                      if (scrollBottom < 50 && hasMoreVehicles && !isLoadingMoreVehicles && !vehiclesLoading) {
                        loadMoreVehicles();
                      }
                    }}
                  >
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
                        <>
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
                                {!formData.vehicle && (
                                  <svg
                                    className="w-4 h-4 ml-auto"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
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
                                      {vehicle.chassisNumber && ` • ${vehicle.chassisNumber}`}
                                    </span>
                                  </div>
                                  {formData.vehicle === vehicle.documentId && (
                                    <svg
                                      className="w-4 h-4 ml-auto"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </button>
                              </li>
                ))}
                          </ul>
                          {isLoadingMoreVehicles && (
                            <div className="p-3 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <svg className="animate-spin h-4 w-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Loading more vehicles...</span>
                            </div>
                          )}
                          {!hasMoreVehicles && availableVehicles.length > 0 && !isLoadingMoreVehicles && (
                            <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                              No more vehicles to load
                            </div>
                          )}
                        </>
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
              {isSubmitting ? 'Creating...' : 'Create Fuel Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FuelLogCreateModal;

