import { useState, useCallback, useEffect } from 'react';
import { 
  isAadhaarCardUsed, 
  getDriverByAadhaar, 
  validateAadhaarFormat,
  validateAadhaarChecksum,
  formatAadhaarNumber,
  cleanAadhaarNumber,
  debouncedAadhaarCheck
} from '@/utils/aadhaarCardUsed';
import type { Driver } from '@/store/api/types';

interface UseAadhaarValidationOptions {
  excludeDriverId?: string;
  enableRealTimeCheck?: boolean;
  debounceDelay?: number;
}

interface AadhaarValidationState {
  isValid: boolean;
  isChecking: boolean;
  isUsed: boolean;
  existingDriver: Driver | null;
  error: string | null;
  formattedNumber: string;
}

export const useAadhaarValidation = (options: UseAadhaarValidationOptions = {}) => {
  const {
    excludeDriverId,
    enableRealTimeCheck = true,
    debounceDelay = 500
  } = options;

  const [validationState, setValidationState] = useState<AadhaarValidationState>({
    isValid: false,
    isChecking: false,
    isUsed: false,
    existingDriver: null,
    error: null,
    formattedNumber: ''
  });

  const validateAadhaar = useCallback(async (aadhaarNumber: string) => {
    const cleanNumber = cleanAadhaarNumber(aadhaarNumber);
    const formattedNumber = formatAadhaarNumber(cleanNumber);

    // Reset state
    setValidationState(prev => ({
      ...prev,
      isChecking: true,
      error: null,
      formattedNumber
    }));

    try {
      // Basic format validation
      if (!validateAadhaarFormat(cleanNumber)) {
        setValidationState(prev => ({
          ...prev,
          isValid: false,
          isChecking: false,
          error: cleanNumber.length === 0 ? null : 'Aadhaar number must be exactly 12 digits'
        }));
        return;
      }

      // Basic checksum validation
      if (!validateAadhaarChecksum(cleanNumber)) {
        setValidationState(prev => ({
          ...prev,
          isValid: false,
          isChecking: false,
          error: 'Invalid Aadhaar number format'
        }));
        return;
      }

      // Check if Aadhaar is already used (if real-time check is enabled)
      if (enableRealTimeCheck) {
        const isUsed = await debouncedAadhaarCheck(cleanNumber, excludeDriverId, debounceDelay);
        let existingDriver = null;

        if (isUsed) {
          existingDriver = await getDriverByAadhaar(cleanNumber, excludeDriverId);
        }

        setValidationState(prev => ({
          ...prev,
          isValid: !isUsed,
          isChecking: false,
          isUsed,
          existingDriver,
          error: isUsed ? 'This Aadhaar card is already registered with another driver' : null
        }));
      } else {
        setValidationState(prev => ({
          ...prev,
          isValid: true,
          isChecking: false,
          isUsed: false,
          existingDriver: null,
          error: null
        }));
      }
    } catch (error) {
      console.error('Error validating Aadhaar:', error);
      setValidationState(prev => ({
        ...prev,
        isValid: false,
        isChecking: false,
        error: 'Error validating Aadhaar number. Please try again.'
      }));
    }
  }, [excludeDriverId, enableRealTimeCheck, debounceDelay]);

  const checkAadhaarUsage = useCallback(async (aadhaarNumber: string): Promise<boolean> => {
    try {
      return await isAadhaarCardUsed(aadhaarNumber, excludeDriverId);
    } catch (error) {
      console.error('Error checking Aadhaar usage:', error);
      return false;
    }
  }, [excludeDriverId]);

  const getExistingDriver = useCallback(async (aadhaarNumber: string): Promise<Driver | null> => {
    try {
      return await getDriverByAadhaar(aadhaarNumber, excludeDriverId);
    } catch (error) {
      console.error('Error getting existing driver:', error);
      return null;
    }
  }, [excludeDriverId]);

  const formatNumber = useCallback((aadhaarNumber: string): string => {
    return formatAadhaarNumber(aadhaarNumber);
  }, []);

  const cleanNumber = useCallback((aadhaarNumber: string): string => {
    return cleanAadhaarNumber(aadhaarNumber);
  }, []);

  const isFormatValid = useCallback((aadhaarNumber: string): boolean => {
    return validateAadhaarFormat(aadhaarNumber);
  }, []);

  const isChecksumValid = useCallback((aadhaarNumber: string): boolean => {
    return validateAadhaarChecksum(aadhaarNumber);
  }, []);

  const clearValidation = useCallback(() => {
    setValidationState({
      isValid: false,
      isChecking: false,
      isUsed: false,
      existingDriver: null,
      error: null,
      formattedNumber: ''
    });
  }, []);

  return {
    // State
    ...validationState,
    
    // Actions
    validateAadhaar,
    checkAadhaarUsage,
    getExistingDriver,
    clearValidation,
    
    // Utilities
    formatNumber,
    cleanNumber,
    isFormatValid,
    isChecksumValid,
  };
};

export default useAadhaarValidation;
