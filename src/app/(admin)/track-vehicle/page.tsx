"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useVehicles } from "@/store/hooks/useVehicles";
import type { Vehicle } from "@/store/api/types";

// LetsGro device response (single device from pull_api?name=...)
interface LetsGroDevice {
  alarm?: string | null;
  course?: string | null;
  daily_distance?: number | null;
  deviceFixTime?: string | null;
  deviceId?: number | null;
  deviceImei?: string | null;
  ignition?: string | boolean | null;
  lastUpdate?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  motion?: boolean | null;
  name?: string | null;
  phone?: string | null;
  posId?: number | null;
  speed?: string | null;
  status?: string | null;
  totalDistance?: string | null;
  type?: string | null;
  vehicleType?: string | null;
  zone?: string | null;
}

interface LetsGroError {
  error?: string;
  message?: string;
}

type TrackResponse =
  | { data: LetsGroDevice; message?: string; status?: string }
  | { data: LetsGroDevice[]; message?: string; status?: string }
  | { error: string; details?: unknown };

function isDevice(obj: LetsGroDevice | LetsGroError): obj is LetsGroDevice {
  return obj != null && "deviceId" in obj && !("error" in obj);
}

export default function TrackVehiclePage() {
  const searchParams = useSearchParams();
  const nameFromUrl = searchParams.get("name");
  const { vehicles, isLoading: vehiclesLoading, getVehicles } = useVehicles();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [trackData, setTrackData] = useState<LetsGroDevice | LetsGroError | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const lastFetchedNameRef = useRef<string | null>(null);

  useEffect(() => {
    getVehicles({ page: 1, limit: 500, active: true });
  }, [getVehicles]);

  const fetchTracking = useCallback(async (vehicleNumber: string) => {
    setTrackLoading(true);
    setTrackError(null);
    setTrackData(null);
    try {
      const res = await fetch(
        `/api/track?name=${encodeURIComponent(vehicleNumber)}`
      );
      const json: TrackResponse = await res.json();
      if (!res.ok) {
        const err = json && typeof json === "object" && "error" in json ? (json as { error?: string }).error : "Failed to load tracking";
        setTrackError(err || "Failed to load tracking");
        setTrackData(null);
        return;
      }
      if (json && typeof json === "object" && "data" in json) {
        const data = (json as { data: LetsGroDevice | LetsGroDevice[] }).data;
        if (Array.isArray(data)) {
          const first = data.find(isDevice);
          setTrackData(first ?? (data[0] as LetsGroDevice) ?? null);
        } else {
          setTrackData(isDevice(data) ? data : data);
        }
      } else {
        setTrackData(null);
      }
    } catch {
      setTrackError("Network error");
      setTrackData(null);
    } finally {
      setTrackLoading(false);
    }
  }, []);

  // When opening with ?name=... (e.g. from vehicles table Track button), auto-load that vehicle
  useEffect(() => {
    if (!nameFromUrl?.trim()) return;
    const name = nameFromUrl.trim();
    const vehicleFromList = vehicles.find(
      (v) => v.vehicleNumber.toLowerCase() === name.toLowerCase()
    );
    if (vehicleFromList) {
      setSelectedVehicle(vehicleFromList);
      if (lastFetchedNameRef.current !== vehicleFromList.vehicleNumber) {
        lastFetchedNameRef.current = vehicleFromList.vehicleNumber;
        fetchTracking(vehicleFromList.vehicleNumber);
      }
    } else {
      const minimal: Vehicle = {
        documentId: "",
        vehicleNumber: name,
        model: "—",
        type: "truck",
        currentStatus: "",
        isActive: true,
        publishedAt: "",
      } as Vehicle;
      setSelectedVehicle(minimal);
      if (lastFetchedNameRef.current !== name) {
        lastFetchedNameRef.current = name;
        fetchTracking(name);
      }
    }
  }, [nameFromUrl, vehicles, fetchTracking]);

  // When vehicles list loads and we had opened by ?name=..., highlight that vehicle in the list
  useEffect(() => {
    if (!nameFromUrl?.trim() || !selectedVehicle || selectedVehicle.documentId) return;
    const match = vehicles.find(
      (v) => v.vehicleNumber.toLowerCase() === nameFromUrl.trim().toLowerCase()
    );
    if (match) setSelectedVehicle(match);
  }, [nameFromUrl, selectedVehicle, vehicles]);

  const handleSelectVehicle = useCallback(
    (vehicle: Vehicle) => {
      setSelectedVehicle(vehicle);
      fetchTracking(vehicle.vehicleNumber);
    },
    [fetchTracking]
  );

  const device = trackData && isDevice(trackData) ? trackData : null;
  const errorPayload = trackData && !isDevice(trackData) ? (trackData as LetsGroError) : null;
  const hasCoords =
    device?.latitude != null &&
    device?.longitude != null &&
    device.latitude !== "" &&
    device.longitude !== "";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:flex-row gap-4">
      {/* Left: Vehicle list */}
      <aside className="w-full md:w-80 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vehicles
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Select a vehicle to see live tracking (LetsGro)
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {vehiclesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : vehicles.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
              No vehicles found
            </p>
          ) : (
            <ul className="space-y-1">
              {vehicles.map((v) => (
                <li key={v.documentId}>
                  <button
                    type="button"
                    onClick={() => handleSelectVehicle(v)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                      selectedVehicle?.documentId === v.documentId
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    <span className="font-medium block">{v.vehicleNumber}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {v.model} · {v.currentStatus || "—"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Right: Tracking details */}
      <main className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live tracking
          </h2>
          {selectedVehicle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {selectedVehicle.vehicleNumber} · {selectedVehicle.model}
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedVehicle ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">
              Select a vehicle from the list to view its live position and status.
            </p>
          ) : trackLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
            </div>
          ) : trackError || errorPayload ? (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <p className="font-medium text-red-800 dark:text-red-200">
                {trackError || (errorPayload?.error ?? "Error")}
              </p>
              {errorPayload?.message && (
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {errorPayload.message}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Ensure the vehicle is registered in LetsGro with the same number (
                {selectedVehicle.vehicleNumber}) and subscription is active.
              </p>
            </div>
          ) : device ? (
            <div className="space-y-6">
              {/* Status card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoCard
                  label="Status"
                  value={device.status ?? "—"}
                  highlight={device.status === "online"}
                />
                <InfoCard
                  label="Ignition"
                  value={device.ignition === true || device.ignition === "true" ? "On" : "Off"}
                />
                <InfoCard label="Motion" value={device.motion ? "Moving" : "Stopped"} />
                <InfoCard
                  label="Speed"
                  value={
                    device.speed != null && device.speed !== ""
                      ? `${Number(device.speed).toFixed(1)} km/h`
                      : "—"
                  }
                />
                <InfoCard
                  label="Course"
                  value={device.course != null && device.course !== "" ? `${device.course}°` : "—"}
                />
                <InfoCard
                  label="Last update"
                  value={
                    device.lastUpdate
                      ? new Date(device.lastUpdate).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "medium",
                        })
                      : "—"
                  }
                />
              </div>

              {/* Location */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Location
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoCard label="Latitude" value={device.latitude ?? "—"} />
                  <InfoCard label="Longitude" value={device.longitude ?? "—"} />
                </div>
                {hasCoords && (
                  <a
                    href={`https://www.google.com/maps?q=${device.latitude},${device.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    View on Google Maps
                  </a>
                )}
              </div>

              {/* Distance */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Distance
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoCard
                    label="Daily distance"
                    value={
                      device.daily_distance != null
                        ? `${Number(device.daily_distance).toFixed(2)} km`
                        : "—"
                    }
                  />
                  <InfoCard
                    label="Total distance"
                    value={
                      device.totalDistance != null && device.totalDistance !== ""
                        ? `${Number(device.totalDistance).toLocaleString()} km`
                        : "—"
                    }
                  />
                </div>
              </div>

              {/* Device info */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Device
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoCard label="Device ID" value={device.deviceId ?? "—"} />
                  <InfoCard label="IMEI" value={device.deviceImei ?? "—"} />
                  <InfoCard label="Phone" value={device.phone ?? "—"} />
                  <InfoCard label="Type" value={device.type ?? "—"} />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">
              No tracking data returned for this vehicle.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function InfoCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p
        className={`mt-1 font-medium ${
          highlight
            ? "text-green-600 dark:text-green-400"
            : "text-gray-900 dark:text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
