"use client";
import React, { useEffect } from 'react';
import StaffCreateForm from '../forms/StaffCreateForm';
import type { Staff } from '@/store/api/types';

interface StaffCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (staff: Staff) => void;
}

export default function StaffCreateModal({ isOpen, onClose, onSuccess }: StaffCreateModalProps) {
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

  const handleSuccess = (staff: Staff) => {
    onSuccess?.(staff);
    onClose();
  };

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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Staff Member</h3>
            </div>
            <div className="p-6">
              <StaffCreateForm onSuccess={handleSuccess} onCancel={onClose} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
