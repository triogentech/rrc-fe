"use client";
import React, { useState, useEffect } from 'react';
import type { Trip } from '@/store/api/types';

interface TripActualEndTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (actualEndTime: string) => void;
  trip: Trip | null;
  isLoading?: boolean;
}

export default function TripActualEndTimeModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  trip, 
  isLoading = false 
}: TripActualEndTimeModalProps) {
  const [actualEndTime, setActualEndTime] = useState('');

  useEffect(() => {
    if (isOpen && trip) {
      // Set current date and time as default
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      setActualEndTime(currentDateTime);
    }
  }, [isOpen, trip]);

  const handleSetAsNow = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setActualEndTime(currentDateTime);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (actualEndTime) {
      onConfirm(actualEndTime);
    }
  };

  if (!isOpen || !trip) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Set Actual End Time
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Trip: <span className="font-medium">{trip.tripNumber}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="actualEndTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Actual End Time *
            </label>
            <div className="space-y-3">
              <input
                type="datetime-local"
                id="actualEndTime"
                value={actualEndTime}
                onChange={(e) => setActualEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={handleSetAsNow}
                disabled={isLoading}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Set as Now
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select the actual time when this trip was completed
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !actualEndTime}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Setting...
                </span>
              ) : (
                'Set End Time'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

