import { toast, ToastOptions, Id } from 'react-toastify';

/**
 * Type for error objects that might come from various sources
 */
interface ErrorLike {
  error?: {
    message?: string;
    name?: string;
    details?: {
      errors?: Array<{
        path?: string[];
        message?: string;
        type?: string;
      }>;
    };
  };
  data?: {
    error?: {
      message?: string;
      details?: {
        errors?: Array<{
          path?: string[];
          message?: string;
          type?: string;
        }>;
      };
    };
    message?: string;
  };
  response?: {
    status?: number;
    statusText?: string;
    data?: ErrorLike['data'];
  };
  message?: string;
}

/**
 * Default toast configuration with dark blue theme
 */
const defaultToastConfig: ToastOptions = {
  position: "bottom-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  style: { 
    zIndex: 9999,
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
    color: '#ffffff',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
  },
};

/**
 * Extract error message from Strapi error response
 * @param error - The error object from Strapi or any API
 * @returns Formatted error message
 */
export const extractErrorMessage = (error: unknown): string => {
  // Log the full error for debugging
  console.error('Full error object:', error);

  if (!error) return 'An unknown error occurred';

  // If error is already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // Type guard for ErrorLike
  const err = error as ErrorLike;

  // Check for Strapi v4 error format: { error: { message: "..." } }
  if (err.error?.message) {
    console.log('Extracted Strapi v4 error:', err.error.message);
    return err.error.message;
  }

  // Check for nested Strapi error: { data: { error: { message: "..." } } }
  if (err.data?.error?.message) {
    console.log('Extracted nested Strapi error:', err.data.error.message);
    return err.data.error.message;
  }

  // Check for validation errors with details
  if (err.error?.details?.errors && Array.isArray(err.error.details.errors)) {
    const validationErrors = err.error.details.errors
      .map((error) => error.message || (error.path?.join('.') ? `${error.path.join('.')}: ${error.type || 'invalid'}` : ''))
      .filter(Boolean)
      .join('; ');
    console.log('Extracted validation errors:', validationErrors);
    return validationErrors || 'Validation error occurred';
  }

  // Check for Strapi validation error array format
  if (err.data?.error?.details?.errors && Array.isArray(err.data.error.details.errors)) {
    const validationErrors = err.data.error.details.errors
      .map((error) => error.message || (error.path?.join('.') ? `${error.path.join('.')}: ${error.type || 'invalid'}` : ''))
      .filter(Boolean)
      .join('; ');
    console.log('Extracted data validation errors:', validationErrors);
    return validationErrors || 'Validation error occurred';
  }

  // Check for error with name and details
  if (err.error?.name && err.error?.details) {
    console.log('Extracted Strapi error with name:', err.error.name);
    return `${err.error.name}: ${err.error.message || 'Error occurred'}`;
  }

  // Check for response error message (Axios format) - HIGHEST PRIORITY for HTTP errors
  if (err.response?.data?.error?.message) {
    console.log('Extracted response error:', err.response.data.error.message);
    return err.response.data.error.message;
  }

  // Check for response data message
  if (err.response?.data?.message) {
    console.log('Extracted response data message:', err.response.data.message);
    return err.response.data.message;
  }

  // Check for response data error string
  if (err.response?.data?.error && typeof err.response.data.error === 'string') {
    console.log('Extracted response data error string:', err.response.data.error);
    return err.response.data.error as string;
  }

  // Check for response data with error object (common in Strapi)
  if (err.response?.data && typeof err.response.data === 'object') {
    // Try to find any error message in the response data
    const dataStr = JSON.stringify(err.response.data);
    if (dataStr.includes('error') || dataStr.includes('message')) {
      console.log('Found error in response data:', err.response.data);
      
      // Try to extract specific Strapi error patterns
      if (err.response.data.error) {
        if (typeof err.response.data.error === 'string') {
          return err.response.data.error as string;
        }
        if (err.response.data.error.message) {
          return err.response.data.error.message;
        }
      }
      
      // Try to extract any meaningful error message from the response
      const errorMsg = err.response.data.error || err.response.data.message || dataStr;
      return typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
    }
  }

  // Check for standard error message
  if (err.message) {
    console.log('Extracted standard error message:', err.message);
    return err.message;
  }

  // Check for status text
  if (err.response?.statusText) {
    console.log('Extracted status text:', err.response.statusText);
    return err.response.statusText;
  }

  // Check for status code with generic message (ONLY as last resort)
  if (err.response?.status) {
    const statusMessages: { [key: number]: string } = {
      400: 'Bad Request: The request was invalid',
      401: 'Unauthorized: Please log in again',
      403: 'Forbidden: You do not have permission to perform this action',
      404: 'Not Found: The requested resource was not found',
      409: 'Conflict: This record already exists or conflicts with existing data',
      422: 'Validation Error: Please check your input',
      500: 'Internal Server Error: Please try again later',
      502: 'Bad Gateway: Server is temporarily unavailable',
      503: 'Service Unavailable: Server is temporarily unavailable',
    };
    
    const statusMessage = statusMessages[err.response.status] || `Error ${err.response.status}`;
    console.log('Using status code message as fallback:', statusMessage);
    return statusMessage;
  }

  // If we get here, log the entire error structure
  console.warn('Could not extract error message from:', JSON.stringify(error, null, 2));
  return 'An error occurred while processing your request';
};

/**
 * Show success toast notification
 * @param message - Success message to display
 * @param options - Optional toast configuration
 */
export const showSuccessToast = (message: string, options?: ToastOptions): void => {
  toast.success(message, {
    ...defaultToastConfig,
    autoClose: 3000,
    style: {
      ...defaultToastConfig.style,
      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    },
    ...options,
  });
};

/**
 * Show error toast notification with Strapi error handling
 * @param error - Error object or string message
 * @param options - Optional toast configuration
 */
export const showErrorToast = (error: unknown, options?: ToastOptions): void => {
  const errorMessage = typeof error === 'string' ? error : extractErrorMessage(error);
  
  // In development, show more detailed error information
  if (process.env.NODE_ENV === 'development' && typeof error === 'object' && error !== null) {
    const err = error as ErrorLike;
    console.group('🔴 Error Toast Details');
    console.error('Displayed message:', errorMessage);
    console.error('Full error object:', error);
    
    // Show error structure for debugging
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    
    console.groupEnd();
  }
  
  toast.error(errorMessage, {
    ...defaultToastConfig,
    style: {
      ...defaultToastConfig.style,
      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    },
    ...options,
  });
};

/**
 * Show warning toast notification
 * @param message - Warning message to display
 * @param options - Optional toast configuration
 */
export const showWarningToast = (message: string, options?: ToastOptions): void => {
  toast.warning(message, {
    ...defaultToastConfig,
    autoClose: 4000,
    style: {
      ...defaultToastConfig.style,
      background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    },
    ...options,
  });
};

/**
 * Show info toast notification
 * @param message - Info message to display
 * @param options - Optional toast configuration
 */
export const showInfoToast = (message: string, options?: ToastOptions): void => {
  toast.info(message, {
    ...defaultToastConfig,
    autoClose: 4000,
    style: {
      ...defaultToastConfig.style,
      background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
    },
    ...options,
  });
};

/**
 * Show loading toast notification
 * @param message - Loading message to display
 * @returns Toast ID for updating/dismissing later
 */
export const showLoadingToast = (message: string = 'Processing...'): Id => {
  return toast.loading(message, {
    ...defaultToastConfig,
  });
};

/**
 * Update an existing toast
 * @param toastId - ID of the toast to update
 * @param message - New message
 * @param type - Toast type (success, error, warning, info)
 * @param options - Optional toast configuration
 */
export const updateToast = (
  toastId: Id,
  message: string,
  type: 'success' | 'error' | 'warning' | 'info',
  options?: ToastOptions
): void => {
  toast.update(toastId, {
    render: message,
    type: type,
    isLoading: false,
    autoClose: 3000,
    ...options,
  });
};

/**
 * Dismiss a specific toast or all toasts
 * @param toastId - Optional toast ID to dismiss specific toast
 */
export const dismissToast = (toastId?: Id): void => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
};

/**
 * Show detailed Strapi validation errors
 * Useful for form submissions with multiple field errors
 * @param error - Error object with validation details
 * @param options - Optional toast configuration
 */
export const showValidationErrorToast = (error: unknown, options?: ToastOptions): void => {
  let errorMessage = 'Validation failed';
  
  const err = error as ErrorLike;
  
  // Try to extract validation errors
  const errors = err.error?.details?.errors || err.data?.error?.details?.errors;
  
  if (errors && Array.isArray(errors)) {
    // Format validation errors with field names
    const formattedErrors = errors
      .map((validationError) => {
        const field = validationError.path?.join('.') || 'Unknown field';
        const message = validationError.message || 'Invalid value';
        return `• ${field}: ${message}`;
      })
      .join('\n');
    
    errorMessage = `Validation Errors:\n${formattedErrors}`;
  } else {
    errorMessage = extractErrorMessage(error);
  }
  
  toast.error(errorMessage, {
    ...defaultToastConfig,
    autoClose: 7000, // Longer duration for validation errors
    style: { 
      ...defaultToastConfig.style,
      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
      whiteSpace: 'pre-line',
    }, // Support line breaks
    ...options,
  });
};

/**
 * Show Strapi error with custom prefix
 * @param error - Error object
 * @param prefix - Custom prefix for the error message
 * @param options - Optional toast configuration
 */
export const showErrorToastWithPrefix = (
  error: unknown,
  prefix: string,
  options?: ToastOptions
): void => {
  const errorMessage = typeof error === 'string' ? error : extractErrorMessage(error);
  const fullMessage = `${prefix}: ${errorMessage}`;
  
  toast.error(fullMessage, {
    ...defaultToastConfig,
    style: {
      ...defaultToastConfig.style,
      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    },
    ...options,
  });
};

/**
 * Test function to demonstrate Strapi error handling
 * Only available in development mode
 */
export const testStrapiErrorFormats = (): void => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Error testing is only available in development mode');
    return;
  }

  console.group('🧪 Testing Strapi Error Formats');
  
  // Test various error formats
  const testErrors = [
    {
      name: 'Strapi v4 Format',
      error: { error: { message: 'This is a Strapi v4 error message' } }
    },
    {
      name: 'Nested Format',
      error: { data: { error: { message: 'This is a nested Strapi error' } } }
    },
    {
      name: 'Validation Error',
      error: {
        error: {
          details: {
            errors: [
              { path: ['email'], message: 'Email is required' },
              { path: ['password'], message: 'Password must be at least 8 characters' }
            ]
          }
        }
      }
    },
    {
      name: 'Status Code Error',
      error: { response: { status: 404 } }
    },
    {
      name: 'Standard Error',
      error: { message: 'This is a standard error message' }
    }
  ];

  testErrors.forEach(({ name, error }) => {
    const extracted = extractErrorMessage(error);
    console.log(`${name}:`, extracted);
  });

  console.groupEnd();
  showInfoToast('Check console for Strapi error format test results');
};

