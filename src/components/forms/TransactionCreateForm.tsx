"use client";
import React, { useState, useEffect } from 'react';
import { useTransactions } from '@/store/hooks/useTransactions';
import { useReduxAuth } from '@/store/hooks/useReduxAuth';
import { useTrips } from '@/store/hooks/useTrips';
import { generateSimplifiedTransactionDetails, generateTransactionId } from '@/utils/transactionDetails';
import type { TransactionCreateRequest, Transaction } from '@/store/api/types';
import { showSuccessToast, showErrorToast } from '@/utils/toastHelper';

interface TransactionCreateFormProps {
  onSuccess?: (transaction: Transaction) => void;
  onCancel?: () => void;
}

export default function TransactionCreateForm({ onSuccess, onCancel }: TransactionCreateFormProps) {
  const { createTransaction, isLoading } = useTransactions();
  const { user } = useReduxAuth();
  const { trips, isLoading: loadingTrips, getTrips } = useTrips();

  const [formData, setFormData] = useState<TransactionCreateRequest & { txnTowards?: string }>({
    transactionId: '', // Will be auto-generated on submit
    type: 'debit',
    amount: 0,
    description: '',
    transactionStatus: 'success',
    currency: 'INR',
    method: 'upi',
    trip: '',
    txnTowards: '',
  });

  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [transactionFromJson, setTransactionFromJson] = useState('');
  const [transactionToJson, setTransactionToJson] = useState('');

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Fetch trips for selection
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        await getTrips({ page: 1, limit: 100 }); // Fetch all trips with a high limit
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };

    fetchTrips();
  }, [getTrips]);

  // Generate Transaction From JSON when from account changes
  useEffect(() => {
    if (fromAccount) {
      const jsonString = generateSimplifiedTransactionDetails(fromAccount);
      setTransactionFromJson(jsonString);
    }
  }, [fromAccount]);

  // Generate Transaction To JSON when to account changes
  useEffect(() => {
    if (toAccount) {
      const jsonString = generateSimplifiedTransactionDetails(toAccount);
      setTransactionToJson(jsonString);
    }
  }, [toAccount]);

  const handleInputChange = (field: keyof (TransactionCreateRequest & { txnTowards?: string }), value: string | number) => {
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



  // Step navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };



  const handleNext = () => {
    if (validateStep(currentStep)) {
      nextStep();
    }
  };

  const handlePrevious = () => {
    prevStep();
  };

  // Helper function to count digits in account number
  const countDigits = (accountNumber: string): number => {
    return (accountNumber.match(/\d/g) || []).length;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Basic Transaction Details & Account Details
        if (!formData.amount || formData.amount <= 0) {
          newErrors.amount = 'Amount must be greater than 0';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        }
        if (!formData.currency.trim()) {
          newErrors.currency = 'Currency is required';
        }
        if (!fromAccount.trim()) {
          newErrors.fromAccount = 'From Account is required';
        } else {
          const fromAccountDigits = countDigits(fromAccount);
          if (fromAccountDigits > 18) {
            newErrors.fromAccount = 'Account number cannot exceed 18 digits';
          }
        }
        if (!toAccount.trim()) {
          newErrors.toAccount = 'To Account is required';
        } else {
          const toAccountDigits = countDigits(toAccount);
          if (toAccountDigits > 18) {
            newErrors.toAccount = 'Account number cannot exceed 18 digits';
          }
        }
        if (!formData.txnTowards || !formData.txnTowards.trim()) {
          newErrors.txnTowards = 'Transaction For is required';
        }
        break;
      
      case 2: // Review
        // All validations from previous steps
        return validateForm();
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.currency.trim()) {
      newErrors.currency = 'Currency is required';
    }
    if (!fromAccount.trim()) {
      newErrors.fromAccount = 'From Account is required';
    } else {
      const fromAccountDigits = countDigits(fromAccount);
      if (fromAccountDigits > 18) {
        newErrors.fromAccount = 'Account number cannot exceed 18 digits';
      }
    }
    if (!toAccount.trim()) {
      newErrors.toAccount = 'To Account is required';
    } else {
      const toAccountDigits = countDigits(toAccount);
      if (toAccountDigits > 18) {
        newErrors.toAccount = 'Account number cannot exceed 18 digits';
      }
    }
    if (!formData.txnTowards || !formData.txnTowards.trim()) {
      newErrors.txnTowards = 'Transaction For is required';
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
      // Auto-generate transaction ID
      const generatedTransactionId = generateTransactionId();
      
      // Create the transaction with JSON details
      const transactionData: TransactionCreateRequest & { transactionFrom?: string; transactionTo?: string; txnTowards?: string } = {
        transactionId: generatedTransactionId,
        type: formData.type,
        amount: formData.amount,
        description: formData.description,
        transactionStatus: formData.transactionStatus,
        currency: formData.currency,
        method: formData.method,
        // Add the JSON strings as additional fields
        transactionFrom: transactionFromJson,
        transactionTo: transactionToJson,
        txnTowards: formData.txnTowards,
      };

      // Only include trip if it's not empty
      if (formData.trip && formData.trip.trim() !== '') {
        transactionData.trip = formData.trip;
      }

      // Handle relations separately if needed
      const relationsData: Record<string, string> = {};
      
      // Add user relations if user exists
      if (user?.documentId || user?.id) {
        relationsData.cstmCreatedBy = user.documentId || user.id;
        relationsData.cstmUpdatedBy = user.documentId || user.id;
      }

      // Merge transaction data with relations
      const finalData = { ...transactionData, ...relationsData };

      console.log('Creating transaction with data:', finalData);
      console.log('Transaction From JSON:', transactionFromJson);
      console.log('Transaction To JSON:', transactionToJson);

      const newTransaction = await createTransaction(finalData);
      if (newTransaction) {
        showSuccessToast(`Transaction "${newTransaction.transactionId}" created successfully!`);
        onSuccess?.(newTransaction);
        // Reset form
        setFormData({
          transactionId: '',
          type: 'debit',
          amount: 0,
          description: '',
          transactionStatus: 'success',
          currency: 'INR',
          method: 'upi',
          trip: '',
          txnTowards: '',
        });
        setFromAccount('');
        setToAccount('');
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Failed to create transaction:', error);
      showErrorToast(error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Basic Transaction Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 shadow-sm border border-blue-100 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enter transaction details</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Type */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white font-medium transition-all"
                    disabled={isLoading}
                  >
                    <option value="debit">💸 Debit</option>
                    <option value="credit">💰 Credit</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white font-medium transition-all ${
                        errors.amount ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                      }`}
                      placeholder="0.00"
                      disabled={isLoading}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.amount}</p>
                  )}
                </div>

                {/* Currency */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white font-medium transition-all"
                    disabled={isLoading}
                  >
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Method */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.method}
                    onChange={(e) => handleInputChange('method', e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white font-medium transition-all"
                    disabled={isLoading}
                  >
                    <option value="upi">📱 UPI</option>
                    <option value="card">💳 Card</option>
                    <option value="wallet">👛 Wallet</option>
                    <option value="cash">💵 Cash</option>
                  </select>
                </div>

                {/* Status */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.transactionStatus}
                    onChange={(e) => handleInputChange('transactionStatus', e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white font-medium transition-all"
                    disabled={isLoading}
                  >
                    <option value="success">✅ Success</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="failed">❌ Failed</option>
                    <option value="cancelled">🚫 Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Transaction For */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Transaction For? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.txnTowards || ''}
                    onChange={(e) => handleInputChange('txnTowards', e.target.value)}
                    className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white font-medium transition-all ${
                      errors.txnTowards ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                    }`}
                    disabled={isLoading}
                  >
                    <option value="">Select...</option>
                    <option value="fuel">⛽ Fuel</option>
                    <option value="driver-advance">👤 Driver Advance</option>
                    <option value="extra-advance">💰 Extra Advance</option>
                  </select>
                  {errors.txnTowards && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.txnTowards}</p>
                  )}
                </div>

                {/* Trip Selection */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  🚛 Associated Trip (Optional)
                </label>
                <select
                  value={formData.trip || ''}
                  onChange={(e) => handleInputChange('trip', e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white font-medium transition-all"
                  disabled={isLoading || loadingTrips}
                >
                  <option value="">No Trip Associated</option>
                  {trips.map((trip) => (
                    <option key={trip.documentId} value={trip.documentId}>
                      {trip.tripNumber} - {trip.startPoint} → {trip.endPoint} ({trip.currentStatus})
                    </option>
                  ))}
                </select>
                {loadingTrips && (
                  <p className="mt-2 text-xs text-blue-500 dark:text-blue-400 flex items-center">
                    <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading trips...
                  </p>
                )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm mt-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  📝 Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white resize-none transition-all ${
                    errors.description ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                  }`}
                  placeholder="Enter a detailed description of the transaction..."
                  disabled={isLoading}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Account Transfer Card */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 shadow-sm border border-green-100 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Account Transfer</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Specify source and destination accounts</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* From Account */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-5 shadow-sm border-2 border-red-100 dark:border-red-900">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white font-bold text-sm">←</span>
                    </div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      From Account <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={fromAccount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFromAccount(value);
                      
                      // Clear error if exists
                      if (errors.fromAccount) {
                        setErrors(prev => ({ ...prev, fromAccount: '' }));
                      }
                      
                      // Real-time validation for digit count
                      if (value.trim()) {
                        const digitCount = countDigits(value);
                        if (digitCount > 18) {
                          setErrors(prev => ({ ...prev, fromAccount: 'Account number cannot exceed 18 digits' }));
                        }
                      }
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white font-mono text-sm transition-all ${
                      errors.fromAccount ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                    }`}
                    placeholder="XXXX-XXXX-XXXX"
                    disabled={isLoading}
                  />
                  {errors.fromAccount && (
                    <p className="mt-2 text-xs text-red-500 font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.fromAccount}
                    </p>
                  )}
                </div>

                {/* To Account */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-5 shadow-sm border-2 border-green-100 dark:border-green-900">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white font-bold text-sm">→</span>
                    </div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      To Account <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={toAccount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setToAccount(value);
                      
                      // Clear error if exists
                      if (errors.toAccount) {
                        setErrors(prev => ({ ...prev, toAccount: '' }));
                      }
                      
                      // Real-time validation for digit count
                      if (value.trim()) {
                        const digitCount = countDigits(value);
                        if (digitCount > 18) {
                          setErrors(prev => ({ ...prev, toAccount: 'Account number cannot exceed 18 digits' }));
                        }
                      }
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-white font-mono text-sm transition-all ${
                      errors.toAccount ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                    }`}
                    placeholder="XXXX-XXXX-XXXX"
                    disabled={isLoading}
                  />
                  {errors.toAccount && (
                    <p className="mt-2 text-xs text-red-500 font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.toAccount}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-3 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Review Transaction</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Please review the details before confirming</p>
            </div>

            {/* Transaction Amount Highlight */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Transaction Amount</p>
                  <p className="text-4xl font-bold">{formData.currency} {formData.amount.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    formData.type === 'debit' 
                      ? 'bg-red-500 bg-opacity-30 text-red-100' 
                      : 'bg-green-500 bg-opacity-30 text-green-100'
                  }`}>
                    {formData.type === 'debit' ? '↓ Debit' : '↑ Credit'}
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                    formData.transactionStatus === 'success' ? 'bg-green-500 text-white' :
                    formData.transactionStatus === 'pending' ? 'bg-yellow-500 text-white' :
                    formData.transactionStatus === 'failed' ? 'bg-red-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {formData.transactionStatus === 'success' ? '✓ ' : 
                     formData.transactionStatus === 'pending' ? '⏳ ' :
                     formData.transactionStatus === 'failed' ? '✗ ' : '🚫 '}
                    {formData.transactionStatus.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Transaction Details Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <h5 className="text-white font-semibold flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Transaction Details
                </h5>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Payment Method</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                    {formData.method === 'upi' ? '📱' : 
                     formData.method === 'card' ? '💳' : 
                     formData.method === 'wallet' ? '👛' : '💵'} 
                    <span className="ml-2 capitalize">{formData.method}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Currency</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formData.currency === 'INR' ? '🇮🇳 Indian Rupee' :
                     formData.currency === 'USD' ? '🇺🇸 US Dollar' :
                     formData.currency === 'EUR' ? '🇪🇺 Euro' : formData.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Transaction For</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                    {formData.txnTowards === 'fuel' ? '⛽ Fuel' :
                     formData.txnTowards === 'driver-advance' ? '👤 Driver Advance' :
                     formData.txnTowards === 'extra-advance' ? '💰 Extra Advance' :
                     formData.txnTowards || 'N/A'}
                  </span>
                </div>
                {formData.trip && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Associated Trip</span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">🚛 Trip Linked</span>
                  </div>
                )}
                <div className="py-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium block mb-2">Description</span>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {formData.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Transfer Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <h5 className="text-white font-semibold flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Account Transfer
                </h5>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  {/* From Account */}
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-2">
                        <span className="text-red-600 dark:text-red-300 font-bold text-sm">←</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">From</span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
                      <p className="text-lg font-mono font-bold text-red-700 dark:text-red-300">{fromAccount}</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="mx-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>

                  {/* To Account */}
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2">
                        <span className="text-green-600 dark:text-green-300 font-bold text-sm">→</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">To</span>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                      <p className="text-lg font-mono font-bold text-green-700 dark:text-green-300">{toAccount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Step Progress */}
      

      

      {/* Step Content */}
      <div className="min-h-[300px]">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
        <div>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              Previous
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Transaction'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
