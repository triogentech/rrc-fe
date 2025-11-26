"use client";
import React, { useEffect, useState } from 'react';
import { useVehicles } from '@/store/hooks/useVehicles';
import { useVehicleCreateModal } from '@/hooks/useVehicleCreateModal';
import VehicleCreateModal from '@/components/modals/VehicleCreateModal';
import VehicleViewModal from '@/components/modals/VehicleViewModal';
import VehicleEditModal from '@/components/modals/VehicleEditModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { formatDateToIST } from '@/utils/dateFormatter';
import type { Vehicle } from '@/store/api/types';

export default function VehiclesPage() {
  const {
    vehicles,
    isLoading,
    error,
    pagination,
    getVehicles,
    deleteVehicle,
    getVehicleDisplayName,
    // getVehicleTypeDisplayName,
    getVehicleStatusDisplayName,
    getVehicleStatusColor,
    clearVehiclesError,
  } = useVehicles();

  const { isOpen, openModal, closeModal, handleSuccess } = useVehicleCreateModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch vehicles on component mount
  useEffect(() => {
    getVehicles({ page: 1, limit: 25 });
  }, [getVehicles]);

  // Debug: Log pagination changes
  useEffect(() => {
    console.log('Vehicles page - Pagination state:', pagination);
  }, [pagination]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      getVehicles({ search: searchQuery.trim(), page: 1, limit: 25 });
    } else {
      getVehicles({ page: 1, limit: 25 });
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    getVehicles({ page: 1, limit: 25 });
  };

  // Handle vehicle creation success
  const handleVehicleCreated = (vehicle: Vehicle) => {
    console.log('Vehicle created successfully:', vehicle);
    // Refresh the vehicles list, preserve current page if available
    const currentPage = pagination?.page || 1;
    const params: { page: number; limit?: number; search?: string } = {
      page: currentPage,
      limit: pagination?.pageSize || 25,
    };
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    getVehicles(params);
    handleSuccess(vehicle);
  };

  // Handle view vehicle
  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setViewModalOpen(true);
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedVehicle(null);
  };

  // Handle edit vehicle
  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setEditModalOpen(true);
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedVehicle(null);
  };

  // Handle vehicle update success
  const handleVehicleUpdated = (vehicle: Vehicle) => {
    console.log('Vehicle updated successfully:', vehicle);
    // Refresh the vehicles list, preserve current page if available
    const currentPage = pagination?.page || 1;
    const params: { page: number; limit?: number; search?: string } = {
      page: currentPage,
      limit: pagination?.pageSize || 25,
    };
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    getVehicles(params);
    handleCloseEditModal();
  };

  // Handle delete vehicle
  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDeleteModalOpen(true);
  };

  // Handle close delete modal
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedVehicle(null);
    setIsDeleting(false);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedVehicle) return;

    setIsDeleting(true);
    try {
      const success = await deleteVehicle(selectedVehicle.documentId);
      if (success) {
        console.log('Vehicle deleted successfully');
        // Refresh the vehicles list, preserve current page if available
        const currentPage = pagination?.page || 1;
        const params: { page: number; limit?: number; search?: string } = {
          page: currentPage,
          limit: pagination?.pageSize || 25,
        };
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        getVehicles(params);
        handleCloseDeleteModal();
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Header Section */}
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vehicles Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and view all your vehicles in one place</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="col-span-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Vehicles List</h2>
              
              {/* Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by vehicle number, model, chassis, or engine number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {isLoading ? 'Searching...' : 'Search'}
                  </button>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      disabled={isLoading}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </form>
                
                <button 
                  onClick={openModal}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                + Add New Vehicle
              </button>
            </div>
          </div>
          </div>

          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                  <button
                    onClick={clearVehiclesError}
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
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading vehicles...</span>
              </div>
            )}

            {/* Search Active Indicator */}
            {searchQuery.trim() && !isLoading && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    Searching for: <span className="font-semibold">&quot;{searchQuery}&quot;</span>
                    {pagination && pagination.total > 0 && (
                      <span className="ml-2">({pagination.total} result{pagination.total !== 1 ? 's' : ''} found)</span>
                    )}
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm font-medium"
                  >
                    Clear search
                  </button>
                </div>
              </div>
            )}

            {/* Vehicles List */}
            {!isLoading && vehicles.length === 0 && !error && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0M15 17a2 2 0 104 0" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {searchQuery.trim() ? 'No vehicles found matching your search' : 'No vehicles found'}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery.trim() ? 'Try a different search term.' : 'Get started by adding a new vehicle.'}
                </p>
              </div>
            )}

            {/* Vehicles Table */}
            {!isLoading && vehicles.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Vehicle
                      </th>
                      {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Type
                      </th> */}
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Chassis Number
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Registration Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fitness Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Insurance Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tax Due Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Permit Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        PUCC Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        NP Valid Upto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Active
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {vehicles.map((vehicle: Vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {vehicle.vehicleNumber.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {getVehicleDisplayName(vehicle)}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {getVehicleTypeDisplayName(vehicle.type)}
                          </div>
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {vehicle.chassisNumber || <span className="text-gray-500 dark:text-gray-400">N/A</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {vehicle.registrationDate ? formatDateToIST(vehicle.registrationDate) : <span className="text-gray-500 dark:text-gray-400">N/A</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {vehicle.fitnessDate ? formatDateToIST(vehicle.fitnessDate) : <span className="text-gray-500 dark:text-gray-400">N/A</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {vehicle.insuranceDate ? formatDateToIST(vehicle.insuranceDate) : <span className="text-gray-500 dark:text-gray-400">N/A</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {vehicle.taxDueDate ? formatDateToIST(vehicle.taxDueDate) : <span className="text-gray-500 dark:text-gray-400">N/A</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {vehicle.permitDate ? formatDateToIST(vehicle.permitDate) : <span className="text-gray-500 dark:text-gray-400">N/A</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {vehicle.puccDate ? formatDateToIST(vehicle.puccDate) : <span className="text-gray-500 dark:text-gray-400">N/A</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {vehicle.npValidUpto ? formatDateToIST(vehicle.npValidUpto) : <span className="text-gray-500 dark:text-gray-400">N/A</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVehicleStatusColor(vehicle.currentStatus)}`}>
                            {getVehicleStatusDisplayName(vehicle.currentStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            vehicle.isActive === true
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {vehicle.isActive === true ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewVehicle(vehicle)}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="View vehicle details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEditVehicle(vehicle)}
                              className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                              title="Edit vehicle"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteVehicle(vehicle)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete vehicle"
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
                    onClick={() => {
                      const params: { page: number; limit?: number; search?: string } = {
                        page: pagination.page - 1,
                        limit: pagination.pageSize,
                      };
                      if (searchQuery.trim()) {
                        params.search = searchQuery.trim();
                      }
                      getVehicles(params);
                    }}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Page {pagination.page} of {pagination.pageCount}
                  </span>
                  <button
                    onClick={() => {
                      const params: { page: number; limit?: number; search?: string } = {
                        page: pagination.page + 1,
                        limit: pagination.pageSize,
                      };
                      if (searchQuery.trim()) {
                        params.search = searchQuery.trim();
                      }
                      getVehicles(params);
                    }}
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

      {/* Vehicle Creation Modal */}
      <VehicleCreateModal
        isOpen={isOpen}
        onClose={closeModal}
        onSuccess={handleVehicleCreated}
      />

      {/* Vehicle View Modal */}
      <VehicleViewModal
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        vehicle={selectedVehicle}
      />

      {/* Vehicle Edit Modal */}
      <VehicleEditModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        vehicle={selectedVehicle}
        onSuccess={handleVehicleUpdated}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete "${selectedVehicle?.vehicleNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
}
