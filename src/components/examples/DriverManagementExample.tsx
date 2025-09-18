"use client";
import React from 'react';
import { useDriverCreateModal } from '@/hooks/useDriverCreateModal';
import DriverCreateModal from '@/components/modals/DriverCreateModal';

export default function DriverManagementExample() {
  const { isOpen, openModal, closeModal, handleSuccess } = useDriverCreateModal();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Driver Management
        </h1>
        <button
          onClick={openModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Add New Driver
        </button>
      </div>

      {/* Your existing driver list/content goes here */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Click "Add New Driver" to open the driver creation form.
        </p>
      </div>

      {/* Driver Creation Modal */}
      <DriverCreateModal
        isOpen={isOpen}
        onClose={closeModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
