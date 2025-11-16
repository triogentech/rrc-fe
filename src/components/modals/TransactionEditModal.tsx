"use client";
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import TransactionEditForm from '../forms/TransactionEditForm';
import type { Transaction } from '@/store/api/types';

interface TransactionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSuccess?: (transaction: Transaction) => void;
}

export default function TransactionEditModal({ isOpen, onClose, transaction, onSuccess }: TransactionEditModalProps) {
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

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto">
      {/* Backdrop that covers the entire screen including header */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-4xl mx-auto max-h-[90vh]">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Modal content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Transaction
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Update transaction details
              </p>
            </div>

            {/* Form */}
            <div className="px-6 py-6 overflow-y-auto flex-1">
              <TransactionEditForm
                transaction={transaction}
                onSuccess={(updatedTransaction: Transaction) => {
                  onSuccess?.(updatedTransaction);
                  onClose();
                }}
                onCancel={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

