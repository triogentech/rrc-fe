"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTrips } from '@/store/hooks/useTrips';
import { useVehicles } from '@/store/hooks/useVehicles';
import { useTripCreateModal } from '@/hooks/useTripCreateModal';
import TripCreateModal from '@/components/modals/TripCreateModal';
import TripViewModal from '@/components/modals/TripViewModal';
import TripEditModal from '@/components/modals/TripEditModal';
import TripActualEndTimeModal from '@/components/modals/TripActualEndTimeModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import type { Trip } from '@/store/api/types';
import { TripStatus, VehicleCurrentStatus } from '@/store/api/types';
import { EyeIcon, PencilIcon, TrashBinIcon } from '@/icons';
import { getUserDisplayName, getUserEmail } from '@/utils/userDisplay';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/utils/toastHelper';

const TripsPage = () => {
  const searchParams = useSearchParams();
  const {
    trips,
    isLoading,
    error,
    pagination,
    getTrips,
    updateTrip,
    deleteTrip,
    getTripStatusColor,
    formatTripDate,
    clearTripsError,
  } = useTrips();

  const { updateVehicle } = useVehicles();

  const { isOpen, openModal, closeModal, handleSuccess } = useTripCreateModal();
  const [statusFilter, setStatusFilter] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actualEndTimeModalOpen, setActualEndTimeModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingActualEndTime, setIsSettingActualEndTime] = useState(false);

  // Initialize status filter from URL parameters
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
      getTrips({ status: statusFromUrl, page: 1 });
    } else {
      // Default to "in-transit" if no status is specified
      setStatusFilter('in-transit');
      getTrips({ status: 'in-transit', page: 1 });
    }
  }, [searchParams, getTrips]);

  // Filter trips based on status filter
  const filteredTrips = statusFilter 
    ? trips.filter(trip => trip.currentStatus === statusFilter)
    : trips;
  
  // Get page title based on status filter
  const getPageTitle = useCallback(() => {
    switch (statusFilter) {
      case 'created':
        return 'Created Trips';
      case 'in-transit':
        return 'In Transit Trips';
      case 'completed':
        return 'Completed Trips';
      default:
        return 'Trips Management';
    }
  }, [statusFilter]);

  // Get page description based on status filter
  const getPageDescription = useCallback(() => {
    switch (statusFilter) {
      case 'created':
        return 'View and manage all created trips that are ready to begin';
      case 'in-transit':
        return 'Monitor and manage all trips currently in progress';
      case 'completed':
        return 'Review and analyze all completed trips';
      default:
        return 'Manage and view all your trips in one place';
    }
  }, [statusFilter]);

  // Calculate estimated TAT (Turn Around Time) in hours
  const getEstimatedTAT = (trip: Trip): string => {
    // Use totalTripTimeInMinutes if available (more accurate)
    if (trip.totalTripTimeInMinutes && trip.totalTripTimeInMinutes > 0) {
      const hours = trip.totalTripTimeInMinutes / 60;
      return `${Math.round(hours * 10) / 10}h`;
    }
    
    // Fallback to calculating from estimated times
    if (!trip.estimatedStartTime || !trip.estimatedEndTime) {
      return 'N/A';
    }
    
    const startTime = new Date(trip.estimatedStartTime);
    const endTime = new Date(trip.estimatedEndTime);
    const diffInMs = endTime.getTime() - startTime.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    // Always show in hours format with 1 decimal place
    if (diffInHours < 0.1) {
      return '0.1h';
    }
    return `${Math.round(diffInHours * 10) / 10}h`;
  };

  // Calculate running TAT (Turn Around Time) in hours
  const getRunningTAT = (trip: Trip): string => {
    // If trip is completed and has actual end time, calculate from actual end time
    if (trip.currentStatus === 'completed' && trip.actualEndTime) {
      if (!trip.estimatedStartTime || !trip.actualEndTime) {
        return 'N/A';
      }
      
      const startTime = new Date(trip.estimatedStartTime);
      const endTime = new Date(trip.actualEndTime);
      const diffInMs = endTime.getTime() - startTime.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);
      
      // Always show in hours format with 1 decimal place
      if (diffInHours < 0.1) {
        return '0.1h';
      }
      return `${Math.round(diffInHours * 10) / 10}h`;
    }
    
    // If trip is in progress, calculate from current time
    if (trip.currentStatus === 'in-transit' || trip.currentStatus === 'created') {
      if (!trip.estimatedStartTime) {
        return 'N/A';
      }
      
      const startTime = new Date(trip.estimatedStartTime);
      const now = new Date();
      const diffInMs = now.getTime() - startTime.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);
      
      // Always show in hours format with 1 decimal place
      if (diffInHours < 0) {
        return '0.0h'; // Trip hasn't started yet
      }
      if (diffInHours < 0.1) {
        return '0.1h';
      }
      return `${Math.round(diffInHours * 10) / 10}h`;
    }
    
    return 'N/A';
  };


  // Update document title based on current status
  useEffect(() => {
    document.title = `${getPageTitle()} - RRC Trips`;
  }, [getPageTitle]);

  // Force re-render periodically to update running TAT for in-progress trips
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);
  

  // Handle trip creation success
  const handleTripCreated = (trip: Trip) => {
    console.log('Trip created successfully:', trip);
    showSuccessToast(`Trip "${trip.tripNumber}" created successfully!`);
    // Refresh the trips list
    getTrips();
    handleSuccess(trip);
  };

  // Handle view trip
  const handleViewTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setViewModalOpen(true);
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedTrip(null);
  };

  // Handle edit trip
  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setEditModalOpen(true);
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedTrip(null);
  };

  // Handle trip update success
  const handleTripUpdated = (trip: Trip) => {
    console.log('Trip updated successfully:', trip);
    showSuccessToast(`Trip "${trip.tripNumber}" updated successfully!`);
    // Refresh the trips list
    getTrips();
    handleCloseEditModal();
  };

  // Handle delete trip
  const handleDeleteTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setDeleteModalOpen(true);
  };

  // Handle close delete modal
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedTrip(null);
    setIsDeleting(false);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedTrip) return;

    setIsDeleting(true);
    try {
      const success = await deleteTrip(selectedTrip.documentId);
      if (success) {
        console.log('Trip deleted successfully');
        showSuccessToast(`Trip "${selectedTrip.tripNumber}" deleted successfully!`);
        // Refresh the trips list
        getTrips();
        handleCloseDeleteModal();
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      showErrorToast(error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (trip: Trip, newStatus: TripStatus) => {
    try {
      console.log('Updating trip status:', trip.documentId, 'to', newStatus);
      console.log('Current trip data:', trip);
      
      // If changing to completed, show modal to set actual end time
      if (newStatus === 'completed') {
        setSelectedTrip(trip);
        setActualEndTimeModalOpen(true);
        return;
      }
      
      // For other status changes, update directly
      const updateData = {
        currentStatus: newStatus,
        // Include required fields to avoid validation errors
        startPoint: trip.startPoint || '',
        endPoint: trip.endPoint || '',
        totalTripDistanceInKM: trip.totalTripDistanceInKM || 0,
        // Include the new mandatory fields with proper defaults
        totalTripTimeInMinutes: trip.totalTripTimeInMinutes || 0,
        freightTotalAmount: trip.freightTotalAmount || 0,
        advanceAmount: trip.advanceAmount || 0,
      };
      console.log('Update data:', updateData);
      await updateTrip(trip.documentId, updateData);
      console.log('Trip status updated successfully');
      showSuccessToast(`Trip "${trip.tripNumber}" status updated to ${newStatus}!`);
      
      // Update vehicle status based on trip status
      if (trip.vehicle && typeof trip.vehicle === 'object' && trip.vehicle.documentId) {
        let vehicleStatus: VehicleCurrentStatus;
        
        if (newStatus === TripStatus.CREATED) {
          vehicleStatus = VehicleCurrentStatus.ASSIGNED;
        } else if (newStatus === TripStatus.IN_TRANSIT) {
          vehicleStatus = VehicleCurrentStatus.IN_TRANSIT;
        } else if (newStatus === TripStatus.COMPLETED) {
          vehicleStatus = VehicleCurrentStatus.IDLE;
        } else {
          vehicleStatus = trip.vehicle.currentStatus as VehicleCurrentStatus || VehicleCurrentStatus.IDLE;
        }
        
        console.log('Updating vehicle status:', trip.vehicle.documentId, 'to', vehicleStatus);
        
        try {
          await updateVehicle(trip.vehicle.documentId, {
            currentStatus: vehicleStatus,
            // Include required fields to avoid validation errors
            vehicleNumber: trip.vehicle.vehicleNumber || '',
            model: trip.vehicle.model || '',
            type: trip.vehicle.type || 'truck',
            isActive: trip.vehicle.isActive !== false,
            odometerReading: trip.vehicle.odometerReading || '',
            engineNumber: trip.vehicle.engineNumber || '',
            chassisNumber: trip.vehicle.chassisNumber || '',
            typeOfVehicleAxle: trip.vehicle.typeOfVehicleAxle || '',
          });
          console.log('Vehicle status updated successfully');
        } catch (vehicleError) {
          console.error('Error updating vehicle status:', vehicleError);
          
          // Check if it's a validation error and show specific message
          if (vehicleError && typeof vehicleError === 'object' && 'error' in vehicleError) {
            const strapiError = vehicleError as { error?: { name?: string; details?: { errors?: Array<{ path?: string[]; message?: string }> } } };
            if (strapiError.error?.name === 'ValidationError' && strapiError.error?.details?.errors) {
              const validationErrors = strapiError.error.details.errors
                .map((err) => `${err.path?.join('.')}: ${err.message}`)
                .join(', ');
              showWarningToast(`Trip status updated but vehicle validation failed: ${validationErrors}`);
            } else {
              showWarningToast('Trip status updated but failed to update vehicle status');
            }
          } else {
            showWarningToast('Trip status updated but failed to update vehicle status');
          }
          // Don't throw here, as trip was already updated successfully
        }
      }
      
      // Refresh the trips list
      getTrips();
    } catch (error) {
      console.error('Error updating trip status:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check if it's a validation error and show specific message
      if (error && typeof error === 'object' && 'error' in error) {
        const strapiError = error as { error?: { name?: string; details?: { errors?: Array<{ path?: string[]; message?: string }> } } };
        if (strapiError.error?.name === 'ValidationError' && strapiError.error?.details?.errors) {
          const validationErrors = strapiError.error.details.errors
            .map((err) => `${err.path?.join('.')}: ${err.message}`)
            .join(', ');
          showErrorToast(`Validation failed: ${validationErrors}`);
        } else {
          showErrorToast(error);
        }
      } else {
        showErrorToast(error);
      }
    }
  };

  // Handle close actual end time modal
  const handleCloseActualEndTimeModal = () => {
    setActualEndTimeModalOpen(false);
    setSelectedTrip(null);
    setIsSettingActualEndTime(false);
  };

  // Handle confirm actual end time
  const handleConfirmActualEndTime = async (actualEndTime: string) => {
    if (!selectedTrip) return;

    setIsSettingActualEndTime(true);
    try {
      console.log('Setting actual end time for trip:', selectedTrip.documentId, 'to', actualEndTime);
      
      const updateData = {
        currentStatus: 'completed' as TripStatus,
        actualEndTime: actualEndTime,
        // Include required fields to avoid validation errors
        startPoint: selectedTrip.startPoint || '',
        endPoint: selectedTrip.endPoint || '',
        totalTripDistanceInKM: selectedTrip.totalTripDistanceInKM || 0,
        // Include the new mandatory fields with proper defaults
        totalTripTimeInMinutes: selectedTrip.totalTripTimeInMinutes || 0,
        freightTotalAmount: selectedTrip.freightTotalAmount || 0,
        advanceAmount: selectedTrip.advanceAmount || 0,
      };
      
      console.log('Update data:', updateData);
      await updateTrip(selectedTrip.documentId, updateData);
      console.log('Trip completed with actual end time successfully');
      showSuccessToast(`Trip "${selectedTrip.tripNumber}" completed successfully!`);
      
      // Update vehicle status to 'idle' when trip is completed
      if (selectedTrip.vehicle && typeof selectedTrip.vehicle === 'object' && selectedTrip.vehicle.documentId) {
        console.log('Updating vehicle status to idle:', selectedTrip.vehicle.documentId);
        
        try {
          await updateVehicle(selectedTrip.vehicle.documentId, {
            currentStatus: VehicleCurrentStatus.IDLE,
            // Include required fields to avoid validation errors
            vehicleNumber: selectedTrip.vehicle.vehicleNumber || '',
            model: selectedTrip.vehicle.model || '',
            type: selectedTrip.vehicle.type || 'truck',
            isActive: selectedTrip.vehicle.isActive !== false,
            odometerReading: selectedTrip.vehicle.odometerReading || '',
            engineNumber: selectedTrip.vehicle.engineNumber || '',
            chassisNumber: selectedTrip.vehicle.chassisNumber || '',
            typeOfVehicleAxle: selectedTrip.vehicle.typeOfVehicleAxle || '',
          });
          console.log('Vehicle status updated to idle successfully');
        } catch (vehicleError) {
          console.error('Error updating vehicle status to idle:', vehicleError);
          
          // Check if it's a validation error and show specific message
          if (vehicleError && typeof vehicleError === 'object' && 'error' in vehicleError) {
            const strapiError = vehicleError as { error?: { name?: string; details?: { errors?: Array<{ path?: string[]; message?: string }> } } };
            if (strapiError.error?.name === 'ValidationError' && strapiError.error?.details?.errors) {
              const validationErrors = strapiError.error.details.errors
                .map((err) => `${err.path?.join('.')}: ${err.message}`)
                .join(', ');
              showWarningToast(`Trip completed but vehicle validation failed: ${validationErrors}`);
            } else {
              showWarningToast('Trip completed but failed to update vehicle status');
            }
          } else {
            showWarningToast('Trip completed but failed to update vehicle status');
          }
          // Don't throw here, as trip was already updated successfully
        }
      }
      
      // Refresh the trips list
      getTrips();
      handleCloseActualEndTimeModal();
    } catch (error) {
      console.error('Error setting actual end time:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check if it's a validation error and show specific message
      if (error && typeof error === 'object' && 'error' in error) {
        const strapiError = error as { error?: { name?: string; details?: { errors?: Array<{ path?: string[]; message?: string }> } } };
        if (strapiError.error?.name === 'ValidationError' && strapiError.error?.details?.errors) {
          const validationErrors = strapiError.error.details.errors
            .map((err) => `${err.path?.join('.')}: ${err.message}`)
            .join(', ');
          showErrorToast(`Validation failed: ${validationErrors}`);
        } else {
          showErrorToast(error);
        }
      } else {
        showErrorToast(error);
      }
    } finally {
      setIsSettingActualEndTime(false);
    }
  };

  const renderAllTrips = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{getPageTitle()} Overview</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Trip Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Trip From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Distance (KM)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Trip To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Advance Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  TAT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actual End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Running TAT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Logistics Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Updated By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTrips.map((trip) => (
                <tr key={trip.documentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {/* 1. Vehicle */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.vehicle ? (
                        typeof trip.vehicle === 'string' ? (
                          <span className="text-gray-500 dark:text-gray-400">Loading...</span>
                        ) : (
                          <div>
                            <div className="font-medium">{trip.vehicle.vehicleNumber}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {trip.vehicle.model} • {trip.vehicle.type}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Status: <span className={`font-medium ${trip.vehicle.currentStatus === 'idle' ? 'text-green-600' : trip.vehicle.currentStatus === 'assigned' ? 'text-yellow-600' : 'text-red-600'}`}>
                                {trip.vehicle.currentStatus}
                              </span>
                            </div>
                          </div>
                        )
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">No vehicle assigned</span>
                      )}
                    </div>
                  </td>
                  {/* 2. Trip Number */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {trip.tripNumber}
                    </div>
                  </td>
                  {/* 3. Trip From */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                    {trip.startPoint ? (
                          <div className="font-medium">{trip.startPoint}</div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
                  {/* 4. Distance (KM) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.totalTripDistanceInKM ? `${trip.totalTripDistanceInKM} km` : 'N/A'}
                    </div>
                  </td>
                  {/* 5. Trip To */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                    {trip.endPoint ? (
                      <div className="font-medium">{trip.endPoint}</div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
                  {/* 6. Start Time */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatTripDate(trip.estimatedStartTime)}
                    </div>
                  </td>
                  {/* 7. End Time */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatTripDate(trip.estimatedEndTime)}
                    </div>
                  </td>
                  {/* 8. Advance Amount */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {trip.advanceAmount ? `₹${trip.advanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                    </div>
                  </td>
                  {/* 9. Est. TAT in Hours */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {getEstimatedTAT(trip)}
                    </div>
                  </td>
                  {/* 10. Actual End Time */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.actualEndTime ? formatTripDate(trip.actualEndTime) : 'N/A'}
                    </div>
                  </td>
                  {/* 11. Running TAT in Hours */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {getRunningTAT(trip)}
                    </div>
                  </td>
                  {/* 12. Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={trip.currentStatus}
                      onChange={(e) => handleStatusChange(trip, e.target.value as TripStatus)}
                    disabled={trip.currentStatus === 'completed'}
                    className={`text-xs font-semibold rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-blue-500 ${getTripStatusColor(trip.currentStatus)} ${
                      trip.currentStatus === 'completed' ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    >
                      <option value="created">Created</option>
                      <option value="in-transit">In Transit</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  {/* 13. Driver */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.driver ? (
                        typeof trip.driver === 'string' ? (
                          <span className="text-gray-500 dark:text-gray-400">Loading...</span>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                {trip.driver.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{trip.driver.fullName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {trip.driver.countryDialCode} {trip.driver.contactNumber}
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">No driver assigned</span>
                      )}
                    </div>
                  </td>
                  {/* 14. Logistics Provider */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.logisticsProvider ? (
                        typeof trip.logisticsProvider === 'string' ? (
                          <span className="text-gray-500 dark:text-gray-400">Loading...</span>
                        ) : (
                          <div>
                            <div className="font-medium">{trip.logisticsProvider.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {trip.logisticsProvider.contactNumber}
                            </div>
                          </div>
                        )
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">No provider assigned</span>
                      )}
                    </div>
                  </td>
                  {/* 15. Created By */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.cstmCreatedBy ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {getUserDisplayName(trip.cstmCreatedBy)}
                          </span>
                          {getUserEmail(trip.cstmCreatedBy) && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getUserEmail(trip.cstmCreatedBy)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
                  {/* 16. Updated By */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.cstmUpdatedBy ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {getUserDisplayName(trip.cstmUpdatedBy)}
                          </span>
                          {getUserEmail(trip.cstmUpdatedBy) && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getUserEmail(trip.cstmUpdatedBy)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
                  {/* 17. Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewTrip(trip)}
                        className="p-2 text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                        title="View Trip"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditTrip(trip)}
                        className="p-2 text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                        title="Edit Trip"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTrip(trip)}
                        className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Trip"
                      >
                        <TrashBinIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pageCount > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => getTrips({ page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {pagination.pageCount}
              </span>
              <button
                onClick={() => getTrips({ page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pageCount}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );



  const renderContent = () => {
        return renderAllTrips();
  };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Header Section */}
      <div className="col-span-12">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getPageTitle()}</h1>
            </div>
          <p className="text-gray-600 dark:text-gray-400">{getPageDescription()}</p>
        </div>

        {/* Add Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={openModal}
            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add New Trip
          </button>
        </div>


        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={clearTripsError}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading trips...</span>
          </div>
        )}

      </div>

      {/* Content Section */}
      <div className="col-span-12">
        {renderContent()}
      </div>

      {/* Modals */}
      <TripCreateModal
        isOpen={isOpen}
        onClose={closeModal}
        onSuccess={handleTripCreated}
      />

      <TripViewModal
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        trip={selectedTrip}
      />

      <TripEditModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        trip={selectedTrip}
        onSuccess={handleTripUpdated}
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Trip"
        message={`Are you sure you want to delete trip "${selectedTrip?.tripNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />

      <TripActualEndTimeModal
        isOpen={actualEndTimeModalOpen}
        onClose={handleCloseActualEndTimeModal}
        onConfirm={handleConfirmActualEndTime}
        trip={selectedTrip}
        isLoading={isSettingActualEndTime}
      />
    </div>
  );
};

export default TripsPage;
