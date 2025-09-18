"use client";
import React, { useEffect, useState } from 'react';
import { useStaff } from '@/store/hooks/useStaff';
import { useStaffCreateModal } from '@/hooks/useStaffCreateModal';
import StaffCreateModal from '@/components/modals/StaffCreateModal';
import StaffViewModal from '@/components/modals/StaffViewModal';
import StaffEditModal from '@/components/modals/StaffEditModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import type { Staff } from '@/store/api/types';

export default function StaffPage() {
  const {
    staff: staffState,
    isLoading,
    error,
    pagination,
    getStaff,
    deleteStaff,
    getStaffDisplayName,
    getStaffContactInfo,
    isStaffActive,
    clearStaffError,
  } = useStaff();

  const staff = staffState.staff;

  const { isOpen, openModal, closeModal, handleSuccess } = useStaffCreateModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch staff on component mount
  useEffect(() => {
    getStaff();
  }, [getStaff]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      getStaff({ search: searchQuery.trim() });
    } else {
      getStaff();
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    getStaff();
  };

  // Handle staff creation success
  const handleStaffCreated = (staff: Staff) => {
    console.log('Staff created successfully:', staff);
    // Refresh the staff list
    getStaff();
    handleSuccess(staff);
  };

  // Handle view staff
  const handleViewStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setViewModalOpen(true);
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedStaff(null);
  };

  // Handle edit staff
  const handleEditStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setEditModalOpen(true);
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedStaff(null);
  };

  // Handle staff update success
  const handleStaffUpdated = (staff: Staff) => {
    console.log('Staff updated successfully:', staff);
    // Refresh the staff list
    getStaff();
    handleCloseEditModal();
  };

  // Handle delete staff
  const handleDeleteStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setDeleteModalOpen(true);
  };

  // Handle close delete modal
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedStaff(null);
    setIsDeleting(false);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedStaff) return;

    setIsDeleting(true);
    try {
      const success = await deleteStaff(selectedStaff.documentId);
      if (success) {
        console.log('Staff deleted successfully');
        // Refresh the staff list
        getStaff();
        handleCloseDeleteModal();
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Header Section */}
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and view all your staff members in one place</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="col-span-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Staff List</h2>
              
              {/* Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Search
                  </button>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </form>
                
                <button 
                  onClick={openModal}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  + Add New Staff
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
                    onClick={clearStaffError}
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
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading staff...</span>
              </div>
            )}

            {/* Staff List */}
            {!isLoading && staff.length === 0 && !error && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No staff found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding a new staff member.</p>
              </div>
            )}

            {/* Staff Table */}
            {!isLoading && staff.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Staff Member
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Added Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {staff.map((staff: Staff) => (
                      <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {getStaffDisplayName(staff).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {getStaffDisplayName(staff)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {getStaffContactInfo(staff)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isStaffActive(staff)
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {isStaffActive(staff) ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(staff.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewStaff(staff)}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="View staff details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEditStaff(staff)}
                              className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                              title="Edit staff member"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(staff)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete staff member"
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

      {/* Staff Creation Modal */}
      <StaffCreateModal
        isOpen={isOpen}
        onClose={closeModal}
        onSuccess={handleStaffCreated}
      />

      {/* Staff View Modal */}
      <StaffViewModal
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        staff={selectedStaff}
      />

      {/* Staff Edit Modal */}
      <StaffEditModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        staff={selectedStaff}
        onSuccess={handleStaffUpdated}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Staff Member"
        message={`Are you sure you want to delete "${selectedStaff?.fullName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
}
