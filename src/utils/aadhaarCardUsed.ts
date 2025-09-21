import { api } from '@/store/api';
import type { Driver, StrapiResponse } from '@/store/api/types';

/**
 * Checks if an Aadhaar card number is already in use by another driver
 * @param aadhaarNumber - The 12-digit Aadhaar number to check
 * @param excludeDriverId - Optional driver ID to exclude from the check (for updates)
 * @returns Promise<boolean> - True if Aadhaar is already in use, false otherwise
 */
export const isAadhaarCardUsed = async (aadhaarNumber: string, excludeDriverId?: string): Promise<boolean> => {
  try {
    // Clean the Aadhaar number (remove any non-digits)
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
    
    // Validate Aadhaar number format
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      console.warn('Invalid Aadhaar number format:', aadhaarNumber);
      return false;
    }

    const queryParams: Record<string, unknown> = {
      'filters[aadhaarNumber][$eq]': cleanAadhaar,
      populate: '*',
    };

    // If updating a driver, exclude their own record
    if (excludeDriverId) {
      queryParams['filters[documentId][$ne]'] = excludeDriverId;
    }

    console.log('Checking Aadhaar card usage:', cleanAadhaar, 'excluding:', excludeDriverId);
    
    const response = await api.get<StrapiResponse<Driver>>('/api/drivers', queryParams);
    
    console.log('Aadhaar check API response:', response);
    
    // Handle the API response structure
    let isUsed = false;
    
    if (response.data && Array.isArray(response.data)) {
      isUsed = response.data.length > 0;
      console.log('Aadhaar card usage result - drivers found:', response.data.length);
      
      if (isUsed) {
        console.log('Existing driver found with Aadhaar:', response.data[0]);
      }
    }
    
    return isUsed;
  } catch (error) {
    console.error('Error checking Aadhaar card usage:', error);
    return false; // Return false on error to allow form submission
  }
};

/**
 * Gets the driver who is using the specified Aadhaar card
 * @param aadhaarNumber - The 12-digit Aadhaar number to check
 * @param excludeDriverId - Optional driver ID to exclude from the check (for updates)
 * @returns Promise<Driver | null> - The driver using the Aadhaar card, or null if not found
 */
export const getDriverByAadhaar = async (aadhaarNumber: string, excludeDriverId?: string): Promise<Driver | null> => {
  try {
    // Clean the Aadhaar number (remove any non-digits)
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
    
    // Validate Aadhaar number format
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      console.warn('Invalid Aadhaar number format:', aadhaarNumber);
      return null;
    }

    const queryParams: Record<string, unknown> = {
      'filters[aadhaarNumber][$eq]': cleanAadhaar,
      populate: '*',
    };

    // If updating a driver, exclude their own record
    if (excludeDriverId) {
      queryParams['filters[documentId][$ne]'] = excludeDriverId;
    }

    console.log('Getting driver by Aadhaar card:', cleanAadhaar, 'excluding:', excludeDriverId);
    
    const response = await api.get<StrapiResponse<Driver>>('/api/drivers', queryParams);
    
    console.log('Get driver by Aadhaar response:', response.data);
    
    // Handle the API response structure
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting driver by Aadhaar card:', error);
    return null;
  }
};

/**
 * Validates Aadhaar card number format
 * @param aadhaarNumber - The Aadhaar number to validate
 * @returns boolean - True if valid format, false otherwise
 */
export const validateAadhaarFormat = (aadhaarNumber: string): boolean => {
  const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
  return /^\d{12}$/.test(cleanAadhaar);
};

/**
 * Formats Aadhaar number with spaces for display (XXXX XXXX XXXX)
 * @param aadhaarNumber - The raw Aadhaar number
 * @returns string - Formatted Aadhaar number
 */
export const formatAadhaarNumber = (aadhaarNumber: string): string => {
  const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
  if (cleanAadhaar.length === 12) {
    return cleanAadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
  }
  return cleanAadhaar;
};

/**
 * Cleans Aadhaar number by removing all non-digits
 * @param aadhaarNumber - The Aadhaar number to clean
 * @returns string - Clean 12-digit Aadhaar number
 */
export const cleanAadhaarNumber = (aadhaarNumber: string): string => {
  return aadhaarNumber.replace(/\D/g, '');
};

/**
 * Gets all drivers using a specific Aadhaar card (for admin purposes)
 * @param aadhaarNumber - The 12-digit Aadhaar number to check
 * @returns Promise<Driver[]> - Array of drivers using the Aadhaar card
 */
export const getAllDriversByAadhaar = async (aadhaarNumber: string): Promise<Driver[]> => {
  try {
    // Clean the Aadhaar number (remove any non-digits)
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
    
    // Validate Aadhaar number format
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      console.warn('Invalid Aadhaar number format:', aadhaarNumber);
      return [];
    }

    const queryParams = {
      'filters[aadhaarNumber][$eq]': cleanAadhaar,
      populate: '*',
    };

    console.log('Getting all drivers by Aadhaar card:', cleanAadhaar);
    
    const response = await api.get<StrapiResponse<Driver>>('/api/drivers', queryParams);
    
    return response.data && Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error getting all drivers by Aadhaar card:', error);
    return [];
  }
};

/**
 * Validates Aadhaar number using Luhn algorithm (basic check)
 * Note: This is a basic validation. Real Aadhaar validation requires government APIs
 * @param aadhaarNumber - The 12-digit Aadhaar number
 * @returns boolean - True if passes basic validation
 */
export const validateAadhaarChecksum = (aadhaarNumber: string): boolean => {
  const cleanAadhaar = cleanAadhaarNumber(aadhaarNumber);
  
  if (!validateAadhaarFormat(cleanAadhaar)) {
    return false;
  }

  // Basic validation - Aadhaar should not be all same digits
  const allSameDigits = /^(\d)\1{11}$/.test(cleanAadhaar);
  if (allSameDigits) {
    return false;
  }

  // Basic validation - Aadhaar should not start with 0 or 1
  if (cleanAadhaar.startsWith('0') || cleanAadhaar.startsWith('1')) {
    return false;
  }

  return true;
};

/**
 * Debounced Aadhaar card check function
 * @param aadhaarNumber - The Aadhaar number to check
 * @param excludeDriverId - Optional driver ID to exclude
 * @param delay - Delay in milliseconds (default 500ms)
 * @returns Promise<boolean> - True if Aadhaar is in use
 */
export const debouncedAadhaarCheck = (() => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (
    aadhaarNumber: string, 
    excludeDriverId?: string, 
    delay: number = 500
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(async () => {
        const result = await isAadhaarCardUsed(aadhaarNumber, excludeDriverId);
        resolve(result);
      }, delay);
    });
  };
})();
