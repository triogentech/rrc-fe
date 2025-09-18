"use client";
import React, { useEffect } from 'react';
import TripCreateForm from '../forms/TripCreateForm';
import type { Trip } from '@/store/api/types';

interface TripCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (trip: Trip) => void;
}

export default function TripCreateModal({ isOpen, onClose, onSuccess }: TripCreateModalProps) {
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

  if (!isOpen) return null;

  const handleSuccess = (trip: Trip) => {
    onSuccess?.(trip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-4xl mx-auto">
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Trip</h3>
            </div>
            <div className="p-6">
              <TripCreateForm onSuccess={handleSuccess} onCancel={onClose} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
