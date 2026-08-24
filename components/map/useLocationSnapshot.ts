"use client";

import { useCallback, useEffect, useState } from "react";
import { updateLastLocation } from "@/lib/data/profiles";

export interface LocationState {
  lat: number;
  lng: number;
  label?: string;
  source: "gps" | "profile" | "search" | "default";
}

const DEFAULT_CENTER: LocationState = {
  lat: 34.0522,
  lng: -118.2437,
  label: "Los Angeles, CA",
  source: "default",
};

/** One-time location snapshot for the map home screen — deliberately NOT
 * continuous background tracking. Takes a single getCurrentPosition() read
 * on mount, falls back to the profile's last known location, then a sane
 * default, and lets the user override via manual search. */
export function useLocationSnapshot(
  profileId: string | undefined,
  fallback?: { lat: number; lng: number } | null
) {
  const [location, setLocation] = useState<LocationState>(
    fallback ? { ...fallback, source: "profile" } : DEFAULT_CENTER
  );
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: LocationState = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "gps",
        };
        setLocation(next);
        if (profileId) updateLastLocation(profileId, next).catch(() => {});
      },
      () => setPermissionDenied(true),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60_000 }
    );
    // Intentionally runs once per mount — this is a snapshot, not a watch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setManualLocation = useCallback(
    (loc: { lat: number; lng: number; label: string }) => {
      setLocation({ ...loc, source: "search" });
    },
    []
  );

  return { location, permissionDenied, setManualLocation };
}
