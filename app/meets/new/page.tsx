"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { MeetForm } from "@/components/meets/MeetForm";
import { getCurrentProfileClient } from "@/lib/data/profiles";
import type { Profile } from "@/lib/types";

export default function NewMeetPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    getCurrentProfileClient().then((p) => {
      setProfile(p);
      if (!("geolocation" in navigator)) {
        setCenter(p?.last_location ?? { lat: 34.0522, lng: -118.2437 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCenter(p?.last_location ?? { lat: 34.0522, lng: -118.2437 }),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 300_000 }
      );
    });
  }, []);

  return (
    <div>
      <TopBar title="Host a meet" />
      <div className="p-4">
        {profile && center ? (
          <MeetForm hostId={profile.id} initialCenter={center} />
        ) : (
          <p className="text-sm text-muted">Finding your location…</p>
        )}
      </div>
    </div>
  );
}
