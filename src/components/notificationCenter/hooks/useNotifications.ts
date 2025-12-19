import { useState, useEffect, useCallback } from 'react';
import { useReduxAuth } from '@/store/hooks/useReduxAuth';
import type { Notification, NotificationState } from '../types';
import { VehicleReminderProvider } from '../providers/VehicleReminderProvider';

/**
 * List of all notification providers
 * Add new providers here as they are created
 */
const notificationProviders = [
  new VehicleReminderProvider(),
  // Add more providers here in the future
  // e.g., new TripReminderProvider(),
  // e.g., new MaintenanceReminderProvider(),
];

/**
 * Custom hook to manage and fetch all notifications
 */
export function useNotifications() {
  const { isAuthenticated } = useReduxAuth();
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    isLoading: false,
    error: null,
    hasUnread: false,
    lastFetched: null,
  });

  /**
   * Fetch notifications from all providers
   */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setState({
        notifications: [],
        isLoading: false,
        error: null,
        hasUnread: false,
        lastFetched: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch from all providers in parallel
      const providerPromises = notificationProviders.map((provider) =>
        provider.fetchNotifications().catch((error) => {
          console.error(`Error fetching notifications from ${provider.id}:`, error);
          return [] as Notification[];
        })
      );

      const providerResults = await Promise.all(providerPromises);
      
      // Flatten and combine all notifications
      const allNotifications = providerResults.flat();
      
      // Sort by priority and timestamp
      allNotifications.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      const hasUnread = allNotifications.length > 0;

      setState({
        notifications: allNotifications,
        isLoading: false,
        error: null,
        hasUnread,
        lastFetched: new Date(),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
      }));
    }
  }, [isAuthenticated]);

  /**
   * Check if there are unread notifications
   */
  const checkUnreadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      return false;
    }

    try {
      const unreadChecks = await Promise.all(
        notificationProviders.map((provider) => provider.hasUnreadNotifications())
      );
      return unreadChecks.some((hasUnread) => hasUnread);
    } catch (error) {
      console.error('Error checking unread notifications:', error);
      return false;
    }
  }, [isAuthenticated]);

  // Fetch notifications when authenticated state changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    ...state,
    fetchNotifications,
    checkUnreadNotifications,
    refresh: fetchNotifications,
  };
}
