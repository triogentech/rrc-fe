"use client";
import React from 'react';
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showValidationErrorToast,
  showErrorToastWithPrefix,
  testStrapiErrorFormats,
} from '@/utils/toastHelper';

/**
 * Component to test toast notifications with various Strapi error formats
 * Only for development/testing purposes
 */
export default function ToastErrorTester() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Test different Strapi error formats
  const testStrapiV4Error = () => {
    const error = {
      error: {
        message: 'This is a Strapi v4 error message',
      },
    };
    showErrorToast(error);
  };

  const testNestedStrapiError = () => {
    const error = {
      data: {
        error: {
          message: 'This is a nested Strapi error message',
        },
      },
    };
    showErrorToast(error);
  };

  const testValidationError = () => {
    const error = {
      error: {
        details: {
          errors: [
            { path: ['email'], message: 'Email is required' },
            { path: ['password'], message: 'Password must be at least 8 characters' },
            { path: ['username'], message: 'Username is already taken' },
          ],
        },
      },
    };
    showValidationErrorToast(error);
  };

  const testStatusCodeError = () => {
    const error = {
      response: {
        status: 404,
        statusText: 'Not Found',
      },
    };
    showErrorToast(error);
  };

  const testHttp400WithStrapiError = () => {
    const error = {
      response: {
        status: 400,
        statusText: 'Bad Request',
        data: {
          error: {
            message: 'Trip number already exists. Please use a different trip number.',
            name: 'ValidationError',
            details: {
              errors: [
                {
                  path: ['tripNumber'],
                  message: 'Trip number already exists',
                  name: 'ValidationError'
                }
              ]
            }
          }
        }
      },
    };
    showErrorToast(error);
  };

  const testHttp400SimpleStrapiError = () => {
    const error = {
      response: {
        status: 400,
        statusText: 'Bad Request',
        data: {
          error: 'Driver is currently assigned to another trip'
        }
      },
    };
    showErrorToast(error);
  };

  const testConflictError = () => {
    const error = {
      response: {
        status: 409,
        data: {
          error: {
            message: 'A trip with this number already exists',
          },
        },
      },
    };
    showErrorToast(error);
  };

  const testUnauthorizedError = () => {
    const error = {
      response: {
        status: 401,
      },
    };
    showErrorToast(error);
  };

  const testErrorWithPrefix = () => {
    const error = {
      error: {
        message: 'Database connection failed',
      },
    };
    showErrorToastWithPrefix(error, 'Failed to save trip');
  };

  const testAllFormats = () => {
    testStrapiErrorFormats();
  };

  const testSuccessToast = () => {
    showSuccessToast('Trip created successfully!');
  };

  const testWarningToast = () => {
    showWarningToast('Vehicle status could not be updated');
  };

  const testInfoToast = () => {
    showInfoToast('Please verify the trip details before submitting');
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9998] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-w-sm">
      <h3 className="text-sm font-bold mb-3 text-gray-900 dark:text-white">
        🧪 Toast Error Tester
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
        Test Strapi error notifications (Dev only)
      </p>
      
      <div className="space-y-2">
        <button
          onClick={testSuccessToast}
          className="w-full px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
        >
          ✓ Success Toast
        </button>
        
        <button
          onClick={testWarningToast}
          className="w-full px-3 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded transition-colors"
        >
          ⚠ Warning Toast
        </button>
        
        <button
          onClick={testInfoToast}
          className="w-full px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
        >
          ℹ Info Toast
        </button>

        <div className="border-t border-gray-200 dark:border-gray-600 my-2 pt-2">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Error Formats:
          </p>
        </div>
        
        <button
          onClick={testStrapiV4Error}
          className="w-full px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
        >
          Strapi v4 Format
        </button>
        
        <button
          onClick={testNestedStrapiError}
          className="w-full px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
        >
          Nested Strapi Error
        </button>
        
        <button
          onClick={testValidationError}
          className="w-full px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
        >
          Validation Errors
        </button>
        
        <button
          onClick={testStatusCodeError}
          className="w-full px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
        >
          404 Status Code
        </button>
        
        <button
          onClick={testHttp400WithStrapiError}
          className="w-full px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
        >
          HTTP 400 + Strapi Error
        </button>
        
        <button
          onClick={testHttp400SimpleStrapiError}
          className="w-full px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
        >
          HTTP 400 + Simple Error
        </button>
        
        <button
          onClick={testConflictError}
          className="w-full px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
        >
          409 Conflict Error
        </button>
        
        <button
          onClick={testUnauthorizedError}
          className="w-full px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
        >
          401 Unauthorized
        </button>
        
        <button
          onClick={testErrorWithPrefix}
          className="w-full px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
        >
          Error with Prefix
        </button>

        <div className="border-t border-gray-200 dark:border-gray-600 my-2 pt-2"></div>
        
        <button
          onClick={testAllFormats}
          className="w-full px-3 py-1.5 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors font-semibold"
        >
          🧪 Test All Formats (Console)
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        Check console for detailed error logs
      </p>
    </div>
  );
}

