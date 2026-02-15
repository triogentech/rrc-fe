"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import type { Vehicle } from '@/store/api/types';
import { getExpiringFields, getPriorityColor } from '@/utils/vehicleExpiringFields';
import { formatDateToIST } from '@/utils/dateFormatter';

interface ExpiredVehiclesModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  getVehicleDisplayName: (vehicle: Vehicle) => string;
}

export default function ExpiredVehiclesModal({
  isOpen,
  onClose,
  vehicles,
  getVehicleDisplayName,
}: ExpiredVehiclesModalProps) {
  const router = useRouter();

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleViewVehicles = () => {
    onClose();
    router.push('/vehicles');
  };

  const handleViewExpiring = () => {
    onClose();
    router.push('/vehicles/expiring');
  };

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-2xl mx-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Modal content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Vehicle Document Expiry Alert
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {vehicles.length > 0 
                      ? `You have ${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} with expired or expiring documents that require immediate attention.`
                      : 'No vehicles with expired documents found.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {vehicles.length > 0 ? (
                <div className="space-y-3">
                  {vehicles.map((vehicle) => {
                    const expiringFields = getExpiringFields(vehicle);
                    const expiredFields = expiringFields.filter(f => f.isExpired);
                    const mostUrgent = expiringFields[0];
                    
                    return (
                      <div
                        key={vehicle.documentId}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                  {vehicle.vehicleNumber.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {getVehicleDisplayName(vehicle)}
                              </h4>
                            </div>
                            
                            <div className="space-y-1.5">
                              {expiredFields.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {expiredFields.map((field, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                                    >
                                      {field.label} - Expired
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              {expiringFields.filter(f => !f.isExpired).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {expiringFields
                                    .filter(f => !f.isExpired)
                                    .slice(0, 3)
                                    .map((field, idx) => (
                                      <span
                                        key={idx}
                                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(field.priority, field.isExpired)}`}
                                      >
                                        {field.label} - {field.daysRemaining} days
                                      </span>
                                    ))}
                                </div>
                              )}
                              
                              {mostUrgent && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {mostUrgent.isExpired ? (
                                    <span className="text-red-600 dark:text-red-400">
                                      Expired on {formatDateToIST(mostUrgent.expiryDate)}
                                    </span>
                                  ) : (
                                    <span>
                                      Expires on {formatDateToIST(mostUrgent.expiryDate)} ({mostUrgent.daysRemaining} days remaining)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No vehicles with expired documents found.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
              <div className="flex justify-between items-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Dismiss
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleViewVehicles}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    View All Vehicles
                  </button>
                  <button
                    onClick={handleViewExpiring}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg transition-colors"
                  >
                    View Expiring Vehicles
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
