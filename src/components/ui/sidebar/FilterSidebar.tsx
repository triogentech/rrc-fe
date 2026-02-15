"use client";
import React from 'react';

export interface FilterField {
  id: string;
  label: string;
  type: 'radio' | 'checkbox' | 'select' | 'custom';
  options?: Array<{
    value: string | boolean | null;
    label: string;
  }>;
  value?: string | boolean | null | (string | boolean)[];
  onChange?: (value: string | boolean | null | (string | boolean)[]) => void;
  customRender?: () => React.ReactNode;
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  fields: FilterField[];
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

export default function FilterSidebar({
  isOpen,
  onClose,
  title = "Filter",
  fields,
  onApplyFilters,
  onClearFilters,
}: FilterSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100000] transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-xl z-[100001] transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {field.label}
                </label>
                <div className="space-y-2">
                  {field.type === 'custom' && field.customRender && (
                    <div className="-mx-2">{field.customRender()}</div>
                  )}
                  {field.type === 'radio' && field.options && field.onChange && field.options.map((option, index) => (
                    <label key={index} className="flex items-center">
                      <input
                        type="radio"
                        name={field.id}
                        checked={field.value === option.value}
                        onChange={() => field.onChange!(option.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {option.label}
                      </span>
                    </label>
                  ))}
                  
                  {field.type === 'checkbox' && field.options && field.onChange && field.options.map((option, index) => {
                    const isChecked = Array.isArray(field.value) 
                      ? (field.value as (string | boolean)[]).includes(option.value as string | boolean)
                      : field.value === option.value;
                    
                    return (
                      <label key={index} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (Array.isArray(field.value)) {
                              const currentValues = field.value as (string | boolean)[];
                              if (e.target.checked) {
                                field.onChange!([...currentValues, option.value as string | boolean]);
                              } else {
                                field.onChange!(currentValues.filter(v => v !== option.value));
                              }
                            } else {
                              field.onChange!(e.target.checked ? option.value : null);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {option.label}
                        </span>
                      </label>
                    );
                  })}
                  
                  {field.type === 'select' && field.options && field.onChange && (
                    <select
                      value={
                        field.value === null 
                          ? '' 
                          : typeof field.value === 'boolean' 
                          ? field.value.toString() 
                          : (field.value as string) || ''
                      }
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        if (selectedValue === '') {
                          field.onChange!(null);
                        } else if (selectedValue === 'true') {
                          field.onChange!(true);
                        } else if (selectedValue === 'false') {
                          field.onChange!(false);
                        } else {
                          field.onChange!(selectedValue);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      {field.options.map((option, index) => {
                        const optionValue = option.value === null 
                          ? '' 
                          : typeof option.value === 'boolean' 
                          ? option.value.toString() 
                          : (option.value as string) || '';
                        return (
                          <option key={index} value={optionValue}>
                            {option.label}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <button
              onClick={onClearFilters}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={onApplyFilters}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
