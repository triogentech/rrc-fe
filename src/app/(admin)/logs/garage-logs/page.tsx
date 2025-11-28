"use client";
import React, { useEffect, useState } from 'react';
import { garageLogService } from '@/store/api/services';
import type { GarageLog, User } from '@/store/api/types';
import { showErrorToast, showSuccessToast } from '@/utils/toastHelper';
import { getUserDisplayName, getUserEmail } from '@/utils/userDisplay';
import { formatDateTimeToIST } from '@/utils/dateFormatter';
import GarageLogCreateModal from '@/components/modals/GarageLogCreateModal';
import GarageLogEditModal from '@/components/modals/GarageLogEditModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

export default function GarageLogsPage() {
  const [logs, setLogs] = useState<GarageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<GarageLog & Record<string, unknown> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pagination, setPagination] = useState<{
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (params?: { page?: number; search?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await garageLogService.getGarageLogs({
        page: params?.page || 1,
        limit: 25,
        search: params?.search,
      });
      
      console.log('Garage Log fetch response:', response);
      
      let logsData: GarageLog[] = [];
      let paginationData: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      } | null = null;
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          logsData = response.data;
        } else if (typeof response.data === 'object' && 'data' in response.data) {
          const strapiResponse = response.data as unknown as { data: GarageLog[]; meta?: { pagination?: typeof paginationData } };
          if (Array.isArray(strapiResponse.data)) {
            logsData = strapiResponse.data;
          }
          if (strapiResponse.meta?.pagination) {
            paginationData = strapiResponse.meta.pagination;
          }
        }
      }
      
      const responseWithMeta = response as typeof response & { meta?: { pagination?: typeof paginationData } };
      if (responseWithMeta.meta?.pagination) {
        paginationData = responseWithMeta.meta.pagination;
      }
      
      setLogs(logsData);
      if (paginationData) {
        setPagination(paginationData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch garage logs';
      setError(errorMessage);
      console.error('Error fetching garage logs:', err);
      showErrorToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchLogs({ page: 1, search: searchQuery.trim() });
    } else {
      fetchLogs({ page: 1 });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchLogs({ page: 1 });
  };


  const handleLogCreated = () => {
    fetchLogs({ page: pagination?.page || 1, search: searchQuery || undefined });
  };

  const handleLogUpdated = () => {
    fetchLogs({ page: pagination?.page || 1, search: searchQuery || undefined });
  };

  const handleEditLog = (log: GarageLog & Record<string, unknown>) => {
    setSelectedLog(log);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedLog(null);
  };

  const handleDeleteLog = (log: GarageLog & Record<string, unknown>) => {
    setSelectedLog(log);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedLog) return;
    setIsDeleting(true);
    try {
      await garageLogService.deleteGarageLog(selectedLog.documentId);
      showSuccessToast('Garage log deleted successfully!');
      fetchLogs({ page: pagination?.page || 1, search: searchQuery || undefined });
      setIsDeleteModalOpen(false);
      setSelectedLog(null);
    } catch (error) {
      console.error('Error deleting garage log:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete garage log';
      showErrorToast(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to get garage name from garage relation
  const getGarageName = (garage: unknown): string => {
    if (!garage) return 'N/A';
    if (typeof garage === 'string') return 'N/A'; // If it's just an ID, we can't show name
    if (typeof garage === 'object') {
      const garageObj = garage as Record<string, unknown>;
      return String(garageObj.name || 'N/A');
    }
    return 'N/A';
  };

  // Helper function to get invoice date
  const getInvoiceDate = (log: Record<string, unknown>): string => {
    const invoiceDate = log.invoiceDate;
    if (!invoiceDate) return 'N/A';
    return formatDateTimeToIST(String(invoiceDate));
  };

  // Helper function to get invoice raised amount
  const getInvoiceRaisedAmount = (log: Record<string, unknown>): string => {
    const amount = log.invoiceRaisedAmount;
    if (amount === null || amount === undefined) return 'N/A';
    const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount));
    if (isNaN(numAmount)) return 'N/A';
    return `₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function to get invoice passed amount
  const getInvoicePassedAmount = (log: Record<string, unknown>): string => {
    const amount = log.invoicePassedAmount;
    if (amount === null || amount === undefined) return 'N/A';
    const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount));
    if (isNaN(numAmount)) return 'N/A';
    return `₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function to get invoice doc (file URL or name)
  const getInvoiceDoc = (log: Record<string, unknown>): React.ReactNode => {
    const invoiceDoc = log.invoiceDoc;
    if (!invoiceDoc) return 'N/A';
    
    // If it's a string (URL or file path)
    if (typeof invoiceDoc === 'string') {
      if (invoiceDoc.startsWith('http') || invoiceDoc.startsWith('/')) {
        return (
          <a
            href={invoiceDoc}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            View Document
          </a>
        );
      }
      return invoiceDoc;
    }
    
    // If it's an object (Strapi file object)
    if (typeof invoiceDoc === 'object') {
      const docObj = invoiceDoc as Record<string, unknown>;
      const formats = docObj.formats as Record<string, unknown> | undefined;
      const thumbnail = formats?.thumbnail as Record<string, unknown> | undefined;
      const url = docObj.url || thumbnail?.url;
      const name = docObj.name || docObj.filename;
      
      if (url) {
        return (
          <a
            href={String(url)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            {name ? String(name) : 'View Document'}
          </a>
        );
      }
      return name ? String(name) : 'N/A';
    }
    
    return 'N/A';
  };

  // Helper function to get updated by (cstmUpdatedBy or lastUpdatedBy)
  const getUpdatedBy = (log: Record<string, unknown>): string | React.ReactNode => {
    const updatedBy = log.cstmUpdatedBy || log.lastUpdatedBy;
    if (!updatedBy) return 'N/A';
    
    const displayName = getUserDisplayName(updatedBy as string | User | User[] | undefined);
    const email = getUserEmail(updatedBy as string | User | User[] | undefined);
    
    if (email) {
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{displayName}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{email}</span>
        </div>
      );
    }
    return displayName;
  };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Garage Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage all garage logs</p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search garage logs..."
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
            + Add New Garage Log
          </button>
        </div>

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
                  ({logs.length} log{logs.length !== 1 ? 's' : ''} found)
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

      <div className="col-span-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Garage Logs List</h2>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading garage logs...</span>
              </div>
            )}

            {!isLoading && logs.length === 0 && !error && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No garage logs found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No garage logs are available at the moment.</p>
              </div>
            )}

            {!isLoading && logs.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Garage Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Invoice Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Invoice Raised Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Invoice Passed Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Invoice Doc
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created At
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created By
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Updated By
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {logs.map((log: GarageLog & Record<string, unknown>) => {
                      const logData = log as Record<string, unknown>;
                      const garage = logData.garage;
                      const cstmCreatedBy = logData.cstmCreatedBy;
                      
                      return (
                        <tr key={log.id || log.documentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {/* Garage Name */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white font-medium">
                              {getGarageName(garage)}
                            </div>
                          </td>
                          
                          {/* Invoice Date */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {getInvoiceDate(logData)}
                            </div>
                          </td>
                          
                          {/* Invoice Raised Amount */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {getInvoiceRaisedAmount(logData)}
                            </div>
                          </td>
                          
                          {/* Invoice Passed Amount */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {getInvoicePassedAmount(logData)}
                            </div>
                          </td>
                          
                          {/* Invoice Doc */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {getInvoiceDoc(logData)}
                            </div>
                          </td>
                          
                          {/* Created At */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {logData.createdAt ? formatDateTimeToIST(String(logData.createdAt)) : 'N/A'}
                            </div>
                          </td>
                          
                          {/* Created By */}
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {cstmCreatedBy ? (
                                (() => {
                                  const displayName = getUserDisplayName(cstmCreatedBy as string | User | User[] | undefined);
                                  const email = getUserEmail(cstmCreatedBy as string | User | User[] | undefined);
                                  if (email) {
                                    return (
                                      <div className="flex flex-col">
                                        <span className="font-medium">{displayName}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{email}</span>
                                      </div>
                                    );
                                  }
                                  return displayName;
                                })()
                              ) : (
                                'N/A'
                              )}
                            </div>
                          </td>
                          
                          {/* Updated By */}
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {getUpdatedBy(logData)}
                            </div>
                          </td>
                          
                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleEditLog(log)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteLog(log)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {pagination && pagination.pageCount > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchLogs({ page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchLogs({ page: pagination.page + 1 })}
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

      <GarageLogCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleLogCreated}
      />

      <GarageLogEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        garageLog={selectedLog}
        onSuccess={handleLogUpdated}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedLog(null); setIsDeleting(false); }}
        onConfirm={handleConfirmDelete}
        title="Delete Garage Log"
        message={`Are you sure you want to delete this garage log? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
}

