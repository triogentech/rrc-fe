import { useState, useCallback } from 'react';
import type { Trip } from '@/store/api/types';

export const useTripCreateModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [createdTrip, setCreatedTrip] = useState<Trip | null>(null);

  const openModal = useCallback(() => {
    setIsOpen(true);
    setCreatedTrip(null); // Clear any previously created trip
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSuccess = useCallback((trip: Trip) => {
    setCreatedTrip(trip);
    // Optionally, keep modal open for a moment or close immediately
    // closeModal();
  }, []);

  return {
    isOpen,
    createdTrip,
    openModal,
    closeModal,
    handleSuccess,
  };
};
