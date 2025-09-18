"use client";
import React, { useEffect } from 'react';
import type { Trip } from '@/store/api/types';
import { useTrips } from '@/store/hooks/useTrips';

interface TripViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
}

export default function TripViewModal({ isOpen, onClose, trip }: TripViewModalProps) {
  const { getTripDisplayName, getTripStatusDisplayName, getTripStatusColor, formatTripDate, getTripDuration } = useTrips();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !trip) return null;

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-2xl mx-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all w-full">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trip Details: {getTripDisplayName(trip)}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trip Number</p>
                  <p className="text-gray-900 dark:text-white">{trip.tripNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTripStatusColor(trip.currentStatus)}`}>
                    {getTripStatusDisplayName(trip.currentStatus)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Start Time</p>
                  <p className="text-gray-900 dark:text-white">{formatTripDate(trip.estimatedStartTime)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated End Time</p>
                  <p className="text-gray-900 dark:text-white">{formatTripDate(trip.estimatedEndTime)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="text-gray-900 dark:text-white">{getTripDuration(trip)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Document ID</p>
                  <p className="text-gray-900 dark:text-white">{trip.documentId}</p>
                </div>
                {trip.actualEndTime && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Actual End Time</p>
                    <p className="text-gray-900 dark:text-white">{formatTripDate(trip.actualEndTime)}</p>
                  </div>
                )}
                {trip.startPointCoords && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Point Coordinates</p>
                    <p className="text-gray-900 dark:text-white">{trip.startPointCoords}</p>
                  </div>
                )}
                {trip.endPointCoords && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">End Point Coordinates</p>
                    <p className="text-gray-900 dark:text-white">{trip.endPointCoords}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</p>
                  <p className="text-gray-900 dark:text-white">{formatTripDate(trip.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                  <p className="text-gray-900 dark:text-white">{formatTripDate(trip.updatedAt)}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
