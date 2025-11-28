"use client";
import React, { useEffect } from 'react';
import type { Trip } from '@/store/api/types';
import { useTrips } from '@/store/hooks/useTrips';
import { formatDateTimeToIST } from '@/utils/dateFormatter';
import { getUserDisplayName, getUserEmail } from '@/utils/userDisplay';

interface TripViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
}

export default function TripViewModal({ isOpen, onClose, trip }: TripViewModalProps) {
  const { getTripDisplayName, getTripStatusDisplayName, getTripStatusColor, getTripDuration } = useTrips();

  // Calculate balance amount (Freight Amount - Advance Amount)
  const getBalanceAmount = (trip: Trip): string => {
    const freightAmount = trip.freightTotalAmount || 0;
    const advanceAmount = trip.advanceAmount || 0;
    const balanceAmount = freightAmount - advanceAmount;
    
    return `₹${balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate estimated TAT (Turn Around Time) in hours
  const getEstimatedTAT = (trip: Trip): string => {
    if (trip.totalTripTimeInMinutes && trip.totalTripTimeInMinutes > 0) {
      const hours = trip.totalTripTimeInMinutes / 60;
      return `${Math.round(hours * 10) / 10}h`;
    }
    
    if (!trip.estimatedStartTime || !trip.estimatedEndTime) {
      return 'N/A';
    }
    
    const startTime = new Date(trip.estimatedStartTime);
    const endTime = new Date(trip.estimatedEndTime);
    const diffInMs = endTime.getTime() - startTime.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 0.1) {
      return '0.1h';
    }
    return `${Math.round(diffInHours * 10) / 10}h`;
  };

  // Calculate running TAT (Turn Around Time) in hours
  const getRunningTAT = (trip: Trip): string => {
    if (trip.currentStatus === 'completed' && trip.actualEndTime) {
      if (!trip.estimatedStartTime || !trip.actualEndTime) {
        return 'N/A';
      }
      
      const startTime = new Date(trip.estimatedStartTime);
      const endTime = new Date(trip.actualEndTime);
      const diffInMs = endTime.getTime() - startTime.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);
      
      if (diffInHours < 0.1) {
        return '0.1h';
      }
      return `${Math.round(diffInHours * 10) / 10}h`;
    }
    
    if (trip.currentStatus === 'in-transit' || trip.currentStatus === 'created') {
      if (!trip.estimatedStartTime) {
        return 'N/A';
      }
      
      const startTime = new Date(trip.estimatedStartTime);
      const now = new Date();
      const diffInMs = now.getTime() - startTime.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);
      
      if (diffInHours < 0) {
        return '0.0h';
      }
      if (diffInHours < 0.1) {
        return '0.1h';
      }
      return `${Math.round(diffInHours * 10) / 10}h`;
    }
    
    return 'N/A';
  };

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
        <div className="relative w-full max-w-5xl mx-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trip Details: {getTripDisplayName(trip)}</h3>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trip Number</p>
                    <p className="text-gray-900 dark:text-white font-medium">{trip.tripNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTripStatusColor(trip.currentStatus)}`}>
                    {getTripStatusDisplayName(trip.currentStatus)}
                  </span>
                </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Point</p>
                    <p className="text-gray-900 dark:text-white">{trip.startPoint || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">End Point</p>
                    <p className="text-gray-900 dark:text-white">{trip.endPoint || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Distance (KM)</p>
                    <p className="text-gray-900 dark:text-white">{trip.totalTripDistanceInKM ? `${trip.totalTripDistanceInKM} km` : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Time Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Time Information</h4>
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Start Time</p>
                    <p className="text-gray-900 dark:text-white">{formatDateTimeToIST(trip.estimatedStartTime)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated End Time</p>
                    <p className="text-gray-900 dark:text-white">{formatDateTimeToIST(trip.estimatedEndTime)}</p>
                  </div>
                  {trip.actualEndTime && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Actual End Time</p>
                      <p className="text-gray-900 dark:text-white">{formatDateTimeToIST(trip.actualEndTime)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated TAT</p>
                    <p className="text-gray-900 dark:text-white">{getEstimatedTAT(trip)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Running TAT</p>
                    <p className="text-gray-900 dark:text-white">{getRunningTAT(trip)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="text-gray-900 dark:text-white">{getTripDuration(trip)}</p>
                </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Financial Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Freight Amount</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {`₹${(trip.freightTotalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Advance Amount</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {`₹${(trip.advanceAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance Amount</p>
                    <p className="text-gray-900 dark:text-white font-medium">{getBalanceAmount(trip)}</p>
                  </div>
                </div>
              </div>

              {/* Assignment Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Assignment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle</p>
                    {trip.vehicle ? (
                      typeof trip.vehicle === 'string' ? (
                        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                      ) : (
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{trip.vehicle.vehicleNumber}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {trip.vehicle.model} • {trip.vehicle.type}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Status: <span className={`font-medium ${trip.vehicle.currentStatus === 'idle' ? 'text-green-600' : trip.vehicle.currentStatus === 'assigned' ? 'text-yellow-600' : 'text-red-600'}`}>
                              {trip.vehicle.currentStatus}
                            </span>
                          </p>
                        </div>
                      )
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No vehicle assigned</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Driver</p>
                    {trip.driver ? (
                      typeof trip.driver === 'string' ? (
                        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                      ) : (
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{trip.driver.fullName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {trip.driver.countryDialCode} {trip.driver.contactNumber}
                          </p>
                        </div>
                      )
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No driver assigned</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Logistics Provider</p>
                    {trip.logisticsProvider ? (
                      typeof trip.logisticsProvider === 'string' ? (
                        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                      ) : (
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{trip.logisticsProvider.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {trip.logisticsProvider.contactNumber}
                          </p>
                        </div>
                      )
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No provider assigned</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Additional Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</p>
                    {trip.cstmCreatedBy ? (
                <div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {getUserDisplayName(trip.cstmCreatedBy)}
                        </p>
                        {getUserEmail(trip.cstmCreatedBy) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {getUserEmail(trip.cstmCreatedBy)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">N/A</p>
                    )}
                </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated By</p>
                    {trip.cstmUpdatedBy ? (
                  <div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {getUserDisplayName(trip.cstmUpdatedBy)}
                        </p>
                        {getUserEmail(trip.cstmUpdatedBy) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {getUserEmail(trip.cstmUpdatedBy)}
                          </p>
                        )}
                  </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">N/A</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</p>
                    <p className="text-gray-900 dark:text-white">{formatDateTimeToIST(trip.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                    <p className="text-gray-900 dark:text-white">{formatDateTimeToIST(trip.updatedAt)}</p>
                  </div>
                {trip.startPointCoords && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Point Coordinates</p>
                      <p className="text-gray-900 dark:text-white text-xs break-all">{trip.startPointCoords}</p>
                  </div>
                )}
                {trip.endPointCoords && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">End Point Coordinates</p>
                      <p className="text-gray-900 dark:text-white text-xs break-all">{trip.endPointCoords}</p>
                  </div>
                )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end flex-shrink-0">
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
