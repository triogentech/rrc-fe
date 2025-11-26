"use client";
import React, { useEffect, useState } from 'react';
import { useDrivers } from '@/store/hooks/useDrivers';
import { useDriverCreateModal } from '@/hooks/useDriverCreateModal';
import DriverCreateModal from '@/components/modals/DriverCreateModal';
import DriverViewModal from '@/components/modals/DriverViewModal';
import DriverEditModal from '@/components/modals/DriverEditModal';
import DriverTripsModal from '@/components/modals/DriverTripsModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import type { Driver } from '@/store/api/types';
import { getUserDisplayName, getUserEmail } from '@/utils/userDisplay';
import { formatDateTimeToIST } from '@/utils/dateFormatter';

export default function DriversPage() {
  const {
    drivers,
    isLoading,
    error,
    pagination,
    getDrivers,
    deleteDriver,
    getDriverDisplayName,
    getDriverContactInfo,
    getDriverEmergencyContact,
    clearDriversError,
  } = useDrivers();

  const { isOpen, openModal, closeModal, handleSuccess } = useDriverCreateModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tripsModalOpen, setTripsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch drivers on component mount
  useEffect(() => {
    getDrivers();
  }, [getDrivers]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      getDrivers({ search: searchQuery.trim(), page: 1 });
    } else {
      getDrivers({ page: 1 });
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    getDrivers({ page: 1 });
  };

  // Handle driver creation success
  const handleDriverCreated = (driver: Driver) => {
    console.log('Driver created successfully:', driver);
    // Refresh the drivers list
    getDrivers();
    handleSuccess(driver);
  };

  // Handle view driver
  const handleViewDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setViewModalOpen(true);
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedDriver(null);
  };

  // Handle edit driver
  const handleEditDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setEditModalOpen(true);
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedDriver(null);
  };

  // Handle driver update success
  const handleDriverUpdated = (driver: Driver) => {
    console.log('Driver updated successfully:', driver);
    // Refresh the drivers list
    getDrivers();
    handleCloseEditModal();
  };

  // Handle delete driver
  const handleDeleteDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setDeleteModalOpen(true);
  };

  // Handle close delete modal
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedDriver(null);
    setIsDeleting(false);
  };

  // Handle view trips
  const handleViewTrips = (driver: Driver) => {
    setSelectedDriver(driver);
    setTripsModalOpen(true);
  };

  // Handle close trips modal
  const handleCloseTripsModal = () => {
    setTripsModalOpen(false);
    setSelectedDriver(null);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedDriver) return;

    setIsDeleting(true);
    try {
      const success = await deleteDriver(selectedDriver.documentId);
      if (success) {
        console.log('Driver deleted successfully');
        // Refresh the drivers list
        getDrivers();
        handleCloseDeleteModal();
      }
    } catch (error) {
      console.error('Error deleting driver:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Header Section */}
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Drivers Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and view all your drivers in one place</p>
        </div>

        {/* Search and Add Button */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drivers by name..."
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
            + Add New Driver
          </button>
        </div>

        {/* Search Results Summary */}
        {searchQuery && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Search results for &quot;{searchQuery}&quot;
                </span>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  ({drivers.length} driver{drivers.length !== 1 ? 's' : ''} found)
                </span>
              </div>
              <button
                onClick={handleClearSearch}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                Clear Search
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="col-span-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Drivers List</h2>
              
            </div>
          </div>

          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                  <button
                    onClick={clearDriversError}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading drivers...</span>
              </div>
            )}

            {/* Drivers List */}
            {!isLoading && drivers.length === 0 && !error && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No drivers found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding a new driver.</p>
              </div>
            )}

            {/* Drivers Table */}
            {!isLoading && drivers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Driver
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Address
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Emergency Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Trips
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Added Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created By
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Updated By
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {drivers.map((driver: Driver) => (
                      <tr key={driver.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {getDriverDisplayName(driver).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {getDriverDisplayName(driver)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {getDriverContactInfo(driver)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate" title={driver.address}>
                            {driver.address || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {getDriverEmergencyContact(driver)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewTrips(driver)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {driver.trips?.length || 0} trips
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDateTimeToIST(driver.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {driver.cstmCreatedBy ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {getUserDisplayName(driver.cstmCreatedBy)}
                                </span>
                                {getUserEmail(driver.cstmCreatedBy) && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {getUserEmail(driver.cstmCreatedBy)}
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
                            {driver.cstmUpdatedBy ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {getUserDisplayName(driver.cstmUpdatedBy)}
                                </span>
                                {getUserEmail(driver.cstmUpdatedBy) && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {getUserEmail(driver.cstmUpdatedBy)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">N/A</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDriver(driver)}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="View driver details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEditDriver(driver)}
                              className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                              title="Edit driver"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteDriver(driver)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete driver"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pageCount > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page === pagination.pageCount}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Driver Creation Modal */}
      <DriverCreateModal
        isOpen={isOpen}
        onClose={closeModal}
        onSuccess={handleDriverCreated}
      />

      {/* Driver View Modal */}
      <DriverViewModal
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        driver={selectedDriver}
      />

      {/* Driver Edit Modal */}
      <DriverEditModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        driver={selectedDriver}
        onSuccess={handleDriverUpdated}
      />

      {/* Driver Trips Modal */}
      <DriverTripsModal
        isOpen={tripsModalOpen}
        onClose={handleCloseTripsModal}
        driver={selectedDriver}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Driver"
        message={`Are you sure you want to delete "${selectedDriver?.fullName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
}
