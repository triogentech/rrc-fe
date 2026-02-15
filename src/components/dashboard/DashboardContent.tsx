"use client";
// import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React, { useEffect, useState } from "react";
// import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
// import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
// import StatisticsChart from "@/components/ecommerce/StatisticsChart";
// import RecentOrders from "@/components/ecommerce/RecentOrders";
// import DemographicCard from "@/components/ecommerce/DemographicCard";
import ExpiredVehiclesModal from "@/components/modals/ExpiredVehiclesModal";
import { api } from "@/store/api/baseApi";
import type { Vehicle, Trip, FuelLog } from "@/store/api/types";
import { getExpiringFields } from "@/utils/vehicleExpiringFields";
import { useVehicles } from "@/store/hooks/useVehicles";
import { fuelLogService } from "@/store/api/services";

interface DashboardMetrics {
  totalVehicles: number;
  activeVehicles: number;
  inactiveVehicles: number;
  todayDepartureTrips: number;
  todayArrivalTrips: number;
  totalTrips: number;
  todayDiesel: number; // in liters
  totalDiesel: number; // in liters
  totalRevenue: number; // in rupees
  vehiclesWithExpiringFields: number;
}

export default function DashboardContent() {
  const [expiredVehicles, setExpiredVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalVehicles: 0,
    activeVehicles: 0,
    inactiveVehicles: 0,
    todayDepartureTrips: 0,
    todayArrivalTrips: 0,
    totalTrips: 0,
    todayDiesel: 0,
    totalDiesel: 0,
    totalRevenue: 0,
    vehiclesWithExpiringFields: 0,
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const { getVehicleDisplayName } = useVehicles();

  // Fetch vehicles with expired fields
  const fetchExpiredVehicles = async (): Promise<Vehicle[]> => {
    try {
      // Fetch all vehicles with a high limit
      const response = await api.get('/api/vehicles', {
        populate: '*',
        'pagination[pageSize]': 1000, // Get all vehicles
      });

      // Handle Strapi response format
      let fetchedVehicles: Vehicle[] = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          fetchedVehicles = response.data as Vehicle[];
        } else if (typeof response.data === 'object' && 'data' in response.data) {
          const strapiResponse = response.data as { data?: Vehicle[] };
          fetchedVehicles = (strapiResponse.data || []) as Vehicle[];
        }
      }

      // Filter vehicles with expired or expiring fields
      const vehiclesWithExpiringFields = fetchedVehicles.filter(
        vehicle => getExpiringFields(vehicle).length > 0
      );

      // Sort by urgency: expired first, then by most urgent expiring field
      const sortedVehicles = [...vehiclesWithExpiringFields].sort((a, b) => {
        const aFields = getExpiringFields(a);
        const bFields = getExpiringFields(b);
        
        const aMostUrgent = aFields[0];
        const bMostUrgent = bFields[0];
        
        // Expired fields come first
        if (aMostUrgent.isExpired && !bMostUrgent.isExpired) return -1;
        if (!aMostUrgent.isExpired && bMostUrgent.isExpired) return 1;
        
        // Then sort by days remaining (most urgent first)
        return aMostUrgent.daysRemaining - bMostUrgent.daysRemaining;
      });

      // Get top 5 vehicles with expired fields only
      const vehiclesWithExpiredFields = sortedVehicles.filter(vehicle => {
        const fields = getExpiringFields(vehicle);
        return fields.some(f => f.isExpired);
      });

      // Get top 5 vehicles with expired fields
      const vehiclesToShow = vehiclesWithExpiredFields.slice(0, 5);

      setExpiredVehicles(vehiclesToShow);
      return vehiclesToShow;
    } catch (error) {
      console.error('Error fetching expired vehicles:', error);
      setExpiredVehicles([]);
      return [];
    }
  };

  // Fetch dashboard metrics
  const fetchDashboardMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      // Fetch all vehicles
      const vehiclesResponse = await api.get('/api/vehicles', {
        populate: '*',
        'pagination[pageSize]': 1000,
      });

      let allVehicles: Vehicle[] = [];
      if (vehiclesResponse.data) {
        if (Array.isArray(vehiclesResponse.data)) {
          allVehicles = vehiclesResponse.data as Vehicle[];
        } else if (typeof vehiclesResponse.data === 'object' && 'data' in vehiclesResponse.data) {
          const strapiResponse = vehiclesResponse.data as { data?: Vehicle[] };
          allVehicles = (strapiResponse.data || []) as Vehicle[];
        }
      }

      // Calculate vehicle metrics
      const totalVehicles = allVehicles.length;
      const activeVehicles = allVehicles.filter(v => v.isActive === true).length;
      const inactiveVehicles = allVehicles.filter(v => v.isActive === false).length;
      const vehiclesWithExpiringFields = allVehicles.filter(
        vehicle => getExpiringFields(vehicle).length > 0
      ).length;

      // Fetch all trips
      const tripsResponse = await api.get('/api/trips', {
        populate: '*',
        'pagination[pageSize]': 1000,
      });

      let allTrips: Trip[] = [];
      if (tripsResponse.data) {
        if (Array.isArray(tripsResponse.data)) {
          allTrips = tripsResponse.data as Trip[];
        } else if (typeof tripsResponse.data === 'object' && 'data' in tripsResponse.data) {
          const strapiResponse = tripsResponse.data as { data?: Trip[] };
          allTrips = (strapiResponse.data || []) as Trip[];
        }
      }

      // Calculate trip metrics
      const totalTrips = allTrips.length;
      
      // Get today's date (start of day) for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Today departure trips - based on Start Time (estimatedStartTime)
      const todayDepartureTrips = allTrips.filter(trip => {
        if (!trip.estimatedStartTime) return false;
        const startTime = new Date(trip.estimatedStartTime);
        startTime.setHours(0, 0, 0, 0);
        return startTime.getTime() === today.getTime();
      }).length;

      // Today arrival trips - based on End Time (estimatedEndTime)
      const todayArrivalTrips = allTrips.filter(trip => {
        if (!trip.estimatedEndTime) return false;
        const endTime = new Date(trip.estimatedEndTime);
        endTime.setHours(0, 0, 0, 0);
        return endTime.getTime() === today.getTime();
      }).length;

      // Calculate total revenue from trips (sum of freightTotalAmount)
      const totalRevenue = allTrips.reduce((sum, trip) => {
        return sum + (trip.freightTotalAmount || 0);
      }, 0);

      // Fetch all fuel logs
      const fuelLogsResponse = await fuelLogService.getFuelLogs({
        limit: 1000,
      });

      let allFuelLogs: FuelLog[] = [];
      if (fuelLogsResponse.data) {
        if (Array.isArray(fuelLogsResponse.data)) {
          allFuelLogs = fuelLogsResponse.data as FuelLog[];
        } else if (typeof fuelLogsResponse.data === 'object' && 'data' in fuelLogsResponse.data) {
          const strapiResponse = fuelLogsResponse.data as { data?: FuelLog[] };
          allFuelLogs = (strapiResponse.data || []) as FuelLog[];
        }
      }

      // Filter diesel logs only
      const dieselLogs = allFuelLogs.filter(log => {
        const fuelType = (log as Record<string, unknown>).fuelType;
        return fuelType === 'diesel' || fuelType === 'Diesel';
      });

      // Calculate diesel metrics
      const totalDiesel = dieselLogs.reduce((sum, log) => {
        const quantity = (log as Record<string, unknown>).fuelQuantityInLtr;
        return sum + (typeof quantity === 'number' ? quantity : 0);
      }, 0);

      // Today's diesel (filter by date)
      const todayDieselLogs = dieselLogs.filter(log => {
        const logDate = (log as Record<string, unknown>).date;
        if (!logDate) return false;
        const date = typeof logDate === 'string' ? new Date(logDate) : new Date(logDate as Date);
        date.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
      });

      const todayDiesel = todayDieselLogs.reduce((sum, log) => {
        const quantity = (log as Record<string, unknown>).fuelQuantityInLtr;
        return sum + (typeof quantity === 'number' ? quantity : 0);
      }, 0);

      setMetrics({
        totalVehicles,
        activeVehicles,
        inactiveVehicles,
        todayDepartureTrips,
        todayArrivalTrips,
        totalTrips,
        todayDiesel,
        totalDiesel,
        totalRevenue,
        vehiclesWithExpiringFields,
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  // Check if modal should be shown on first visit
  useEffect(() => {
    const checkAndShowModal = async () => {
      const hasSeenModal = localStorage.getItem('expiredVehiclesModalSeen');
      
      // If user has already seen the modal, don't fetch
      if (hasSeenModal) {
        return;
      }
      
      // Fetch expired vehicles
      const vehicles = await fetchExpiredVehicles();
      
      // Only show modal if there are vehicles with expired/expiring fields
      if (vehicles.length > 0) {
        setIsModalOpen(true);
        // Mark as seen
        localStorage.setItem('expiredVehiclesModalSeen', 'true');
      }
    };

    checkAndShowModal();
    fetchDashboardMetrics();
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const MetricCard = ({ title, value, icon, color = "blue" }: { title: string; value: string | number; icon: React.ReactNode; color?: string }) => {
    const colorClasses = {
      blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
      green: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
      red: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400",
      yellow: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
      purple: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
      orange: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
    };

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
          {icon}
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {isLoadingMetrics ? (
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-20 rounded"></div>
            ) : (
              value
            )}
          </h4>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Commented out original dashboard content */}
        {/* <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />

          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div> */}

        {/* New Dashboard Metrics */}
        <div className="col-span-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard Overview</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
            <MetricCard
              title="Total Vehicles"
              value={metrics.totalVehicles}
              color="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0M15 17a2 2 0 104 0" />
                </svg>
              }
            />
            <MetricCard
              title="Active Vehicles"
              value={metrics.activeVehicles}
              color="green"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <MetricCard
              title="Inactive Vehicles"
              value={metrics.inactiveVehicles}
              color="red"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <MetricCard
              title="Today Departure Trips"
              value={metrics.todayDepartureTrips}
              color="purple"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <MetricCard
              title="Today Arrival Trips"
              value={metrics.todayArrivalTrips}
              color="orange"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            />
            <MetricCard
              title="Total Trips"
              value={metrics.totalTrips}
              color="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <MetricCard
              title="Today's Diesel"
              value={`${metrics.todayDiesel.toFixed(2)} L`}
              color="yellow"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              }
            />
            <MetricCard
              title="Total Diesel"
              value={`${metrics.totalDiesel.toFixed(2)} L`}
              color="yellow"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
            />
            <MetricCard
              title="Total Revenue"
              value={`₹${metrics.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              color="green"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <MetricCard
              title="Vehicles with Expiring Fields"
              value={metrics.vehiclesWithExpiringFields}
              color="red"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
          </div>
        </div>
      </div>

      {/* Expired Vehicles Modal */}
      <ExpiredVehiclesModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        vehicles={expiredVehicles}
        getVehicleDisplayName={getVehicleDisplayName}
      />
    </>
  );
}
