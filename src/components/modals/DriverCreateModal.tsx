"use client";
import React, { useEffect } from 'react';
import DriverCreateForm from '../forms/DriverCreateForm';
import type { Driver } from '@/store/api/types';

interface DriverCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (driver: Driver) => void;
}

export default function DriverCreateModal({ isOpen, onClose, onSuccess }: DriverCreateModalProps) {
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
          
          {/* Form */}
          <DriverCreateForm 
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
