"use client";
import React, { useState, useEffect } from 'react';
import { tripService } from '@/store/api/services';
import type { Trip } from '@/store/api/types';
import { showErrorToast } from '@/utils/toastHelper';
import { formatDateTimeToIST } from '@/utils/dateFormatter';

export default function EndingTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    fetchEndingTrips();
  }, []);

  const fetchEndingTrips = async (page?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all in-transit trips (or all trips if needed)
      // We'll filter client-side for trips that have surpassed their end time
      const response = await tripService.getTrips({
        page: page || 1,
        limit: 100, // Fetch more to filter client-side
        status: 'in-transit', // Only get in-transit trips
      });
      
      console.log('Trips fetch response:', response);
      
      type PaginationType = {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
      
      let tripsData: Trip[] = [];
      let paginationData: PaginationType | null = null;
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          tripsData = response.data;
        } else if (typeof response.data === 'object' && 'data' in response.data) {
          const strapiResponse = response.data as unknown as { data: Trip[]; meta?: { pagination?: PaginationType } };
          if (Array.isArray(strapiResponse.data)) {
            tripsData = strapiResponse.data;
          }
          if (strapiResponse.meta?.pagination) {
            paginationData = strapiResponse.meta.pagination;
          }
        }
      }
      
      const responseWithMeta = response as typeof response & { meta?: { pagination?: PaginationType } };
      if (responseWithMeta.meta?.pagination) {
        paginationData = responseWithMeta.meta.pagination;
      }
      
      // Filter trips that have surpassed their estimated end time
      const now = new Date();
      const overdueTrips = tripsData.filter((trip) => {
        if (!trip.estimatedEndTime) return false;
        const endTime = new Date(trip.estimatedEndTime);
        return endTime < now; // Trip has passed its estimated end time
      });
      
      // Sort by how overdue they are (most overdue first)
      overdueTrips.sort((a, b) => {
        if (!a.estimatedEndTime || !b.estimatedEndTime) return 0;
        const timeA = new Date(a.estimatedEndTime).getTime();
        const timeB = new Date(b.estimatedEndTime).getTime();
        return timeA - timeB; // Oldest first (most overdue)
      });
      
      setTrips(overdueTrips);
      
      // Update pagination to reflect filtered results
      if (paginationData) {
        const pageSize = paginationData.pageSize || 25;
        setPagination({
          page: paginationData.page,
          pageSize: pageSize,
          total: overdueTrips.length,
          pageCount: Math.ceil(overdueTrips.length / pageSize),
        });
      } else {
        // Set default pagination if none exists
        setPagination({
          page: 1,
          pageSize: 25,
          total: overdueTrips.length,
          pageCount: Math.ceil(overdueTrips.length / 25),
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch overdue trips';
      setError(errorMessage);
      console.error('Error fetching overdue trips:', err);
      showErrorToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get vehicle number
  const getVehicleNumber = (vehicle: unknown): string => {
    if (!vehicle) return 'N/A';
    if (typeof vehicle === 'string') return 'N/A';
    if (typeof vehicle === 'object') {
      const vehicleObj = vehicle as Record<string, unknown>;
      return String(vehicleObj.vehicleNumber || 'N/A');
    }
    return 'N/A';
  };

  // Helper function to format route (from -> to)
  const getRoute = (trip: Trip): React.ReactNode => {
    const from = trip.startPoint || 'N/A';
    const to = trip.endPoint || 'N/A';
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-600"></div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-white">{from}</div>
        </div>
        <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-white">{to}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-600"></div>
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
        </div>
      </div>
    );
  };

  // Helper function to get end time with overdue indicator
  const getEndTime = (trip: Trip): React.ReactNode => {
    if (!trip.estimatedEndTime) return 'N/A';
    
    const endTime = new Date(trip.estimatedEndTime);
    const now = new Date();
    const isOverdue = endTime < now;
    
    // Calculate how overdue
    const diffMs = now.getTime() - endTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let overdueText = '';
    if (diffHours > 0) {
      overdueText = `${diffHours}h ${diffMinutes}m overdue`;
    } else if (diffMinutes > 0) {
      overdueText = `${diffMinutes}m overdue`;
    } else {
      overdueText = 'Just overdue';
    }
    
    return (
      <div className="flex flex-col">
        <div className="text-sm text-gray-900 dark:text-white">
          {formatDateTimeToIST(trip.estimatedEndTime)}
        </div>
        {isOverdue && (
          <div className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">
            {overdueText}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overdue Trips</h1>
          <p className="text-gray-600 dark:text-gray-400">View all trips that have surpassed their estimated end time</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading overdue trips...</span>
          </div>
        )}

        {!isLoading && trips.length === 0 && !error && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No overdue trips</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">All trips are on schedule. No trips have surpassed their estimated end time.</p>
          </div>
        )}

        {!isLoading && trips.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Overdue Trips ({trips.length})
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Trips that have passed their estimated end time
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vehicle Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Route
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estimated End Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {trips.map((trip) => (
                    <tr key={trip.documentId || trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      
                      {/* Vehicle Number */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {getVehicleNumber(trip.vehicle)}
                        </div>
                      </td>
                      
                      {/* Route */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {getRoute(trip)}
                        </div>
                      </td>
                      
                      {/* End Time */}
                      <td className="px-6 py-4 whitespace-nowrap">
                          {getEndTime(trip)}
                      </td>
                      
                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Overdue
                        </span>
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchEndingTrips(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Page {pagination.page} of {pagination.pageCount}
                    </span>
                    <button
                      onClick={() => fetchEndingTrips(pagination.page + 1)}
                      disabled={pagination.page === pagination.pageCount}
                      className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

