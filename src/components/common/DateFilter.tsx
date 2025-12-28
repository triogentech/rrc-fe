"use client";
import React, { useState, useRef } from 'react';
import DatePicker from '@/components/form/date-picker';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';

interface DateFilterProps {
  onDateChange?: (startDate: string | null, endDate: string | null) => void;
  disabled?: boolean;
  className?: string;
  idPrefix?: string;
}

export default function DateFilter({ 
  onDateChange, 
  disabled = false,
  className = '',
  idPrefix = 'dateFilter'
}: DateFilterProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const startDatePickerRef = useRef<flatpickr.Instance | null>(null);
  const endDatePickerRef = useRef<flatpickr.Instance | null>(null);
  
  const startDateId = `${idPrefix}-startDate`;
  const endDateId = `${idPrefix}-endDate`;

  // Helper function to format date in local timezone (YYYY-MM-DD)
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle date filter change
  const handleDateFilterChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
    
    // Notify parent component of date changes
    if (onDateChange) {
      if (type === 'start') {
        onDateChange(value || null, endDate || null);
      } else {
        onDateChange(startDate || null, value || null);
      }
    }
  };

  // Handle clear date filter
  const handleClearDateFilter = (type: 'start' | 'end') => {
    if (type === 'start') {
      setStartDate('');
      // Try to clear the flatpickr instance if available
      try {
        if (startDatePickerRef.current && typeof startDatePickerRef.current.clear === 'function') {
          startDatePickerRef.current.clear();
        }
      } catch {
        // If flatpickr instance is not available, clear the input directly
        const inputElement = document.getElementById(startDateId) as HTMLInputElement;
        if (inputElement) {
          inputElement.value = '';
        }
      }
      // Notify parent
      if (onDateChange) {
        onDateChange(null, endDate || null);
      }
    } else {
      setEndDate('');
      // Try to clear the flatpickr instance if available
      try {
        if (endDatePickerRef.current && typeof endDatePickerRef.current.clear === 'function') {
          endDatePickerRef.current.clear();
        }
      } catch {
        // If flatpickr instance is not available, clear the input directly
        const inputElement = document.getElementById(endDateId) as HTMLInputElement;
        if (inputElement) {
          inputElement.value = '';
        }
      }
      // Notify parent
      if (onDateChange) {
        onDateChange(startDate || null, null);
      }
    }
  };

  // Handle clear all dates
  const handleClearAllDates = () => {
    setStartDate('');
    setEndDate('');
    
    // Try to clear both flatpickr instances
    try {
      if (startDatePickerRef.current && typeof startDatePickerRef.current.clear === 'function') {
        startDatePickerRef.current.clear();
      } else {
        const inputElement = document.getElementById(startDateId) as HTMLInputElement;
        if (inputElement) {
          inputElement.value = '';
        }
      }
    } catch {
      const inputElement = document.getElementById(startDateId) as HTMLInputElement;
      if (inputElement) {
        inputElement.value = '';
      }
    }
    
    try {
      if (endDatePickerRef.current && typeof endDatePickerRef.current.clear === 'function') {
        endDatePickerRef.current.clear();
      } else {
        const inputElement = document.getElementById(endDateId) as HTMLInputElement;
        if (inputElement) {
          inputElement.value = '';
        }
      }
    } catch {
      const inputElement = document.getElementById(endDateId) as HTMLInputElement;
      if (inputElement) {
        inputElement.value = '';
      }
    }
    
    // Notify parent
    if (onDateChange) {
      onDateChange(null, null);
    }
  };

  return (
    <div className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Date:</label>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="flex items-center gap-2 flex-1">
            <label htmlFor={startDateId} className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Start Date:
            </label>
            <div className="relative flex-1">
              <DatePicker
                id={startDateId}
                mode="single"
                placeholder="Select start date"
                defaultDate={startDate ? new Date(startDate) : undefined}
                onChange={(selectedDates, dateStr, instance) => {
                  startDatePickerRef.current = instance;
                  if (selectedDates && selectedDates.length > 0) {
                    const date = selectedDates[0];
                    const dateString = formatDateLocal(date);
                    handleDateFilterChange('start', dateString);
                  } else if (selectedDates.length === 0) {
                    handleClearDateFilter('start');
                  }
                }}
              />
              {startDate && (
                <button
                  type="button"
                  onClick={() => handleClearDateFilter('start')}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
                  title="Clear start date"
                  disabled={disabled}
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label htmlFor={endDateId} className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
              End Date:
            </label>
            <div className="relative flex-1">
              <DatePicker
                id={endDateId}
                mode="single"
                placeholder="Select end date"
                defaultDate={endDate ? new Date(endDate) : undefined}
                onChange={(selectedDates, dateStr, instance) => {
                  endDatePickerRef.current = instance;
                  if (selectedDates && selectedDates.length > 0) {
                    const date = selectedDates[0];
                    const dateString = formatDateLocal(date);
                    handleDateFilterChange('end', dateString);
                  } else if (selectedDates.length === 0) {
                    handleClearDateFilter('end');
                  }
                }}
              />
              {endDate && (
                <button
                  type="button"
                  onClick={() => handleClearDateFilter('end')}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
                  title="Clear end date"
                  disabled={disabled}
                >
                  ×
                </button>
              )}
            </div>
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={handleClearAllDates}
              className="px-3 py-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium whitespace-nowrap"
              disabled={disabled}
            >
              Clear Dates
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
