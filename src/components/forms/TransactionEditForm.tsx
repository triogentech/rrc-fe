"use client";
import React, { useState, useEffect } from 'react';
import { useTransactions } from '@/store/hooks/useTransactions';
import { useTrips } from '@/store/hooks/useTrips';
import type { Transaction, TransactionUpdateRequest } from '@/store/api/types';
import { showSuccessToast, showErrorToast } from '@/utils/toastHelper';

interface TransactionEditFormProps {
  transaction: Transaction;
  onSuccess?: (transaction: Transaction) => void;
  onCancel?: () => void;
}

export default function TransactionEditForm({ transaction, onSuccess, onCancel }: TransactionEditFormProps) {
  const { updateTransaction, isLoading } = useTransactions();
  const { trips, isLoading: loadingTrips, getTrips } = useTrips();

  const [formData, setFormData] = useState<TransactionUpdateRequest>({
    type: transaction.type,
    amount: transaction.amount,
    description: transaction.description,
    transactionStatus: transaction.transactionStatus,
    currency: transaction.currency,
    method: transaction.method,
    trip: typeof transaction.trip === 'object' && transaction.trip ? transaction.trip.documentId : 
          typeof transaction.trip === 'string' ? transaction.trip : '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch trips for selection
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        await getTrips({ page: 1, limit: 100 });
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };

    fetchTrips();
  }, [getTrips]);

  const handleInputChange = (field: keyof TransactionUpdateRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.currency || !formData.currency.trim()) {
      newErrors.currency = 'Currency is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showErrorToast('Please fill in all required fields correctly');
      return;
    }

    try {
      // Prepare update data
      const updateData: TransactionUpdateRequest = {
        type: formData.type,
        amount: formData.amount,
        description: formData.description,
        transactionStatus: formData.transactionStatus,
        currency: formData.currency,
        method: formData.method,
      };

      // Only include trip if it's not empty
      if (formData.trip && formData.trip.toString().trim() !== '') {
        updateData.trip = formData.trip.toString();
      } else {
        updateData.trip = undefined;
      }

      console.log('Updating transaction with data:', updateData);

      const updatedTransaction = await updateTransaction(transaction.documentId, updateData);
      if (updatedTransaction) {
        showSuccessToast(`Transaction "${updatedTransaction.transactionId}" updated successfully!`);
        onSuccess?.(updatedTransaction);
      }
    } catch (error) {
      console.error('Failed to update transaction:', error);
      showErrorToast(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          >
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">₹</span>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="0.00"
              disabled={isLoading}
              min="0"
              step="0.01"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Currency <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.currency}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.currency ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isLoading}
          >
            <option value="INR">INR</option>
          </select>
          {errors.currency && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currency}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.transactionStatus}
            onChange={(e) => handleInputChange('transactionStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          >
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.method}
            onChange={(e) => handleInputChange('method', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          >
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="wallet">Wallet</option>
            <option value="cash">Cash</option>
          </select>
        </div>

        {/* Trip Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Associated Trip (Optional)
          </label>
          <select
            value={formData.trip || ''}
            onChange={(e) => handleInputChange('trip', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading || loadingTrips}
          >
            <option value="">No Trip Associated</option>
            {trips.map((trip) => (
              <option key={trip.documentId} value={trip.documentId}>
                {trip.tripNumber} - {trip.startPoint} → {trip.endPoint}
              </option>
            ))}
          </select>
          {loadingTrips && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Loading trips...</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none ${
            errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Enter transaction description"
          disabled={isLoading}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </span>
          ) : (
            'Update Transaction'
          )}
        </button>
      </div>
    </form>
  );
}

