"use client";
import React, { useState, useEffect } from 'react';
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

const TripsPage = () => {
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
    getTripDuration,
    isTripActive,
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
  const [activeTab, setActiveTab] = useState("all");

  // Fetch trips on component mount
  useEffect(() => {
    getTrips();
  }, [getTrips]);

  // Filter trips based on active tab and status filter
  const filteredTrips = statusFilter 
    ? trips.filter(trip => trip.currentStatus === statusFilter)
    : trips;
  
  const upcomingTrips = statusFilter 
    ? filteredTrips.filter(trip => isTripActive(trip))
    : trips.filter(trip => isTripActive(trip));
  const pastTrips = statusFilter 
    ? filteredTrips.filter(trip => trip.currentStatus === 'completed')
    : trips.filter(trip => trip.currentStatus === 'completed');
  const allTrips = filteredTrips;

  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    if (status) {
      getTrips({ status, page: 1 });
    } else {
      getTrips({ page: 1 });
    }
  };

  // Handle clear filter
  const handleClearFilter = () => {
    setStatusFilter('');
    getTrips({ page: 1 });
  };

  // Handle trip creation success
  const handleTripCreated = (trip: Trip) => {
    console.log('Trip created successfully:', trip);
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
        // Refresh the trips list
        getTrips();
        handleCloseDeleteModal();
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
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
      };
      console.log('Update data:', updateData);
      await updateTrip(trip.documentId, updateData);
      console.log('Trip status updated successfully');
      
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
          });
          console.log('Vehicle status updated successfully');
        } catch (vehicleError) {
          console.error('Error updating vehicle status:', vehicleError);
          // Don't throw here, as trip was already updated successfully
        }
      }
      
      // Refresh the trips list
      getTrips();
    } catch (error) {
      console.error('Error updating trip status:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
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
      };
      
      console.log('Update data:', updateData);
      await updateTrip(selectedTrip.documentId, updateData);
      console.log('Trip completed with actual end time successfully');
      
      // Update vehicle status to 'idle' when trip is completed
      if (selectedTrip.vehicle && typeof selectedTrip.vehicle === 'object' && selectedTrip.vehicle.documentId) {
        console.log('Updating vehicle status to idle:', selectedTrip.vehicle.documentId);
        
        try {
          await updateVehicle(selectedTrip.vehicle.documentId, {
            currentStatus: VehicleCurrentStatus.IDLE,
          });
          console.log('Vehicle status updated to idle successfully');
        } catch (vehicleError) {
          console.error('Error updating vehicle status to idle:', vehicleError);
          // Don't throw here, as trip was already updated successfully
        }
      }
      
      // Refresh the trips list
      getTrips();
      handleCloseActualEndTimeModal();
    } catch (error) {
      console.error('Error setting actual end time:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } finally {
      setIsSettingActualEndTime(false);
    }
  };

  const renderAllTrips = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Trips Overview</h2>
          <button 
            onClick={openModal}
            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add New Trip
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Trip Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Start Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                End Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Distance (KM)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Logistics Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actual End Time
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
            {allTrips.map((trip) => (
              <tr key={trip.documentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {trip.tripNumber}
                  </div>
                </td>
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatTripDate(trip.estimatedStartTime)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatTripDate(trip.estimatedEndTime)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {getTripDuration(trip)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {trip.totalTripDistanceInKM ? `${trip.totalTripDistanceInKM} km` : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {trip.startPoint && trip.endPoint ? (
                      <div>
                        <div className="font-medium">{trip.startPoint}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">→ {trip.endPoint}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">N/A</span>
                    )}
                  </div>
                </td>
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={trip.currentStatus}
                    onChange={(e) => handleStatusChange(trip, e.target.value as TripStatus)}
                    className={`text-xs font-semibold rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-blue-500 ${getTripStatusColor(trip.currentStatus)}`}
                  >
                    <option value="created">Created</option>
                    <option value="in-transit">In Transit</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {trip.actualEndTime ? formatTripDate(trip.actualEndTime) : 'N/A'}
                  </div>
                </td>
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

  const renderUpcomingTrips = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Trips</h2>
            <button 
              onClick={openModal}
              className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add New Trip
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Trip Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Distance (KM)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Logistics Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actual End Time
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
              {upcomingTrips.map((trip) => (
                <tr key={trip.documentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {trip.tripNumber}
                    </div>
                  </td>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatTripDate(trip.estimatedStartTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatTripDate(trip.estimatedEndTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {getTripDuration(trip)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.totalTripDistanceInKM ? `${trip.totalTripDistanceInKM} km` : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.startPoint && trip.endPoint ? (
                        <div>
                          <div className="font-medium">{trip.startPoint}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">→ {trip.endPoint}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={trip.currentStatus}
                      onChange={(e) => handleStatusChange(trip, e.target.value as TripStatus)}
                      className={`text-xs font-semibold rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-blue-500 ${getTripStatusColor(trip.currentStatus)}`}
                    >
                      <option value="created">Created</option>
                      <option value="in-transit">In Transit</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.actualEndTime ? formatTripDate(trip.actualEndTime) : 'N/A'}
                    </div>
                  </td>
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
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Trips Summary</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{upcomingTrips.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Trips</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {upcomingTrips.filter(trip => trip.currentStatus === 'created').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {upcomingTrips.filter(trip => trip.currentStatus === 'in-transit').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Ongoing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {upcomingTrips.filter(trip => trip.currentStatus === 'completed').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
            </div>
          </div>
        </div>
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

  const renderPastTrips = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Past Trips</h2>
            <button 
              onClick={openModal}
              className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add New Trip
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Trip Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Distance (KM)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Logistics Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actual End Time
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
              {pastTrips.map((trip) => (
                <tr key={trip.documentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {trip.tripNumber}
                    </div>
                  </td>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatTripDate(trip.estimatedStartTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatTripDate(trip.estimatedEndTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {getTripDuration(trip)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.totalTripDistanceInKM ? `${trip.totalTripDistanceInKM} km` : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.startPoint && trip.endPoint ? (
                        <div>
                          <div className="font-medium">{trip.startPoint}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">→ {trip.endPoint}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={trip.currentStatus}
                      onChange={(e) => handleStatusChange(trip, e.target.value as TripStatus)}
                      className={`text-xs font-semibold rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-blue-500 ${getTripStatusColor(trip.currentStatus)}`}
                    >
                      <option value="created">Created</option>
                      <option value="in-transit">In Transit</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.actualEndTime ? formatTripDate(trip.actualEndTime) : 'N/A'}
                    </div>
                  </td>
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
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Past Trips Summary</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {pastTrips.filter(trip => trip.currentStatus === 'completed').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {pastTrips.filter(trip => trip.currentStatus === 'in-transit').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Ongoing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {pastTrips.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Past Trips</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {pastTrips.filter(trip => trip.actualEndTime).length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">With Actual End Time</div>
            </div>
          </div>
        </div>
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
    switch (activeTab) {
      case "all":
        return renderAllTrips();
      case "upcoming":
        return renderUpcomingTrips();
      case "past":
        return renderPastTrips();
      default:
        return renderAllTrips();
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Header Section */}
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trips Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and view all your trips in one place</p>
        </div>

        {/* Filter and Add Button */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="created">Created</option>
                <option value="in-transit">In Transit</option>
                <option value="completed">Completed</option>
              </select>
              {statusFilter && (
                <button
                  onClick={handleClearFilter}
                  className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <button
            onClick={openModal}
            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add New Trip
          </button>
        </div>

        {/* Active Filter Summary */}
        {statusFilter && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Filter:</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                  Status: {statusFilter}
                </span>
              </div>
              <button
                onClick={handleClearFilter}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                Clear Filter
              </button>
            </div>
          </div>
        )}

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

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("all")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "all"
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                All Trips ({allTrips.length})
              </button>
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "upcoming"
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Upcoming Trips ({upcomingTrips.length})
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "past"
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Past Trips ({pastTrips.length})
              </button>
            </nav>
          </div>
        </div>
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
