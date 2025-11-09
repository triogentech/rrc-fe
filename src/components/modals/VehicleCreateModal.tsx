"use client";
import React, { useEffect } from 'react';
import VehicleCreateForm from '../forms/VehicleCreateForm';
import type { Vehicle } from '@/store/api/types';

interface VehicleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (vehicle: Vehicle) => void;
}

export default function VehicleCreateModal({ isOpen, onClose, onSuccess }: VehicleCreateModalProps) {
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

  if (!isOpen) return null;

  const handleSuccess = (vehicle: Vehicle) => {
    onSuccess?.(vehicle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto">
      {/* Backdrop that covers the entire screen including header */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-4xl mx-auto">
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
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New Vehicle
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Add a new vehicle to your fleet
              </p>
            </div>

            {/* Form */}
            <div className="px-6 py-6 overflow-y-auto flex-1">
              <VehicleCreateForm
                onSuccess={handleSuccess}
                onCancel={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
