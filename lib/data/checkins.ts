import { hasSupabaseConfig } from "@/lib/supabase/client";
import type { BadgeType, CheckinWithProfile } from "@/lib/types";
import { mockBadges, mockCheckins, mockProfiles } from "@/lib/mock/data";

const MILESTONES: BadgeType[] = ["5", "10", "25", "50", "100"];

/** Mirrors the "award badges when meets_attended_count crosses a milestone"
 * Postgres trigger (see supabase/migrations) for the mock data path. */
function awardBadgesIfCrossed(profileId: string, count: number) {
  for (const m of MILESTONES) {
    if (count >= Number(m) && !mockBadges.some((b) => b.profile_id === profileId && b.badge_type === m)) {
      mockBadges.push({ profile_id: profileId, badge_type: m, earned_at: new Date().toISOString() });
    }
  }
}

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
      awardBadgesIfCrossed(profile.id, profile.meets_attended_count);
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
    if (idx >= 0) mockCheckins.splice(idx, 1);
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
