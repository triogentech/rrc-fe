import type { Vehicle } from '@/store/api/types';

export interface ExpiringField {
  type: 'insurance' | 'permit' | 'pucc' | 'np';
  label: string;
  expiryDate: string;
  daysRemaining: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isExpired: boolean;
}

/**
 * Check if a vehicle has any fields expiring within 7 days or already expired
 * Returns an array of expiring/expired fields with their details
 */
export function getExpiringFields(vehicle: Vehicle, daysThreshold: number = 7): ExpiringField[] {
  const expiringFields: ExpiringField[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day
  const thresholdDate = new Date(today);
  thresholdDate.setDate(today.getDate() + daysThreshold);

  // Helper function to check and add field
  const checkField = (
    date: string | undefined,
    type: 'insurance' | 'permit' | 'pucc' | 'np',
    label: string
  ) => {
    if (!date) return;

    const fieldDate = new Date(date);
    fieldDate.setHours(0, 0, 0, 0);
    if (isNaN(fieldDate.getTime())) return;

    const daysRemaining = Math.ceil((fieldDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining < 0;
    
    // Include if expired or expiring within threshold
    if (isExpired || (daysRemaining >= 0 && daysRemaining <= daysThreshold)) {
      // Expired fields get highest priority, then urgent for <= 1 day
      let priority: 'low' | 'medium' | 'high' | 'urgent';
      if (isExpired) {
        priority = 'urgent'; // Expired fields are always urgent
      } else {
        priority = daysRemaining <= 1 ? 'urgent' : daysRemaining <= 3 ? 'high' : daysRemaining <= 5 ? 'medium' : 'low';
      }

      expiringFields.push({
        type,
        label,
        expiryDate: date,
        daysRemaining,
        priority,
        isExpired,
      });
    }
  };

  // Check all fields
  checkField(vehicle.insuranceDate, 'insurance', 'Insurance');
  checkField(vehicle.permitDate, 'permit', 'Permit');
  checkField(vehicle.puccDate, 'pucc', 'PUCC');
  checkField(vehicle.npValidUpto, 'np', 'NP Valid');

  // Sort: expired first (most negative days), then by days remaining (most urgent first)
  return expiringFields.sort((a, b) => {
    // Expired fields come first
    if (a.isExpired && !b.isExpired) return -1;
    if (!a.isExpired && b.isExpired) return 1;
    // Then sort by days remaining (ascending)
    return a.daysRemaining - b.daysRemaining;
  });
}

/**
 * Get the color class for a reminder type
 */
export function getReminderTypeColor(type: ExpiringField['type']): string {
  switch (type) {
    case 'insurance':
      return 'bg-blue-500';
    case 'permit':
      return 'bg-yellow-500';
    case 'pucc':
      return 'bg-green-500';
    case 'np':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Get the priority color class
 */
export function getPriorityColor(priority: ExpiringField['priority'], isExpired: boolean = false): string {
  if (isExpired) {
    return 'bg-red-600 text-white'; // Darker red for expired
  }
  
  switch (priority) {
    case 'urgent':
      return 'bg-red-500 text-white';
    case 'high':
      return 'bg-orange-500 text-white';
    case 'medium':
      return 'bg-yellow-500 text-white';
    case 'low':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

