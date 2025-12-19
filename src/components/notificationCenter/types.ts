/**
 * Base notification interface that all notification types should extend
 */
export interface BaseNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Vehicle reminder notification type
 */
export interface VehicleReminderNotification extends BaseNotification {
  type: 'vehicle-reminder';
  vehicleNumber: string;
  model: string;
  reminderType: 'insurance' | 'permit' | 'pucc' | 'np';
  expiryDate: string;
  daysRemaining: number;
}

/**
 * Union type for all notification types
 */
export type Notification = VehicleReminderNotification;

/**
 * Notification provider interface
 * All notification providers must implement this interface
 */
export interface NotificationProvider {
  /**
   * Unique identifier for this provider
   */
  id: string;
  
  /**
   * Fetch notifications from this provider
   */
  fetchNotifications(): Promise<Notification[]>;
  
  /**
   * Check if this provider has any unread notifications
   */
  hasUnreadNotifications(): Promise<boolean>;
  
  /**
   * Mark notifications as read
   */
  markAsRead?(notificationIds: string[]): Promise<void>;
}

/**
 * Notification state interface
 */
export interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  hasUnread: boolean;
  lastFetched: Date | null;
}
