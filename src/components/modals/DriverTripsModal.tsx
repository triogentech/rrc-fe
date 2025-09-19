"use client";
import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/modal';
import Button from '../ui/button/Button';
import type { Driver, Trip } from '@/store/api/types';

interface DriverTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
}

export default function DriverTripsModal({ isOpen, onClose, driver }: DriverTripsModalProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch trips when modal opens
  useEffect(() => {
    if (isOpen && driver) {
      fetchDriverTrips();
    }
  }, [isOpen, driver]);

  const fetchDriverTrips = async () => {
    if (!driver) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use the trips data that's already populated in the driver object
      if (driver.trips && Array.isArray(driver.trips)) {
        setTrips(driver.trips);
      } else {
        setTrips([]);
      }
    } catch (err) {
      console.error('Error fetching driver trips:', err);
      setError('Failed to fetch trips');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTripDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTripStatusColor = (status: string) => {
    switch (status) {
      case 'created':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in-transit':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTripStatusDisplayName = (status: string) => {
    switch (status) {
      case 'created':
        return 'Created';
      case 'in-transit':
        return 'In Transit';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const getTripDuration = (trip: Trip) => {
    if (!trip.estimatedStartTime || !trip.estimatedEndTime) return 'N/A';
    
    const start = new Date(trip.estimatedStartTime);
    const end = new Date(trip.estimatedEndTime);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else {
      return `${diffHours}h`;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl m-4">
      <div className="no-scrollbar relative w-full max-w-6xl overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Driver Trips - {driver?.fullName}
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            View all trips assigned to this driver
          </p>
        </div>

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
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading trips...</span>
          </div>
        )}

        {/* No Trips Message */}
        {!isLoading && trips.length === 0 && !error && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No trips found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This driver has no trips assigned yet.</p>
          </div>
        )}

        {/* Trips Table */}
        {!isLoading && trips.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
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
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {trips.map((trip) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

       

        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
