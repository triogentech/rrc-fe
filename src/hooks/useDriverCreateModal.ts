import { useState, useCallback } from 'react';
import type { Driver } from '@/store/api/types';

export const useDriverCreateModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSuccess = useCallback((driver: Driver) => {
    console.log('Driver created successfully:', driver);
    // You can add additional success handling here
    // For example, refresh the drivers list, show a success message, etc.
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
    handleSuccess,
  };
};
