# Notification Center

A centralized system for managing all notifications in the application. This architecture makes it easy to add new notification types without modifying the core notification dropdown component.

## 📁 Structure

```
notificationCenter/
├── types.ts                    # TypeScript types and interfaces
├── providers/                  # Notification providers (one per notification type)
│   └── VehicleReminderProvider.ts
├── hooks/                     # React hooks
│   └── useNotifications.ts    # Main hook for fetching all notifications
├── utils/                      # Utility functions
│   └── notificationHelpers.ts # Helper functions for rendering
├── index.ts                    # Public exports
└── README.md                   # This file
```

## 🚀 How It Works

1. **Providers**: Each notification type has its own provider class that implements the `NotificationProvider` interface
2. **Hook**: The `useNotifications` hook aggregates notifications from all providers
3. **Rendering**: The `NotificationDropdown` component renders notifications based on their type

## ➕ Adding a New Notification Type

### Step 1: Define the Notification Type

Add your notification type to `types.ts`:

```typescript
export interface TripReminderNotification extends BaseNotification {
  type: 'trip-reminder';
  tripId: string;
  tripName: string;
  dueDate: string;
  // ... other fields
}

// Update the union type
export type Notification = VehicleReminderNotification | TripReminderNotification;
```

### Step 2: Create a Provider

Create a new file in `providers/` (e.g., `TripReminderProvider.ts`):

```typescript
import type { NotificationProvider, Notification, TripReminderNotification } from "../types";

export class TripReminderProvider implements NotificationProvider {
  id = 'trip-reminder-provider';

  async fetchNotifications(): Promise<Notification[]> {
    // Fetch your notifications from API
    // Transform them into TripReminderNotification objects
    return notifications;
  }

  async hasUnreadNotifications(): Promise<boolean> {
    const notifications = await this.fetchNotifications();
    return notifications.length > 0;
  }
}
```

### Step 3: Register the Provider

Add your provider to `hooks/useNotifications.ts`:

```typescript
import { TripReminderProvider } from '../providers/TripReminderProvider';

const notificationProviders = [
  new VehicleReminderProvider(),
  new TripReminderProvider(), // Add your provider here
];
```

### Step 4: Render in NotificationDropdown

Add rendering logic in `NotificationDropdown.tsx`:

```typescript
if (notification.type === 'trip-reminder') {
  const tripReminder = notification as TripReminderNotification;
  return (
    <li key={tripReminder.id}>
      {/* Your custom rendering */}
    </li>
  );
}
```

## 📖 Usage

### Basic Usage

```typescript
import { useNotifications } from '@/components/notificationCenter';

function MyComponent() {
  const { notifications, isLoading, hasUnread, refresh } = useNotifications();
  
  return (
    <div>
      {hasUnread && <Badge>New notifications</Badge>}
      {notifications.map(notification => (
        <div key={notification.id}>{notification.title}</div>
      ))}
    </div>
  );
}
```

### Using Helpers

```typescript
import { 
  getReminderTypeLabel, 
  getReminderTypeColor 
} from '@/components/notificationCenter';

const label = getReminderTypeLabel('insurance'); // "Insurance"
const color = getReminderTypeColor('insurance'); // "bg-blue-500"
```

## 🎯 Best Practices

1. **Provider Isolation**: Each provider should be independent and handle its own errors
2. **Type Safety**: Always use TypeScript types and type guards
3. **Error Handling**: Providers should return empty arrays on error, not throw
4. **Performance**: Providers fetch in parallel, but keep API calls efficient
5. **Priority**: Use priority levels (low, medium, high, urgent) to sort notifications

## 🔧 Provider Interface

All providers must implement:

```typescript
interface NotificationProvider {
  id: string;
  fetchNotifications(): Promise<Notification[]>;
  hasUnreadNotifications(): Promise<boolean>;
  markAsRead?(notificationIds: string[]): Promise<void>; // Optional
}
```

## 📝 Example: Complete Trip Reminder Provider

```typescript
import { api } from "@/store/api/baseApi";
import type { NotificationProvider, Notification, TripReminderNotification } from "../types";

export class TripReminderProvider implements NotificationProvider {
  id = 'trip-reminder-provider';

  async fetchNotifications(): Promise<Notification[]> {
    try {
      const response = await api.get('/api/trips', {
        status: 'pending',
        'pagination[pageSize]': 100,
      });

      const trips = response.data?.data || [];
      const notifications: TripReminderNotification[] = [];

      trips.forEach((trip) => {
        // Your logic to create notifications
        notifications.push({
          id: `trip-${trip.id}`,
          type: 'trip-reminder',
          title: 'Trip Reminder',
          message: `Trip ${trip.name} is due soon`,
          timestamp: new Date(),
          priority: 'medium',
          read: false,
          tripId: trip.id,
          tripName: trip.name,
          dueDate: trip.dueDate,
        });
      });

      return notifications;
    } catch (error) {
      console.error('Error fetching trip reminders:', error);
      return [];
    }
  }

  async hasUnreadNotifications(): Promise<boolean> {
    const notifications = await this.fetchNotifications();
    return notifications.length > 0;
  }
}
```

## 🎨 Notification Priority

Notifications are automatically sorted by priority:
- `urgent` - Red badge, highest priority
- `high` - Orange badge
- `medium` - Yellow badge
- `low` - Blue badge, lowest priority

Within the same priority, notifications are sorted by timestamp (newest first).
