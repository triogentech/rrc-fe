"use client";
import React, { useEffect, useState } from 'react';
import { garageService } from '@/store/api/services';
import type { Garage } from '@/store/api/types';
import { showErrorToast, showSuccessToast } from '@/utils/toastHelper';
import { getUserDisplayName, getUserEmail } from '@/utils/userDisplay';
import { formatDateTimeToIST } from '@/utils/dateFormatter';
import GarageCreateModal from '@/components/modals/GarageCreateModal';
import GarageEditModal from '@/components/modals/GarageEditModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

export default function GaragePage() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pagination, setPagination] = useState<{
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  } | null>(null);

  // Fetch garages on component mount
  useEffect(() => {
    fetchGarages();
  }, []);

  const fetchGarages = async (params?: { page?: number; search?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await garageService.getGarages({
        page: params?.page || 1,
        limit: 25,
        search: params?.search,
      });
      
      console.log('Garage fetch response:', response);
      
      let garagesData: Garage[] = [];
      let paginationData: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      } | null = null;
      
      // Handle response.data - could be array or StrapiResponse object
      if (response.data) {
        if (Array.isArray(response.data)) {
          garagesData = response.data;
        } else if (typeof response.data === 'object' && 'data' in response.data) {
          const strapiResponse = response.data as unknown as { data: Garage[]; meta?: { pagination?: typeof paginationData } };
          if (Array.isArray(strapiResponse.data)) {
            garagesData = strapiResponse.data;
          }
          if (strapiResponse.meta?.pagination) {
            paginationData = strapiResponse.meta.pagination;
          }
        }
      }
      
      // Check response.meta for pagination
      const responseWithMeta = response as typeof response & { meta?: { pagination?: typeof paginationData } };
      if (responseWithMeta.meta?.pagination) {
        paginationData = responseWithMeta.meta.pagination;
      }
      
      setGarages(garagesData);
      if (paginationData) {
        setPagination(paginationData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch garages';
      setError(errorMessage);
      console.error('Error fetching garages:', err);
      showErrorToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchGarages({ page: 1, search: searchQuery.trim() });
    } else {
      fetchGarages({ page: 1 });
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    fetchGarages({ page: 1 });
  };

  // Handle garage creation success
  const handleGarageCreated = () => {
    fetchGarages({ page: pagination?.page || 1, search: searchQuery || undefined });
  };

  // Handle garage edit
  const handleEditGarage = (garage: Garage) => {
    setSelectedGarage(garage);
    setIsEditModalOpen(true);
  };

  // Handle garage edit success
  const handleGarageUpdated = () => {
    fetchGarages({ page: pagination?.page || 1, search: searchQuery || undefined });
    setIsEditModalOpen(false);
    setSelectedGarage(null);
  };

  // Handle garage delete
  const handleDeleteGarage = (garage: Garage) => {
    setSelectedGarage(garage);
    setIsDeleteModalOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedGarage) return;

    setIsDeleting(true);
    try {
      await garageService.deleteGarage(selectedGarage.documentId);
      showSuccessToast(`Garage "${selectedGarage.name}" deleted successfully!`);
      fetchGarages({ page: pagination?.page || 1, search: searchQuery || undefined });
      setIsDeleteModalOpen(false);
      setSelectedGarage(null);
    } catch (error) {
      console.error('Error deleting garage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete garage';
      showErrorToast(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date

  // Get city name from city object or string
  const getCityName = (city: string | { name?: string } | null | undefined): string => {
    if (!city) return 'N/A';
    if (typeof city === 'string') return city;
    if (typeof city === 'object' && 'name' in city) return city.name || 'N/A';
    return 'N/A';
  };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Header Section */}
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Garages Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and view all garages</p>
        </div>

        {/* Search and Add Button */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search garages by name..."
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
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add New Garage
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
                  ({garages.length} garage{garages.length !== 1 ? 's' : ''} found)
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Garages List</h2>
            </div>
          </div>

          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading garages...</span>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && garages.length === 0 && !error && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No garages found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No garages are available at the moment.</p>
              </div>
            )}

            {/* Garages Table */}
            {!isLoading && garages.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Garage Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        City
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created By
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {garages.map((garage: Garage) => (
                      <tr key={garage.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {garage.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {garage.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            garage.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {garage.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {getCityName(garage.city)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDateTimeToIST(garage.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {garage.cstmCreatedBy ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {getUserDisplayName(garage.cstmCreatedBy)}
                                </span>
                                {getUserEmail(garage.cstmCreatedBy) && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {getUserEmail(garage.cstmCreatedBy)}
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
                              onClick={() => handleEditGarage(garage)}
                              className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                              title="Edit garage"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteGarage(garage)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete garage"
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
                    onClick={() => fetchGarages({ page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchGarages({ page: pagination.page + 1 })}
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

      {/* Garage Creation Modal */}
      <GarageCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleGarageCreated}
      />

      {/* Garage Edit Modal */}
      <GarageEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedGarage(null);
        }}
        garage={selectedGarage}
        onSuccess={handleGarageUpdated}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedGarage(null);
          setIsDeleting(false);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Garage"
        message={`Are you sure you want to delete "${selectedGarage?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
}


