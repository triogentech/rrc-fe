"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/store/api/baseApi';
import { formatDateToIST } from '@/utils/dateFormatter';
import type { Vehicle } from '@/store/api/types';
import { getExpiringFields, getPriorityColor, type ExpiringField } from '@/utils/vehicleExpiringFields';
import { useVehicles } from '@/store/hooks/useVehicles';
import VehicleEditModal from '@/components/modals/VehicleEditModal';

export default function ExpiringVehiclesPage() {
  const router = useRouter();
  const { getVehicleDisplayName, getVehicleStatusDisplayName, getVehicleStatusColor } = useVehicles();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Function to fetch and refresh the vehicles list
  const fetchExpiringVehicles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all vehicles with a high limit
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

      // Filter vehicles with expiring fields
      const vehiclesWithExpiringFields = fetchedVehicles.filter(
        vehicle => getExpiringFields(vehicle).length > 0
      );

      // Sort by urgency: expired first, then by most urgent expiring field
      vehiclesWithExpiringFields.sort((a, b) => {
        const aFields = getExpiringFields(a);
        const bFields = getExpiringFields(b);
        
        const aMostUrgent = aFields[0];
        const bMostUrgent = bFields[0];
        
        // Expired fields come first
        if (aMostUrgent.isExpired && !bMostUrgent.isExpired) return -1;
        if (!aMostUrgent.isExpired && bMostUrgent.isExpired) return 1;
        
        // Then sort by days remaining (most urgent first)
        return aMostUrgent.daysRemaining - bMostUrgent.daysRemaining;
      });

      setVehicles(vehiclesWithExpiringFields);
    } catch (error) {
      console.error('Error fetching expiring vehicles:', error);
      setError('Failed to load vehicles with expiring dates');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all vehicles with expiring fields on mount
  useEffect(() => {
    fetchExpiringVehicles();
  }, []);

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
    // Refresh the vehicles list
    fetchExpiringVehicles();
    handleCloseEditModal();
  };

  // Helper function to check if a date field is expiring/expired
  const getFieldExpiringInfo = (vehicle: Vehicle, fieldType: 'insurance' | 'permit' | 'pucc' | 'np'): ExpiringField | null => {
    const expiringFields = getExpiringFields(vehicle);
    return expiringFields.find(f => f.type === fieldType) || null;
  };

  // Helper function to get text styling for expiring fields
  const getTextClassName = (expiringInfo: ExpiringField | null): string => {
    if (!expiringInfo) {
      return 'text-sm text-gray-900 dark:text-white';
    }

    const baseClasses = 'text-sm font-semibold';
    if (expiringInfo.isExpired) {
      return `${baseClasses} text-red-700 dark:text-red-400`;
    }

    switch (expiringInfo.priority) {
      case 'urgent':
        return `${baseClasses} text-red-600 dark:text-red-400`;
      case 'high':
        return `${baseClasses} text-orange-600 dark:text-orange-400`;
      case 'medium':
        return `${baseClasses} text-yellow-600 dark:text-yellow-400`;
      case 'low':
        return `${baseClasses} text-blue-600 dark:text-blue-400`;
      default:
        return `${baseClasses} text-gray-900 dark:text-white`;
    }
  };

  // Helper function to get date display with badge
  const renderDateCell = (date: string | null | undefined, expiringInfo: ExpiringField | null) => {
    if (!date) {
      return <span className="text-gray-500 dark:text-gray-400">N/A</span>;
    }

    const formattedDate = formatDateToIST(date);
    
    if (!expiringInfo) {
      return <span className="text-sm text-gray-900 dark:text-white">{formattedDate}</span>;
    }

    const daysText = expiringInfo.isExpired
      ? `Expired ${Math.abs(expiringInfo.daysRemaining)}d ago`
      : `${expiringInfo.daysRemaining}d remaining`;

    return (
      <div className="flex flex-col gap-1">
        <span className={getTextClassName(expiringInfo)}>{formattedDate}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${getPriorityColor(expiringInfo.priority, expiringInfo.isExpired)}`}>
          {daysText}
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Header Section */}
      <div className="col-span-12">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Vehicles with Expiring/Expired Due Dates
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                List of all vehicles with expired or expiring due dates
              </p>
            </div>
            <button
              onClick={() => router.push('/vehicles')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back to Vehicles
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="col-span-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Expiring Vehicles List ({vehicles.length})
              </h2>
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
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading vehicles...</span>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && vehicles.length === 0 && !error && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No vehicles with expiring dates
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  All vehicle documents are up to date.
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
                    {vehicles.map((vehicle: Vehicle) => {
                      const insuranceInfo = getFieldExpiringInfo(vehicle, 'insurance');
                      const permitInfo = getFieldExpiringInfo(vehicle, 'permit');
                      const puccInfo = getFieldExpiringInfo(vehicle, 'pucc');
                      const npInfo = getFieldExpiringInfo(vehicle, 'np');

                      return (
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
                                {/* {expiringFields.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {expiringFields.map((field) => (
                                      <span
                                        key={field.type}
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(field.priority, field.isExpired)}`}
                                        title={field.isExpired ? `Expired ${Math.abs(field.daysRemaining)}d ago` : `${field.daysRemaining}d remaining`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${getReminderTypeColor(field.type)}`}></span>
                                        {field.label}
                                      </span>
                                    ))}
                                  </div>
                                )} */}
                              </div>
                            </div>
                          </td>
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
                            {renderDateCell(vehicle.insuranceDate, insuranceInfo)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {vehicle.taxDueDate ? formatDateToIST(vehicle.taxDueDate) : <span className="text-gray-500 dark:text-gray-400">N/A</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderDateCell(vehicle.permitDate, permitInfo)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderDateCell(vehicle.puccDate, puccInfo)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderDateCell(vehicle.npValidUpto, npInfo)}
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
                                onClick={() => handleEditVehicle(vehicle)}
                                className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                title="Edit vehicle"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
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
          </div>
        </div>
      </div>

      {/* Vehicle Edit Modal */}
      <VehicleEditModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        vehicle={selectedVehicle}
        onSuccess={handleVehicleUpdated}
      />
    </div>
  );
}
