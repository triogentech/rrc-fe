"use client";
import React, { useEffect } from 'react';
import { useVehicles } from '@/store/hooks/useVehicles';
import type { Vehicle } from '@/store/api/types';

interface VehicleViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

export default function VehicleViewModal({ isOpen, onClose, vehicle }: VehicleViewModalProps) {
  const { getVehicleStatusDisplayName, getVehicleStatusColor, getVehicleTypeDisplayName } = useVehicles();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !vehicle) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Modal content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Vehicle Details
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {vehicle.vehicleNumber} - {vehicle.model}
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vehicle Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Vehicle Number
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {vehicle.vehicleNumber}
                  </p>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Model
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {vehicle.model}
                  </p>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Type
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {getVehicleTypeDisplayName(vehicle.type)}
                  </p>
                </div>

                {/* Current Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Current Status
                  </label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVehicleStatusColor(vehicle.currentStatus)}`}>
                    {getVehicleStatusDisplayName(vehicle.currentStatus)}
                  </span>
                </div>

                {/* Active Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Active Status
                  </label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vehicle.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {vehicle.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Document ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Document ID
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">
                    {vehicle.documentId}
                  </p>
                </div>

                {/* Created At */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Created At
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDate(vehicle.createdAt)}
                  </p>
                </div>

                {/* Updated At */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Updated At
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDate(vehicle.updatedAt)}
                  </p>
                </div>

                {/* Published At */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Published At
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDate(vehicle.publishedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
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
