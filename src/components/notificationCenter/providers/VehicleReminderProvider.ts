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
      const oneWeekFromNow = new Date(today);
      oneWeekFromNow.setDate(today.getDate() + 7);

      vehicles.forEach((vehicle) => {
        // Check insuranceDate
        if (vehicle.insuranceDate) {
          const insuranceDate = new Date(vehicle.insuranceDate);
          if (!isNaN(insuranceDate.getTime()) && insuranceDate <= oneWeekFromNow && insuranceDate >= today) {
            const daysRemaining = Math.ceil((insuranceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            notifications.push(this.createReminderNotification(
              vehicle,
              'insurance',
              vehicle.insuranceDate,
              daysRemaining
            ));
          }
        }

        // Check permitDate
        if (vehicle.permitDate) {
          const permitDate = new Date(vehicle.permitDate);
          if (!isNaN(permitDate.getTime()) && permitDate <= oneWeekFromNow && permitDate >= today) {
            const daysRemaining = Math.ceil((permitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            notifications.push(this.createReminderNotification(
              vehicle,
              'permit',
              vehicle.permitDate,
              daysRemaining
            ));
          }
        }

        // Check puccDate
        if (vehicle.puccDate) {
          const puccDate = new Date(vehicle.puccDate);
          if (!isNaN(puccDate.getTime()) && puccDate <= oneWeekFromNow && puccDate >= today) {
            const daysRemaining = Math.ceil((puccDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            notifications.push(this.createReminderNotification(
              vehicle,
              'pucc',
              vehicle.puccDate,
              daysRemaining
            ));
          }
        }

        // Check npValidUpto
        if (vehicle.npValidUpto) {
          const npValidUpto = new Date(vehicle.npValidUpto);
          if (!isNaN(npValidUpto.getTime()) && npValidUpto <= oneWeekFromNow && npValidUpto >= today) {
            const daysRemaining = Math.ceil((npValidUpto.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            notifications.push(this.createReminderNotification(
              vehicle,
              'np',
              vehicle.npValidUpto,
              daysRemaining
            ));
          }
        }
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
    daysRemaining: number
  ): VehicleReminderNotification {
    const reminderTypeLabels = {
      insurance: 'Insurance',
      permit: 'Permit',
      pucc: 'PUCC',
      np: 'NP Valid',
    };

    const priority = daysRemaining <= 1 ? 'urgent' : daysRemaining <= 3 ? 'high' : daysRemaining <= 5 ? 'medium' : 'low';

    return {
      id: `${vehicle.vehicleNumber}-${reminderType}-${expiryDate}`,
      type: 'vehicle-reminder',
      title: `${reminderTypeLabels[reminderType]} Expiring Soon`,
      message: `${vehicle.vehicleNumber} - ${vehicle.model} ${reminderTypeLabels[reminderType]} expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
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
