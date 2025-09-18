"use client";
import React, { useState, useEffect } from 'react';
import { useTrips } from '@/store/hooks/useTrips';
import { useTripCreateModal } from '@/hooks/useTripCreateModal';
import TripCreateModal from '@/components/modals/TripCreateModal';
import TripViewModal from '@/components/modals/TripViewModal';
import TripEditModal from '@/components/modals/TripEditModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import type { Trip } from '@/store/api/types';

const TripsPage = () => {
  const {
    trips,
    isLoading,
    error,
    getTrips,
    deleteTrip,
    getTripStatusDisplayName,
    getTripStatusColor,
    formatTripDate,
    getTripDuration,
    isTripActive,
    clearTripsError,
  } = useTrips();


  const { isOpen, openModal, closeModal, handleSuccess } = useTripCreateModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch trips on component mount
  useEffect(() => {
    getTrips();
  }, [getTrips]);

  // Filter trips based on active tab
  const upcomingTrips = trips.filter(trip => isTripActive(trip));
  const pastTrips = trips.filter(trip => trip.currentStatus === 'completed' || trip.currentStatus === 'cancelled');
  const allTrips = trips;

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      getTrips({ search: searchQuery.trim() });
    } else {
      getTrips();
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    getTrips();
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
                Start Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                End Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actual End Time
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
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTripStatusColor(trip.currentStatus)}`}>
                    {getTripStatusDisplayName(trip.currentStatus)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {trip.actualEndTime ? formatTripDate(trip.actualEndTime) : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleViewTrip(trip)}
                    className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 mr-3"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleEditTrip(trip)}
                    className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 mr-3"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteTrip(trip)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actual End Time
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTripStatusColor(trip.currentStatus)}`}>
                      {getTripStatusDisplayName(trip.currentStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.actualEndTime ? formatTripDate(trip.actualEndTime) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleViewTrip(trip)}
                      className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 mr-3"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEditTrip(trip)}
                      className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteTrip(trip)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
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
                {upcomingTrips.filter(trip => trip.currentStatus === 'scheduled').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {upcomingTrips.filter(trip => trip.currentStatus === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {upcomingTrips.filter(trip => trip.currentStatus === 'created').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Created</div>
            </div>
          </div>
        </div>
      </div>
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
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actual End Time
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTripStatusColor(trip.currentStatus)}`}>
                      {getTripStatusDisplayName(trip.currentStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trip.actualEndTime ? formatTripDate(trip.actualEndTime) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleViewTrip(trip)}
                      className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 mr-3"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEditTrip(trip)}
                      className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteTrip(trip)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
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
                {pastTrips.filter(trip => trip.currentStatus === 'cancelled').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Cancelled</div>
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

        {/* Search and Add Button */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trips..."
                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>
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
    </div>
  );
};

export default TripsPage;
