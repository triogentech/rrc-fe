"use client";
import React, { useEffect, useState } from 'react';
import { useVehicles } from '@/store/hooks/useVehicles';
import type { Vehicle, Trip } from '@/store/api/types';
import { getUserDisplayName, getUserEmail } from '@/utils/userDisplay';

export default function IdleVehiclesPage() {
  const {
    vehicles,
    isLoading,
    error,
    getVehicles,
    getVehicleDisplayName,
    clearVehiclesError,
  } = useVehicles();

  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set());
  const [, setTick] = useState(0); // For real-time updates

  // Fetch vehicles on component mount
  useEffect(() => {
    getVehicles();
  }, [getVehicles]);

  // Force re-render periodically to update "Idle Since" in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Filter for idle vehicles only
  const idleVehicles = vehicles.filter(vehicle => vehicle.currentStatus === 'idle');

  // Toggle vehicle expansion
  const toggleVehicleExpansion = (vehicleId: string) => {
    setExpandedVehicles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else {
        newSet.add(vehicleId);
      }
      return newSet;
    });
  };

  // Get completed trips for a vehicle
  const getCompletedTrips = (vehicle: Vehicle): Trip[] => {
    if (!vehicle.trips || !Array.isArray(vehicle.trips)) {
      return [];
    }
    
    // Filter for completed trips only
    // When populated, trips can be Trip objects; when not populated, they are strings
    const completedTrips: Trip[] = [];
    
    for (const trip of vehicle.trips) {
      // Check if trip is a populated Trip object (not just a string ID)
      if (typeof trip === 'object' && trip !== null && 'currentStatus' in trip) {
        const tripObj = trip as unknown as Trip;
        if (tripObj.currentStatus === 'completed') {
          completedTrips.push(tripObj);
        }
      }
    }
    
    // Sort by actualEndTime (most recent first)
    return completedTrips.sort((a, b) => {
      const timeA = a.actualEndTime ? new Date(a.actualEndTime).getTime() : 0;
      const timeB = b.actualEndTime ? new Date(b.actualEndTime).getTime() : 0;
      return timeB - timeA; // Descending order
    });
  };

  // Get the last completed trip for a vehicle
  const getLastCompletedTrip = (vehicle: Vehicle): Trip | null => {
    const completedTrips = getCompletedTrips(vehicle);
    return completedTrips.length > 0 ? completedTrips[0] : null;
  };

  // Calculate idle time in hours
  const getIdleTimeInHours = (vehicle: Vehicle): string => {
    const lastTrip = getLastCompletedTrip(vehicle);
    
    if (!lastTrip || !lastTrip.actualEndTime) {
      // If no completed trip, use updatedAt as fallback
      if (vehicle.updatedAt) {
        const updatedAt = new Date(vehicle.updatedAt);
        const now = new Date();
        const diffInMs = now.getTime() - updatedAt.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);
        return `${Math.round(diffInHours * 10) / 10}h`;
      }
      return 'N/A';
    }
    
    const completedAt = new Date(lastTrip.actualEndTime);
    const now = new Date();
    const diffInMs = now.getTime() - completedAt.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    // Always show in hours format with 1 decimal place
    if (diffInHours < 0.1) {
      return '0.1h';
    }
    return `${Math.round(diffInHours * 10) / 10}h`;
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Idle Vehicles</h1>
          <p className="text-gray-600 dark:text-gray-400">View all vehicles that have completed their trips and are currently idle</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="col-span-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Idle Vehicles List
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({idleVehicles.length} {idleVehicles.length === 1 ? 'vehicle' : 'vehicles'})
                </span>
              </h2>
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

            {/* Empty State */}
            {!isLoading && idleVehicles.length === 0 && !error && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0M15 17a2 2 0 104 0" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No idle vehicles</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">All vehicles are currently assigned or in transit.</p>
              </div>
            )}

            {/* Vehicles Table */}
            {!isLoading && idleVehicles.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Vehicle
                      </th>
                      
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Last Trip Route
                      </th>
                      
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Idle Since
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Completed Trips
                      </th>
                      
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Updated By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {idleVehicles.map((vehicle: Vehicle) => {
                      const completedTrips = getCompletedTrips(vehicle);
                      const lastTrip = getLastCompletedTrip(vehicle);
                      const isExpanded = expandedVehicles.has(vehicle.documentId);
                      
                      return (
                        <React.Fragment key={vehicle.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {vehicle.model}
                              </div>
                            </div>
                          </div>
                        </td>
                       
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Idle
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {lastTrip ? (
                              <span>
                                {lastTrip.startPoint || 'N/A'} → {lastTrip.endPoint || 'N/A'}
                              </span>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">N/A</span>
                            )}
                          </div>
                        </td>
                        
                            
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getIdleTimeInHours(vehicle)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          {completedTrips.length > 0 ? (
                            <button
                              onClick={() => toggleVehicleExpansion(vehicle.documentId)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors"
                            >
                              <svg 
                                className={`w-3 h-3 mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              {completedTrips.length} {completedTrips.length === 1 ? 'trip' : 'trips'}
                            </button>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">No completed trips</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {vehicle.cstmUpdatedBy ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {getUserDisplayName(vehicle.cstmUpdatedBy)}
                                </span>
                                {getUserEmail(vehicle.cstmUpdatedBy) && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {getUserEmail(vehicle.cstmUpdatedBy)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">N/A</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Row - Trip Details */}
                      {isExpanded && completedTrips.length > 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                Completed Trips for {vehicle.vehicleNumber}
                              </h4>
                              <div className="space-y-2">
                                {completedTrips.map((trip: Trip) => (
                                  <div 
                                    key={trip.id} 
                                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Trip Number</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                          {trip.tripNumber}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Route</p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                          {trip.startPoint || 'N/A'} → {trip.endPoint || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Distance</p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                          {trip.totalTripDistanceInKM ? `${trip.totalTripDistanceInKM} km` : 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Completed On</p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                          {trip.actualEndTime ? formatDate(trip.actualEndTime) : 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

