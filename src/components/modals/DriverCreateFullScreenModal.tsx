"use client";
import React, { useEffect } from 'react';
import DriverCreateForm from '../forms/DriverCreateForm';
import type { Driver } from '@/store/api/types';

interface DriverCreateFullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (driver: Driver) => void;
}

export default function DriverCreateFullScreenModal({ isOpen, onClose, onSuccess }: DriverCreateFullScreenModalProps) {
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

  const handleSuccess = (driver: Driver) => {
    onSuccess?.(driver);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 dark:bg-gray-900">
      {/* Full screen modal */}
      <div className="min-h-screen flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Add New Driver</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            <DriverCreateForm 
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
