"use client";
import React, { useEffect } from 'react';
import type { Driver } from '@/store/api/types';

interface DriverViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
}

export default function DriverViewModal({ isOpen, onClose, driver }: DriverViewModalProps) {
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

  if (!isOpen || !driver) return null;

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };



  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-opacity-50 transition-opacity"
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
          
          {/* Modal Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Driver Details</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Complete information about {driver.fullName}</p>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Personal Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                      <p className="text-sm text-gray-900 dark:text-white">{driver.fullName}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {driver.dateOfBirth ? formatDate(driver.dateOfBirth) : 'Not provided'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Blood Group</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {driver.bloodGroup || 'Not provided'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Aadhaar Number</label>
                      <p className="text-sm text-gray-900 dark:text-white">{driver.aadhaarNumber}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">PAN Number</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {driver.panNumber || 'Not provided'}
                      </p>
                    </div>

                    
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Contact Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Number</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {driver.countryDialCode} {driver.contactNumber}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                      <p className="text-sm text-gray-900 dark:text-white">{driver.address}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reference</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {driver.reference || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Emergency Contact Number</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {driver.emgCountryDialCode} {driver.emgContactNumber}
                      </p>
                    </div>
                  </div>
                </div>


              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
