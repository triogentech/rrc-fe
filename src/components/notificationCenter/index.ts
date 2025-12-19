/**
 * Notification Center
 * 
 * A centralized system for managing all notifications in the application.
 * 
 * To add a new notification type:
 * 1. Create a new provider in providers/ folder implementing NotificationProvider
 * 2. Add the provider to the notificationProviders array in hooks/useNotifications.ts
 * 3. Add the notification type to types.ts
 * 4. Update the NotificationDropdown component to render your new notification type
 */

// Types
export type {
  BaseNotification,
  Notification,
  VehicleReminderNotification,
  NotificationProvider,
  NotificationState,
} from './types';

// Providers
export { VehicleReminderProvider } from './providers/VehicleReminderProvider';

// Hooks
export { useNotifications } from './hooks/useNotifications';

// Utils
export {
  getReminderTypeLabel,
  getReminderTypeColor,
  getPriorityColor,
} from './utils/notificationHelpers';
