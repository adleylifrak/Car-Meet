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
import { getAllMeets } from "@/lib/data/meets";
import { getCurrentProfileClient } from "@/lib/data/profiles";
import { getGoingMeetIds, getMyMeetIds } from "@/lib/data/rsvps";
import { getRsvpsForMeet } from "@/lib/data/rsvps";
import { getMeetTimeStatus, type MeetWithHost, type Profile, type RsvpWithProfile } from "@/lib/types";
import { milesToMeters } from "@/lib/geo";
import { getNotificationPreferences, setNotificationPreferences } from "@/lib/data/notifications";

const PAST_WINDOW_DAYS = 30;
const DEFAULT_RADIUS_METERS = milesToMeters(20);

export default function MapScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(DEFAULT_RADIUS_METERS);
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const [filters, setFilters] = useState<Set<MeetFilter>>(new Set(["live", "upcoming"]));
  const [meets, setMeets] = useState<MeetWithHost[]>([]);
  const [myMeetIds, setMyMeetIds] = useState<Set<string>>(new Set());
  const [goingMeetIds, setGoingMeetIds] = useState<Set<string>>(new Set());
  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<RsvpWithProfile[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentProfileClient().then(async (currentProfile) => {
      setProfile(currentProfile);
      if (currentProfile) {
        const preferences = await getNotificationPreferences(currentProfile.id);
        setRadiusMeters(preferences.radiusMeters);
        setNotificationsMuted(preferences.muted);
      }
    });
  }, []);

  const { location, setManualLocation } = useLocationSnapshot(
    profile?.id,
    profile?.last_location
  );

  const refreshMeets = useCallback(async () => {
    setLoading(true);
    try {
      const [allMeets, mine, going] = await Promise.all([
        getAllMeets(),
        profile ? getMyMeetIds(profile.id) : Promise.resolve<string[]>([]),
        profile ? getGoingMeetIds(profile.id) : Promise.resolve<string[]>([]),
      ]);
      setMeets(allMeets);
      setMyMeetIds(new Set(mine));
      setGoingMeetIds(new Set(going));
    } finally {
      setLoading(false);
    }
  }, [profile]);

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
    <div className="relative isolate h-[calc(100dvh-5rem)] w-full overflow-hidden">
      {/* Keep the map in its own stacking context so Leaflet/Mapbox panes can
          never render over the fixed map controls. */}
      <div className="absolute inset-0 z-0">
        <MapView
          center={location}
          meets={visibleMeets}
          rsvpMeetIds={goingMeetIds}
          selectedMeetId={selectedMeetId}
          onSelectMeet={setSelectedMeetId}
          radiusMeters={notificationsMuted ? 0 : radiusMeters}
        />
      </div>

      {/* Fixed map header — remains above the map for this entire tab. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex flex-col gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-1 items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-muted shadow-sm"
          >
            <Search size={16} />
            {location.label ?? "Search a location"}
          </button>
          <RadiusControl
            radiusMeters={radiusMeters}
            muted={notificationsMuted}
            onApply={(nextRadius, muted) => {
              setRadiusMeters(nextRadius);
              setNotificationsMuted(muted);
              if (profile) {
                setNotificationPreferences(profile.id, { radiusMeters: nextRadius, muted });
              }
            }}
          />
        </div>
        <div className="pointer-events-auto w-fit max-w-full rounded-2xl border border-border bg-surface/95 shadow-sm backdrop-blur">
          <FilterChips active={filters} onToggle={toggleFilter} />
        </div>
        {profile && <PushOptInBanner profileId={profile.id} />}
        <Link
          href="/my-meets"
          className="pointer-events-auto self-end flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-semibold shadow-sm"
        >
          <CalendarCheck size={14} />
          My meets
        </Link>
      </div>

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
