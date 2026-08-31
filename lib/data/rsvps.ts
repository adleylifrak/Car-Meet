import { hasSupabaseConfig } from "@/lib/supabase/client";
import type { RsvpStatus, RsvpWithProfile } from "@/lib/types";
import { mockCars, mockProfiles, mockRsvps } from "@/lib/mock/data";

function toRsvpWithProfile(r: (typeof mockRsvps)[number]): RsvpWithProfile {
  const profile = mockProfiles.find((p) => p.id === r.profile_id)!;
  const car = r.car_id ? mockCars.find((c) => c.id === r.car_id) ?? null : null;
  return {
    ...r,
    profile: { id: profile.id, username: profile.username, avatar_url: profile.avatar_url },
    car: car ? { id: car.id, make: car.make, model: car.model, year: car.year } : null,
  };
}

export async function getRsvpsForMeet(meetId: string): Promise<RsvpWithProfile[]> {
  if (!hasSupabaseConfig) {
    return mockRsvps.filter((r) => r.meet_id === meetId).map(toRsvpWithProfile);
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rsvps")
    .select(
      "id, meet_id, profile_id, car_id, status, created_at, profile:profiles!rsvps_profile_id_fkey(id, username, avatar_url), car:cars(id, make, model, year)"
    )
    .eq("meet_id", meetId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as RsvpWithProfile[];
}

export async function getMyRsvpForMeet(
  meetId: string,
  profileId: string
): Promise<RsvpWithProfile | null> {
  const all = await getRsvpsForMeet(meetId);
  return all.find((r) => r.profile_id === profileId) ?? null;
}

export async function upsertRsvp(params: {
  meetId: string;
  profileId: string;
  status: RsvpStatus;
  carId: string | null;
}): Promise<void> {
  if (!hasSupabaseConfig) {
    const existing = mockRsvps.find(
      (r) => r.meet_id === params.meetId && r.profile_id === params.profileId
    );
    if (existing) {
      existing.status = params.status;
      existing.car_id = params.carId;
    } else {
      mockRsvps.push({
        id: `r-${Date.now()}`,
        meet_id: params.meetId,
        profile_id: params.profileId,
        car_id: params.carId,
        status: params.status,
        created_at: new Date().toISOString(),
      });
    }
    return;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase
    .from("rsvps")
    .upsert(
      {
        meet_id: params.meetId,
        profile_id: params.profileId,
        status: params.status,
        car_id: params.carId,
      },
      { onConflict: "meet_id,profile_id" }
    );
  if (error) throw error;
}

export async function removeRsvp(meetId: string, profileId: string): Promise<void> {
  if (!hasSupabaseConfig) {
    const idx = mockRsvps.findIndex(
      (r) => r.meet_id === meetId && r.profile_id === profileId
    );
    if (idx >= 0) mockRsvps.splice(idx, 1);
    return;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase
    .from("rsvps")
    .delete()
    .eq("meet_id", meetId)
    .eq("profile_id", profileId);
  if (error) throw error;
}

/** All meet ids a profile has RSVP'd to (any status) — drives "My meets" and the "Going" filter chip. */
export async function getMyMeetIds(profileId: string): Promise<string[]> {
  if (!hasSupabaseConfig) {
    return mockRsvps.filter((r) => r.profile_id === profileId).map((r) => r.meet_id);
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rsvps")
    .select("meet_id")
    .eq("profile_id", profileId);
  if (error) throw error;
  return (data ?? []).map((r: { meet_id: string }) => r.meet_id);
}


/** Meet ids where the profile explicitly chose the Going RSVP status. */
export async function getGoingMeetIds(profileId: string): Promise<string[]> {
  if (!hasSupabaseConfig) {
    return mockRsvps
      .filter((r) => r.profile_id === profileId && r.status === "going")
      .map((r) => r.meet_id);
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rsvps")
    .select("meet_id")
    .eq("profile_id", profileId)
    .eq("status", "going");
  if (error) throw error;
  return (data ?? []).map((r: { meet_id: string }) => r.meet_id);
}
