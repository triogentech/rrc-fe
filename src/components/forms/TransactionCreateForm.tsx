"use client";
import React, { useState, useEffect } from 'react';
import { useTransactions } from '@/store/hooks/useTransactions';
import { useReduxAuth } from '@/store/hooks/useReduxAuth';
import { useTrips } from '@/store/hooks/useTrips';
import { generateSimplifiedTransactionDetails, generateTransactionId, generateRRN, validateTransactionDetails, getPaymentMethodConfig, getDefaultPaymentValues, validatePaymentFields } from '@/utils/transactionDetails';
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

  const [formData, setFormData] = useState<TransactionCreateRequest>({
    transactionId: '', // Will be auto-generated on submit
    type: 'debit',
    amount: 0,
    description: '',
    transactionStatus: 'success',
    currency: 'INR',
    method: 'upi',
    trip: '',
  });

  const [transactionDetails, setTransactionDetails] = useState({
    rrn: generateRRN(),
  });

  const [paymentFields, setPaymentFields] = useState<Record<string, string>>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [transactionFromJson, setTransactionFromJson] = useState('');
  const [transactionToJson, setTransactionToJson] = useState('');

  // Separate state for Transaction To fields
  const [transactionToDetails, setTransactionToDetails] = useState({
    contact: '+919818222176',
    email: 'void@razorpay.com',
    vpa: 'deeproganguly-1@okaxis',
    rrn: generateRRN(),
  });

  const [transactionToPaymentFields, setTransactionToPaymentFields] = useState<Record<string, string>>({});
  const [transactionToPaymentErrors, setTransactionToPaymentErrors] = useState<Record<string, string>>({});

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

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

  // Update payment fields when method changes
  useEffect(() => {
    const defaultValues = getDefaultPaymentValues(formData.method);
    setPaymentFields(defaultValues);
    setPaymentErrors({});
    
    // Also update transactionTo payment fields
    setTransactionToPaymentFields(defaultValues);
    setTransactionToPaymentErrors({});
  }, [formData.method]);

  // Generate Transaction From JSON when form data changes
  useEffect(() => {
    const details = {
      id: formData.transactionId || generateTransactionId(),
      amount: formData.amount,
      currency: formData.currency,
      method: formData.method,
      status: formData.transactionStatus,
      description: formData.description,
      contact: '+919818222176',
      email: 'void@razorpay.com',
      vpa: paymentFields.vpa || 'deeproganguly-1@okaxis',
      rrn: transactionDetails.rrn,
    };

    const validation = validateTransactionDetails(details);
    if (validation.isValid) {
      const jsonString = generateSimplifiedTransactionDetails(details);
      setTransactionFromJson(jsonString);
    }
  }, [formData, transactionDetails, paymentFields]);

  // Generate Transaction To JSON when transactionTo data changes
  useEffect(() => {
    const details = {
      id: formData.transactionId || generateTransactionId(),
      amount: formData.amount,
      currency: formData.currency,
      method: formData.method,
      status: formData.transactionStatus,
      description: formData.description,
      contact: transactionToDetails.contact,
      email: transactionToDetails.email,
      vpa: transactionToPaymentFields.vpa || transactionToDetails.vpa,
      rrn: transactionToDetails.rrn,
    };

    const validation = validateTransactionDetails(details);
    if (validation.isValid) {
      const jsonString = generateSimplifiedTransactionDetails(details);
      setTransactionToJson(jsonString);
    }
  }, [formData, transactionToDetails, transactionToPaymentFields]);

  const handleInputChange = (field: keyof TransactionCreateRequest, value: string | number) => {
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


  const handlePaymentFieldChange = (field: string, value: string) => {
    setPaymentFields(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (paymentErrors[field]) {
      setPaymentErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleTransactionToDetailsChange = (field: keyof typeof transactionToDetails, value: string) => {
    setTransactionToDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTransactionToPaymentFieldChange = (field: string, value: string) => {
    setTransactionToPaymentFields(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (transactionToPaymentErrors[field]) {
      setTransactionToPaymentErrors(prev => ({
        ...prev,
        [field]: ''
      }));
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

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
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

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Basic Transaction Details
        if (!formData.amount || formData.amount <= 0) {
          newErrors.amount = 'Amount must be greater than 0';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        }
        if (!formData.currency.trim()) {
          newErrors.currency = 'Currency is required';
        }
        break;
      
      case 2: // Transaction From Details
        const paymentValidation = validatePaymentFields(formData.method, paymentFields);
        if (!paymentValidation.isValid) {
          setPaymentErrors(paymentValidation.errors);
          return false;
        } else {
          setPaymentErrors({});
        }
        break;
      
      case 3: // Transaction To Details
        const transactionToPaymentValidation = validatePaymentFields(formData.method, transactionToPaymentFields);
        if (!transactionToPaymentValidation.isValid) {
          setTransactionToPaymentErrors(transactionToPaymentValidation.errors);
          return false;
        } else {
          setTransactionToPaymentErrors({});
        }
        break;
      
      case 4: // Review
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

    // Validate payment method specific fields for Transaction From
    const paymentValidation = validatePaymentFields(formData.method, paymentFields);
    if (!paymentValidation.isValid) {
      setPaymentErrors(paymentValidation.errors);
    } else {
      setPaymentErrors({});
    }

    // Validate payment method specific fields for Transaction To
    const transactionToPaymentValidation = validatePaymentFields(formData.method, transactionToPaymentFields);
    if (!transactionToPaymentValidation.isValid) {
      setTransactionToPaymentErrors(transactionToPaymentValidation.errors);
    } else {
      setTransactionToPaymentErrors({});
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && paymentValidation.isValid && transactionToPaymentValidation.isValid;
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
      const transactionData: TransactionCreateRequest & { transactionFrom?: string; transactionTo?: string } = {
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
        });
        setTransactionDetails({
          rrn: generateRRN(),
        });
        setTransactionToDetails({
          contact: '+919818222176',
          email: 'void@razorpay.com',
          vpa: 'deeproganguly-1@okaxis',
          rrn: generateRRN(),
        });
        setPaymentFields({});
        setPaymentErrors({});
        setTransactionToPaymentFields({});
        setTransactionToPaymentErrors({});
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
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Basic Transaction Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type - Hidden field, always debit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                  Debit (Default)
                </div>
                <input
                  type="hidden"
                  value="debit"
                  name="type"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter amount"
                  disabled={isLoading}
                  min="0"
                  step="0.01"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
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

              {/* Trip Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Associated Trip
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
                      {trip.tripNumber} - {trip.startPoint} → {trip.endPoint} ({trip.currentStatus})
                    </option>
                  ))}
                </select>
                {loadingTrips && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Loading trips...</p>
                )}
                {!loadingTrips && trips.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">No trips available</p>
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter transaction description"
                disabled={isLoading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">{getPaymentMethodConfig(formData.method).icon}</span>
              Transaction From - {getPaymentMethodConfig(formData.method).description}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getPaymentMethodConfig(formData.method).fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={paymentFields[field.key] || ''}
                      onChange={(e) => handlePaymentFieldChange(field.key, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        paymentErrors[field.key] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      disabled={isLoading}
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={paymentFields[field.key] || ''}
                      onChange={(e) => handlePaymentFieldChange(field.key, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        paymentErrors[field.key] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={field.placeholder}
                      disabled={isLoading}
                      maxLength={field.validation?.maxLength}
                      minLength={field.validation?.minLength}
                    />
                  )}
                  {paymentErrors[field.key] && (
                    <p className="mt-1 text-sm text-red-500">{paymentErrors[field.key]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">{getPaymentMethodConfig(formData.method).icon}</span>
              Transaction To - {getPaymentMethodConfig(formData.method).description}
            </h4>
            
            {/* Contact and Email for Transaction To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={transactionToDetails.contact}
                  onChange={(e) => handleTransactionToDetailsChange('contact', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter contact number"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={transactionToDetails.email}
                  onChange={(e) => handleTransactionToDetailsChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter email"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getPaymentMethodConfig(formData.method).fields.map((field) => (
                <div key={`to-${field.key}`}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={transactionToPaymentFields[field.key] || ''}
                      onChange={(e) => handleTransactionToPaymentFieldChange(field.key, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        transactionToPaymentErrors[field.key] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      disabled={isLoading}
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={transactionToPaymentFields[field.key] || ''}
                      onChange={(e) => handleTransactionToPaymentFieldChange(field.key, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        transactionToPaymentErrors[field.key] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={field.placeholder}
                      disabled={isLoading}
                      maxLength={field.validation?.maxLength}
                      minLength={field.validation?.minLength}
                    />
                  )}
                  {transactionToPaymentErrors[field.key] && (
                    <p className="mt-1 text-sm text-red-500">{transactionToPaymentErrors[field.key]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Review & Confirm</h4>
            
            {/* Transaction Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Transaction Summary</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">{formData.type}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{formData.currency} {formData.amount}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Method:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">{formData.method}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">{formData.transactionStatus}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">Description:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{formData.description}</span>
                </div>
              </div>
            </div>

            {/* JSON Preview */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900 dark:text-white">Generated JSON Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transaction From JSON
                  </label>
                  <textarea
                    value={transactionFromJson}
                    readOnly
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-mono resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transaction To JSON
                  </label>
                  <textarea
                    value={transactionToJson}
                    readOnly
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-mono resize-none"
                  />
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {Array.from({ length: totalSteps }, (_, index) => (
            <div key={index + 1} className="flex items-center">
              <button
                type="button"
                onClick={() => goToStep(index + 1)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  currentStep === index + 1
                    ? 'bg-blue-600 text-white'
                    : currentStep > index + 1
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {currentStep > index + 1 ? '✓' : index + 1}
              </button>
              {index < totalSteps - 1 && (
                <div className={`w-6 h-0.5 mx-1 ${
                  currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      {/* Step Labels */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
        <span className="text-center flex-1">Basic Details</span>
        <span className="text-center flex-1">Transaction From</span>
        <span className="text-center flex-1">Transaction To</span>
        <span className="text-center flex-1">Review</span>
      </div>

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
