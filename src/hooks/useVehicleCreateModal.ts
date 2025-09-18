import { useState } from 'react';
import type { Vehicle } from '@/store/api/types';

export const useVehicleCreateModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleSuccess = (vehicle: Vehicle) => {
    console.log('Vehicle created successfully:', vehicle);
    closeModal();
  };

  return {
    isOpen,
    openModal,
    closeModal,
    handleSuccess,
  };
};

export default useVehicleCreateModal;
