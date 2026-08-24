"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { MeetForm } from "@/components/meets/MeetForm";
import { getCurrentProfileClient } from "@/lib/data/profiles";
import type { Profile } from "@/lib/types";

export default function NewMeetPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [center, setCenter] = useState({ lat: 34.0522, lng: -118.2437 });

  useEffect(() => {
    getCurrentProfileClient().then((p) => {
      setProfile(p);
      if (p?.last_location) setCenter(p.last_location);
    });
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 6000 }
      );
    }
  }, []);

  return (
    <div>
      <TopBar title="Host a meet" />
      <div className="p-4">
        {profile ? (
          <MeetForm hostId={profile.id} initialCenter={center} />
        ) : (
          <p className="text-sm text-muted">Loading…</p>
        )}
      </div>
    </div>
  );
}
