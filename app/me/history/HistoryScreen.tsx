"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { MapView } from "@/components/map/MapView";
import { MeetPreviewCard } from "@/components/map/MeetPreviewCard";
import { getCurrentProfileClient } from "@/lib/data/profiles";
import { getFullCheckinHistory } from "@/lib/data/checkins";
import { getMeetById } from "@/lib/data/meets";
import { getRsvpsForMeet } from "@/lib/data/rsvps";
import { milesToMeters } from "@/lib/geo";
import type { MeetWithHost, Profile, RsvpWithProfile } from "@/lib/types";

/** Private, unrestricted history — every meet the owner has ever checked
 * into, no radius or time-window limit (unlike the public map). */
export default function HistoryScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meets, setMeets] = useState<MeetWithHost[]>([]);
  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<RsvpWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await getCurrentProfileClient();
      setProfile(p);
      if (!p) return setLoading(false);
      const history = await getFullCheckinHistory(p.id);
      const uniqueMeetIds = Array.from(new Set(history.map((c) => c.meet_id)));
      const found = await Promise.all(uniqueMeetIds.map((id) => getMeetById(id)));
      setMeets(found.filter((m): m is MeetWithHost => Boolean(m)));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      if (!selectedMeetId) {
        setSelectedAttendees([]);
        return;
      }
      getRsvpsForMeet(selectedMeetId).then(setSelectedAttendees);
    });
  }, [selectedMeetId]);

  const center =
    meets.length > 0
      ? {
          lat: meets.reduce((s, m) => s + m.location.lat, 0) / meets.length,
          lng: meets.reduce((s, m) => s + m.location.lng, 0) / meets.length,
        }
      : { lat: 34.0522, lng: -118.2437 };

  const selected = meets.find((m) => m.id === selectedMeetId) ?? null;

  return (
    <div>
      <TopBar title="Your meet history" />
      {loading ? (
        <p className="p-4 text-sm text-muted">Loading…</p>
      ) : meets.length === 0 ? (
        <p className="p-4 text-sm text-muted">
          Check in at a meet and it&apos;ll show up here — your full history, with no radius
          or time limit, visible only to you.
        </p>
      ) : (
        <div className="relative h-[calc(100dvh-8.5rem)] w-full">
          <MapView
            center={center}
            meets={meets}
            rsvpMeetIds={new Set(meets.map((m) => m.id))}
            selectedMeetId={selectedMeetId}
            onSelectMeet={setSelectedMeetId}
            radiusMeters={milesToMeters(200)}
          />
          {selected && profile && (
            <MeetPreviewCard
              meet={selected}
              attendees={selectedAttendees}
              userLocation={center}
              onClose={() => setSelectedMeetId(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
