"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVehicles } from '@/store/hooks/useVehicles';
import { useVehicleCreateModal } from '@/hooks/useVehicleCreateModal';
import VehicleCreateModal from '@/components/modals/VehicleCreateModal';
import VehicleViewModal from '@/components/modals/VehicleViewModal';
import VehicleEditModal from '@/components/modals/VehicleEditModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { formatDateToIST } from '@/utils/dateFormatter';
import type { Vehicle } from '@/store/api/types';
import { getExpiringFields } from '@/utils/vehicleExpiringFields';
import { api } from '@/store/api/baseApi';
import FilterSidebar, { type FilterField } from '@/components/ui/sidebar/FilterSidebar';
import { VehicleCurrentStatus } from '@/store/api/types';

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

  const router = useRouter();
  const searchParams = useSearchParams();
  const { isOpen, openModal, closeModal, handleSuccess } = useVehicleCreateModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [allVehiclesForExpiringCheck, setAllVehiclesForExpiringCheck] = useState<Vehicle[]>([]);
  const [showExpiringFieldsSection, setShowExpiringFieldsSection] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);

  // Read search query and filters from URL on mount
  useEffect(() => {
    const searchParam = searchParams.get('search');
    const statusParam = searchParams.get('status');
    const activeParam = searchParams.get('active');
    
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    
    if (statusParam) {
      setStatusFilter(statusParam);
    }
    
    if (activeParam !== null) {
      setActiveFilter(activeParam === 'true');
    }
    
    const params: { page: number; limit?: number; search?: string; currentStatus?: string; active?: boolean } = {
      page: 1,
      limit: 100,
    };
    
    if (searchParam) {
      params.search = searchParam;
    }
    
    if (statusParam) {
      params.currentStatus = statusParam;
    }
    
    if (activeParam !== null) {
      params.active = activeParam === 'true';
    }
    
    getVehicles(params);
  }, [searchParams, getVehicles]);

  // Helper function to fetch all vehicles for expiring fields check
  const fetchAllVehiclesForExpiringCheck = async () => {
    try {
      // Fetch all vehicles with a high limit to check for expiring fields
      // Using direct API call to avoid affecting the paginated vehicles state
      const response = await api.get('/api/vehicles', {
        populate: '*',
        'pagination[pageSize]': 1000, // Get all vehicles
      });

      // Handle Strapi response format
      let fetchedVehicles: Vehicle[] = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          fetchedVehicles = response.data as Vehicle[];
        } else if (typeof response.data === 'object' && 'data' in response.data) {
          const strapiResponse = response.data as { data?: Vehicle[] };
          fetchedVehicles = (strapiResponse.data || []) as Vehicle[];
        }
      }

      setAllVehiclesForExpiringCheck(fetchedVehicles);
    } catch (error) {
      console.error('Error fetching all vehicles for expiring check:', error);
      setAllVehiclesForExpiringCheck([]);
    }
  };

  // Fetch all vehicles for expiring fields check on component mount
  useEffect(() => {
    fetchAllVehiclesForExpiringCheck();
  }, []);

  // Debug: Log pagination changes
  useEffect(() => {
    console.log('Vehicles page - Pagination state:', pagination);
  }, [pagination]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Update URL with search parameter
      router.push(`/vehicles?search=${encodeURIComponent(searchQuery.trim())}`);
      getVehicles({ search: searchQuery.trim(), page: 1, limit: 100 });
    } else {
      // Clear search parameter from URL
      router.push('/vehicles');
      getVehicles({ page: 1, limit: 100 });
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    // Clear search parameter from URL
    router.push('/vehicles');
    getVehicles({ page: 1, limit: 100 });
  };

  // Handle click on expiring vehicle number to search
  const handleExpiringVehicleClick = (vehicleNumber: string) => {
    setSearchQuery(vehicleNumber);
    getVehicles({ search: vehicleNumber, page: 1, limit: 100 });
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    const params: { page: number; limit?: number; search?: string; currentStatus?: string; active?: boolean } = {
      page: 1,
      limit: 100,
    };
    
    // Build URL with filters
    const urlParams = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
      urlParams.set('search', searchQuery.trim());
    }
    
    if (statusFilter) {
      params.currentStatus = statusFilter;
      urlParams.set('status', statusFilter);
    }
    
    if (activeFilter !== null) {
      params.active = activeFilter;
      urlParams.set('active', activeFilter.toString());
    }
    
    // Update URL
    const url = urlParams.toString() ? `/vehicles?${urlParams.toString()}` : '/vehicles';
    router.push(url);
    
    getVehicles(params);
    setIsFilterSidebarOpen(false);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setStatusFilter(null);
    setActiveFilter(null);
    const params: { page: number; limit?: number; search?: string } = {
      page: 1,
      limit: 100,
    };
    
    // Build URL without filter params
    const urlParams = new URLSearchParams();
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
      urlParams.set('search', searchQuery.trim());
    }
    
    // Update URL
    const url = urlParams.toString() ? `/vehicles?${urlParams.toString()}` : '/vehicles';
    router.push(url);
    
    getVehicles(params);
  };

  // Create filter fields configuration for vehicles
  const vehicleFilterFields: FilterField[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      value: statusFilter,
      onChange: (value) => setStatusFilter(value as string | null),
      options: [
        { value: null, label: 'All' },
        { value: VehicleCurrentStatus.IDLE, label: 'Idle' },
        { value: VehicleCurrentStatus.ASSIGNED, label: 'Assigned' },
        { value: VehicleCurrentStatus.ONGOING, label: 'Ongoing' },
        { value: VehicleCurrentStatus.IN_TRANSIT, label: 'In Transit' },
      ],
    },
    {
      id: 'active',
      label: 'Active Status',
      type: 'select',
      value: activeFilter,
      onChange: (value) => setActiveFilter(value as boolean | null),
      options: [
        { value: null, label: 'All' },
        { value: true, label: 'Active' },
        { value: false, label: 'Inactive' },
      ],
    },
  ];

  // Get vehicles with expiring fields from all vehicles (not just current page)
  const vehiclesWithExpiringFields = allVehiclesForExpiringCheck.filter(vehicle => getExpiringFields(vehicle).length > 0);

  // Calculate statistics for expiring fields
  const expiringStats = React.useMemo(() => {
    const stats = {
      expired: 0,
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
      totalVehicles: vehiclesWithExpiringFields.length,
    };

    vehiclesWithExpiringFields.forEach(vehicle => {
      const fields = getExpiringFields(vehicle);
      fields.forEach(field => {
        if (field.isExpired) {
          stats.expired++;
        } else {
          switch (field.priority) {
            case 'urgent':
              stats.urgent++;
              break;
            case 'high':
              stats.high++;
              break;
            case 'medium':
              stats.medium++;
              break;
            case 'low':
              stats.low++;
              break;
          }
        }
      });
    });

    return stats;
  }, [vehiclesWithExpiringFields]);

  // Get most critical vehicles (expired first, then urgent, limited to top 5)
  const mostCriticalVehicles = React.useMemo(() => {
    return [...vehiclesWithExpiringFields]
      .sort((a, b) => {
        const aFields = getExpiringFields(a);
        const bFields = getExpiringFields(b);
        const aMostUrgent = aFields[0];
        const bMostUrgent = bFields[0];
        
        if (aMostUrgent.isExpired && !bMostUrgent.isExpired) return -1;
        if (!aMostUrgent.isExpired && bMostUrgent.isExpired) return 1;
        return aMostUrgent.daysRemaining - bMostUrgent.daysRemaining;
      })
      .slice(0, 5);
  }, [vehiclesWithExpiringFields]);

  // Handle vehicle creation success
  const handleVehicleCreated = (vehicle: Vehicle) => {
    console.log('Vehicle created successfully:', vehicle);
    // Refresh the vehicles list, preserve current page if available
    const currentPage = pagination?.page || 1;
    const params: { page: number; limit?: number; search?: string } = {
      page: currentPage,
      limit: pagination?.pageSize || 100,
    };
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    getVehicles(params);
    // Refresh expiring fields check
    fetchAllVehiclesForExpiringCheck();
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
      limit: pagination?.pageSize || 100,
    };
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    getVehicles(params);
    // Refresh expiring fields check
    fetchAllVehiclesForExpiringCheck();
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
          limit: pagination?.pageSize || 100,
        };
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        getVehicles(params);
        // Refresh expiring fields check
        fetchAllVehiclesForExpiringCheck();
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
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vehicles Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and view all your vehicles in one place</p>
            </div>
            <button
              onClick={() => setIsFilterSidebarOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Filter vehicles"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Expiring/Expired Fields Alert Section */}
        {vehiclesWithExpiringFields.length > 0 && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Document Expiry Alerts
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {expiringStats.totalVehicles} vehicle{expiringStats.totalVehicles !== 1 ? 's' : ''} require attention
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push('/vehicles/expiring')}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors"
                    >
                      View All
                    </button>
                    {showExpiringFieldsSection && (
                      <button
                        onClick={() => setShowExpiringFieldsSection(false)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Collapse"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    {!showExpiringFieldsSection && (
                      <button
                        onClick={() => setShowExpiringFieldsSection(true)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Expand"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Statistics Cards - Compact */}
                {showExpiringFieldsSection && (
                  <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {expiringStats.expired > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
                          <span className="text-xs font-medium text-red-700 dark:text-red-300">Expired:</span>
                          <span className="text-sm font-bold text-red-900 dark:text-red-100">{expiringStats.expired}</span>
                        </div>
                      )}
                      {expiringStats.urgent > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-100 dark:bg-orange-900/30 rounded border border-orange-200 dark:border-orange-800">
                          <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Urgent:</span>
                          <span className="text-sm font-bold text-orange-900 dark:text-orange-100">{expiringStats.urgent}</span>
                        </div>
                      )}
                      {expiringStats.high > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded border border-amber-200 dark:border-amber-800">
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">High:</span>
                          <span className="text-sm font-bold text-amber-900 dark:text-amber-100">{expiringStats.high}</span>
                        </div>
                      )}
                      {expiringStats.medium > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-800">
                          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Medium:</span>
                          <span className="text-sm font-bold text-yellow-900 dark:text-yellow-100">{expiringStats.medium}</span>
                        </div>
                      )}
                      {expiringStats.low > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800">
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Low:</span>
                          <span className="text-sm font-bold text-blue-900 dark:text-blue-100">{expiringStats.low}</span>
                        </div>
                      )}
                    </div>

                    {/* Most Critical Vehicles List - In Row */}
                    {mostCriticalVehicles.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                            Top {Math.min(3, mostCriticalVehicles.length)} Critical
                          </h4>
                          {vehiclesWithExpiringFields.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {vehiclesWithExpiringFields.length - 3} more
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {mostCriticalVehicles.slice(0, 3).map((vehicle) => {
                            const expiringFields = getExpiringFields(vehicle);
                            const mostUrgent = expiringFields[0];
                            const hasExpired = expiringFields.some(f => f.isExpired);
                            const expiredCount = expiringFields.filter(f => f.isExpired).length;
                            const expiredFields = expiringFields.filter(f => f.isExpired);
                            
                            return (
                              <button
                                key={vehicle.documentId}
                                onClick={() => handleExpiringVehicleClick(vehicle.vehicleNumber)}
                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-sm transition-all group"
                              >
                                <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${
                                  mostUrgent.isExpired
                                    ? 'bg-red-600'
                                    : mostUrgent.priority === 'urgent'
                                    ? 'bg-red-500'
                                    : mostUrgent.priority === 'high'
                                    ? 'bg-orange-500'
                                    : mostUrgent.priority === 'medium'
                                    ? 'bg-yellow-500'
                                    : 'bg-blue-500'
                                }`}></div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                    {getVehicleDisplayName(vehicle)}
                                  </div>
                                  {hasExpired && expiredFields.length > 0 && (
                                    <div className="text-xs text-red-600 dark:text-red-400 truncate">
                                      {expiredFields.map(f => f.label).join(', ')} expired
                                    </div>
                                  )}
                                </div>
                                {hasExpired && (
                                  <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold rounded flex-shrink-0">
                                    {expiredCount}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
                      <th scope="col" className="sticky right-0 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700 z-10 border-l border-gray-200 dark:border-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                     {vehicles.map((vehicle: Vehicle) => (
                       <tr key={vehicle.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700">
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
                        <td className="sticky right-0 px-6 py-4 whitespace-nowrap bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 z-10 border-l border-gray-200 dark:border-gray-600 transition-colors">
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
                            <button
                              onClick={() => router.push(`/track-vehicle?name=${encodeURIComponent(vehicle.vehicleNumber)}`)}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Track vehicle"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Filter Vehicles"
        fields={vehicleFilterFields}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
}
