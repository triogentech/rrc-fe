import { api } from "@/store/api/baseApi";
import type { 
  NotificationProvider, 
  Notification,
  VehicleReminderNotification 
} from "../types";

interface VehicleData {
  vehicleNumber: string;
  model: string;
  insuranceDate?: string;
  permitDate?: string;
  puccDate?: string;
  npValidUpto?: string;
}

export class VehicleReminderProvider implements NotificationProvider {
  id = 'vehicle-reminder-provider';

  /**
   * Fetch vehicle reminders from the API
   */
  async fetchNotifications(): Promise<Notification[]> {
    try {
      const response = await api.get('/api/vehicles', {
        fields: 'insuranceDate,permitDate,puccDate,npValidUpto,vehicleNumber,model',
        'pagination[pageSize]': 1000, // Get all vehicles
      });

      // Handle Strapi response format
      let vehicles: VehicleData[] = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          vehicles = response.data as VehicleData[];
        } else if (typeof response.data === 'object' && 'data' in response.data) {
          const strapiResponse = response.data as { data?: VehicleData[] };
          vehicles = (strapiResponse.data || []) as VehicleData[];
        }
      }

      const notifications: VehicleReminderNotification[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset to start of day
      const oneWeekFromNow = new Date(today);
      oneWeekFromNow.setDate(today.getDate() + 7);

      vehicles.forEach((vehicle) => {
        // Helper function to check and add notification
        const checkField = (
          date: string | undefined,
          reminderType: 'insurance' | 'permit' | 'pucc' | 'np'
        ) => {
          if (!date) return;

          const fieldDate = new Date(date);
          fieldDate.setHours(0, 0, 0, 0);
          if (isNaN(fieldDate.getTime())) return;

          const daysRemaining = Math.ceil((fieldDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isExpired = daysRemaining < 0;

          // Include if expired or expiring within 7 days
          if (isExpired || (daysRemaining >= 0 && daysRemaining <= 7)) {
            notifications.push(this.createReminderNotification(
              vehicle,
              reminderType,
              date,
              daysRemaining,
              isExpired
            ));
          }
        };

        // Check all fields
        checkField(vehicle.insuranceDate, 'insurance');
        checkField(vehicle.permitDate, 'permit');
        checkField(vehicle.puccDate, 'pucc');
        checkField(vehicle.npValidUpto, 'np');
      });

      // Sort by days remaining (ascending - most urgent first)
      notifications.sort((a, b) => a.daysRemaining - b.daysRemaining);

      return notifications;
    } catch (error) {
      console.error('Error fetching vehicle reminders:', error);
      return [];
    }
  }

  /**
   * Check if there are any unread vehicle reminders
   */
  async hasUnreadNotifications(): Promise<boolean> {
    const notifications = await this.fetchNotifications();
    return notifications.length > 0;
  }

  /**
   * Create a reminder notification object
   */
  private createReminderNotification(
    vehicle: VehicleData,
    reminderType: 'insurance' | 'permit' | 'pucc' | 'np',
    expiryDate: string,
    daysRemaining: number,
    isExpired: boolean = false
  ): VehicleReminderNotification {
    const reminderTypeLabels = {
      insurance: 'Insurance',
      permit: 'Permit',
      pucc: 'PUCC',
      np: 'NP Valid',
    };

    // Expired fields are always urgent
    const priority = isExpired ? 'urgent' : (daysRemaining <= 1 ? 'urgent' : daysRemaining <= 3 ? 'high' : daysRemaining <= 5 ? 'medium' : 'low');

    const daysText = isExpired 
      ? `expired ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} ago`
      : `expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;

    return {
      id: `${vehicle.vehicleNumber}-${reminderType}-${expiryDate}`,
      type: 'vehicle-reminder',
      title: isExpired 
        ? `${reminderTypeLabels[reminderType]} Expired`
        : `${reminderTypeLabels[reminderType]} Expiring Soon`,
      message: `${vehicle.vehicleNumber} - ${vehicle.model} ${reminderTypeLabels[reminderType]} ${daysText}`,
      timestamp: new Date(),
      priority,
      read: false,
      vehicleNumber: vehicle.vehicleNumber,
      model: vehicle.model,
      reminderType,
      expiryDate,
      daysRemaining,
      actionUrl: '/vehicles',
      metadata: {
        vehicleNumber: vehicle.vehicleNumber,
        model: vehicle.model,
      },
    };
  }
}
