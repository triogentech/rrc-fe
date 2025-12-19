import type { VehicleReminderNotification } from '../types';

/**
 * Get the label for a reminder type
 */
export function getReminderTypeLabel(
  type: VehicleReminderNotification['reminderType']
): string {
  switch (type) {
    case 'insurance':
      return 'Insurance';
    case 'permit':
      return 'Permit';
    case 'pucc':
      return 'PUCC';
    case 'np':
      return 'NP Valid';
    default:
      return 'Document';
  }
}

/**
 * Get the color class for a reminder type
 */
export function getReminderTypeColor(
  type: VehicleReminderNotification['reminderType']
): string {
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
export function getPriorityColor(priority: 'low' | 'medium' | 'high' | 'urgent'): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
}
