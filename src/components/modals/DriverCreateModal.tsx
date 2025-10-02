"use client";
  import React, { useEffect, useState } from 'react';
import DriverCreateForm from '../forms/DriverCreateForm';
import type { Driver } from '@/store/api/types';

interface DriverCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (driver: Driver) => void;
}

export default function DriverCreateModal({ isOpen, onClose, onSuccess }: DriverCreateModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

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

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1); // Reset to first step when modal opens
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSuccess = (driver: Driver) => {
    onSuccess?.(driver);
    onClose();
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1:
        return 'Basic Information';
      case 2:
        return 'User Account';
      case 3:
        return 'Banking Details';
      case 4:
        return 'Review & Create';
      default:
        return 'Add New Driver';
    }
  };

  const getStepDescription = (step: number) => {
    switch (step) {
      case 1:
        return 'Enter the basic driver information';
      case 2:
        return 'Create login credentials for the driver';
      case 3:
        return 'Enter banking and license details';
      case 4:
        return 'Review all information before creating the driver';
      default:
        return '';
    }
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
            {/* Header with Steps */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getStepTitle(currentStep)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getStepDescription(currentStep)}
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Step {currentStep} of {totalSteps}
                </div>
              </div>
              
              {/* Step Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
              
              {/* Step Indicators */}
              <div className="flex justify-between mt-4">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        step <= currentStep
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {step}
                    </div>
                    <div className="ml-2 hidden sm:block">
                      <div className={`text-xs font-medium ${
                        step <= currentStep
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {getStepTitle(step)}
                      </div>
                    </div>
                    {step < totalSteps && (
                      <div className={`hidden sm:block w-8 h-0.5 mx-2 ${
                        step < currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              <DriverCreateForm 
                onSuccess={handleSuccess} 
                onCancel={onClose}
                currentStep={currentStep}
                onStepChange={handleStepChange}
                totalSteps={totalSteps}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
