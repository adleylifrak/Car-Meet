"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, CalendarCheck } from "lucide-react";
import { MapView } from "@/components/map/MapView";
import { RadiusControl } from "@/components/map/RadiusControl";
import { FilterChips, type MeetFilter } from "@/components/map/FilterChips";
import { LocationSearch } from "@/components/map/LocationSearch";
import { PushOptInBanner } from "@/components/map/PushOptInBanner";
import { MeetPreviewCard } from "@/components/map/MeetPreviewCard";
import { useLocationSnapshot } from "@/components/map/useLocationSnapshot";
import { getMeetsByIds, getNearbyMeets } from "@/lib/data/meets";
import { getCurrentProfileClient } from "@/lib/data/profiles";
import { getMyMeetIds } from "@/lib/data/rsvps";
import { getRsvpsForMeet } from "@/lib/data/rsvps";
import { getMeetTimeStatus, type MeetWithHost, type Profile, type RsvpWithProfile } from "@/lib/types";
import { milesToMeters } from "@/lib/geo";

const PAST_WINDOW_DAYS = 30;
const DEFAULT_RADIUS_METERS = milesToMeters(20);

export default function MapScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(DEFAULT_RADIUS_METERS);
  const [filters, setFilters] = useState<Set<MeetFilter>>(new Set(["live", "upcoming"]));
  const [meets, setMeets] = useState<MeetWithHost[]>([]);
  const [myMeetIds, setMyMeetIds] = useState<Set<string>>(new Set());
  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<RsvpWithProfile[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentProfileClient().then(setProfile);
  }, []);

  const { location, setManualLocation } = useLocationSnapshot(
    profile?.id,
    profile?.last_location
  );

  const refreshMeets = useCallback(async () => {
    setLoading(true);
    try {
      const [nearby, mine] = await Promise.all([
        getNearbyMeets({ lat: location.lat, lng: location.lng, radiusMeters }),
        profile ? getMyMeetIds(profile.id) : Promise.resolve<string[]>([]),
      ]);
      const savedMeets = await getMeetsByIds(mine);
      const merged = new Map(nearby.map((meet) => [meet.id, meet]));
      savedMeets.forEach((meet) => merged.set(meet.id, meet));

      setMeets(Array.from(merged.values()));
      setMyMeetIds(new Set(mine));
    } finally {
      setLoading(false);
    }
  }, [location.lat, location.lng, radiusMeters, profile]);

  useEffect(() => {
    // Deferred via queueMicrotask so the data fetch's state updates land
    // after this commit instead of synchronously inside it.
    queueMicrotask(() => {
      refreshMeets();
    });
  }, [refreshMeets]);

  useEffect(() => {
    queueMicrotask(() => {
      if (!selectedMeetId) {
        setSelectedAttendees([]);
        return;
      }
      getRsvpsForMeet(selectedMeetId).then(setSelectedAttendees);
    });
  }, [selectedMeetId]);

  function toggleFilter(key: MeetFilter) {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const visibleMeets = useMemo(() => {
    const now = new Date();
    return meets.filter((meet) => {
      const status = getMeetTimeStatus(meet, now);
      const isMine = myMeetIds.has(meet.id);
      const ageDays = (now.getTime() - new Date(meet.end_time).getTime()) / 86_400_000;

      // RSVP'd meets always stay on the map, even when they're outside the
      // current browse radius, past-window cutoff, or active filter chips.
      if (isMine) {
        return true;
      }

      if (status === "past" && ageDays > PAST_WINDOW_DAYS) return false;
      if (filters.has("going") && !isMine) return false;
      if (!filters.has("going") && !filters.has(status)) return false;
      return true;
    });
  }, [meets, filters, myMeetIds]);

  const selectedMeet = meets.find((m) => m.id === selectedMeetId) ?? null;

  return (
    <div className="relative h-[calc(100dvh-5rem)] w-full overflow-hidden">
      <MapView
        center={location}
        meets={visibleMeets}
        rsvpMeetIds={myMeetIds}
        selectedMeetId={selectedMeetId}
        onSelectMeet={setSelectedMeetId}
        radiusMeters={radiusMeters}
      />

      {/* Top controls */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-1 items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-muted shadow-sm"
          >
            <Search size={16} />
            {location.label ?? "Search a location"}
          </button>
          <RadiusControl radiusMeters={radiusMeters} onChange={setRadiusMeters} />
        </div>
        <div className="pointer-events-auto rounded-2xl border border-border bg-surface/95 shadow-sm backdrop-blur">
          <FilterChips active={filters} onToggle={toggleFilter} />
        </div>
        {profile && <PushOptInBanner profileId={profile.id} />}
      </div>

      {/* My meets shortcut */}
      <Link
        href="/my-meets"
        className="pointer-events-auto absolute right-3 z-20 flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-semibold shadow-sm"
        style={{ top: "7.5rem" }}
      >
        <CalendarCheck size={14} />
        My meets
      </Link>

      {loading && meets.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="rounded-full bg-surface px-4 py-2 text-sm text-muted shadow">Loading meets…</div>
        </div>
      )}

      {selectedMeet && (
        <MeetPreviewCard
          meet={selectedMeet}
          attendees={selectedAttendees}
          userLocation={location}
          onClose={() => setSelectedMeetId(null)}
        />
      )}

      <LocationSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(loc) => setManualLocation(loc)}
      />
    </div>
  );
}
