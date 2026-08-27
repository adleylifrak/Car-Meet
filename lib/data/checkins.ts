import { hasSupabaseConfig } from "@/lib/supabase/client";
import type { CheckinWithProfile } from "@/lib/types";
import { mockCheckins, mockProfiles } from "@/lib/mock/data";

function toCheckinWithProfile(c: (typeof mockCheckins)[number]): CheckinWithProfile {
  const profile = mockProfiles.find((p) => p.id === c.profile_id)!;
  return {
    ...c,
    profile: { id: profile.id, username: profile.username, avatar_url: profile.avatar_url },
  };
}

export async function getCollageForMeet(meetId: string): Promise<CheckinWithProfile[]> {
  if (!hasSupabaseConfig) {
    return mockCheckins
      .filter((c) => c.meet_id === meetId)
      .map(toCheckinWithProfile)
      .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("checkins")
    .select(
      "id, meet_id, profile_id, photo_url, submitted_at, profile:profiles!checkins_profile_id_fkey(id, username, avatar_url)"
    )
    .eq("meet_id", meetId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CheckinWithProfile[];
}

/** Submits a check-in photo. The DB trigger enforces the active-window gate and
 * increments the profile's meets_attended_count — this call just does the insert. */
export async function submitCheckin(params: {
  meetId: string;
  profileId: string;
  photoUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasSupabaseConfig) {
    mockCheckins.unshift({
      id: `ch-${Date.now()}`,
      meet_id: params.meetId,
      profile_id: params.profileId,
      photo_url: params.photoUrl,
      submitted_at: new Date().toISOString(),
    });
    const profile = mockProfiles.find((p) => p.id === params.profileId);
    if (profile) {
      profile.meets_attended_count += 1;
    }
    return { ok: true };
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("checkins").insert({
    meet_id: params.meetId,
    profile_id: params.profileId,
    photo_url: params.photoUrl,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function removeCheckin(checkinId: string): Promise<void> {
  if (!hasSupabaseConfig) {
    const idx = mockCheckins.findIndex((c) => c.id === checkinId);
    if (idx >= 0) {
      const [removed] = mockCheckins.splice(idx, 1);
      const profile = mockProfiles.find((p) => p.id === removed.profile_id);
      if (profile) profile.meets_attended_count = Math.max(0, profile.meets_attended_count - 1);
    }
    return;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("checkins").delete().eq("id", checkinId);
  if (error) throw error;
}

/** Private, unrestricted history — every meet a profile has ever checked into. */
export async function getFullCheckinHistory(profileId: string): Promise<CheckinWithProfile[]> {
  if (!hasSupabaseConfig) {
    return mockCheckins.filter((c) => c.profile_id === profileId).map(toCheckinWithProfile);
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("checkins")
    .select(
      "id, meet_id, profile_id, photo_url, submitted_at, profile:profiles!checkins_profile_id_fkey(id, username, avatar_url)"
    )
    .eq("profile_id", profileId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CheckinWithProfile[];
}
