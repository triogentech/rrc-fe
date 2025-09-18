import { useState, useCallback } from 'react';
import type { Staff } from '@/store/api/types';

export const useStaffCreateModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [createdStaff, setCreatedStaff] = useState<Staff | null>(null);

  const openModal = useCallback(() => {
    setIsOpen(true);
    setCreatedStaff(null); // Clear any previously created staff
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSuccess = useCallback((staff: Staff) => {
    setCreatedStaff(staff);
    // Optionally, keep modal open for a moment or close immediately
    // closeModal();
  }, []);

  return {
    isOpen,
    createdStaff,
    openModal,
    closeModal,
    handleSuccess,
  };
};
