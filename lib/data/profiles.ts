import { hasSupabaseConfig } from "@/lib/supabase/client";
import type { Car, Profile } from "@/lib/types";
import {
  mockCars,
  mockFollows,
  mockProfiles,
} from "@/lib/mock/data";

/** Client-side equivalent of lib/auth.ts's getCurrentProfile(), for use inside
 * client components (map screen, RSVP actions, etc.) where the server-only
 * cookie-bound client isn't available. */
export async function getCurrentProfileClient(): Promise<Profile | null> {
  if (!hasSupabaseConfig) {
    return mockProfiles.find((p) => p.id === "p-you") ?? null;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [profile, location] = await Promise.all([
    getProfileById(user.id),
    supabase
      .from("profile_locations")
      .select("lat, lng")
      .eq("profile_id", user.id)
      .maybeSingle()
      .then((res: { data: { lat: number; lng: number } | null }) => res.data),
  ]);
  if (!profile) return null;
  return {
    ...profile,
    last_location: location ? { lat: location.lat, lng: location.lng } : null,
  };
}

// NOTE: last_location deliberately does NOT live on `profiles` — it's in the
// separate, owner-only `profile_locations` table (see supabase/migrations)
// so it can never leak through a public profile fetch or a joined select
// (RSVP lists, host info, etc.). Only getCurrentProfile[Client]() below,
// which the caller already owns, pulls it in.

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (!hasSupabaseConfig) {
    const p = mockProfiles.find((p) => p.username === username) ?? null;
    return p ? { ...p, last_location: null } : null;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, bio, avatar_url, created_at, meets_attended_count")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    username: data.username,
    bio: data.bio,
    avatar_url: data.avatar_url,
    email: null,
    phone: null,
    created_at: data.created_at,
    last_location: null,
    meets_attended_count: data.meets_attended_count,
  };
}

export async function getProfileById(id: string): Promise<Profile | null> {
  if (!hasSupabaseConfig) {
    const p = mockProfiles.find((p) => p.id === id) ?? null;
    return p ? { ...p, last_location: null } : null;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, bio, avatar_url, created_at, meets_attended_count")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    username: data.username,
    bio: data.bio,
    avatar_url: data.avatar_url,
    email: null,
    phone: null,
    created_at: data.created_at,
    last_location: null,
    meets_attended_count: data.meets_attended_count,
  };
}

export async function getGarage(profileId: string): Promise<Car[]> {
  if (!hasSupabaseConfig) {
    return mockCars.filter((c) => c.profile_id === profileId);
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("profile_id", profileId)
    .order("is_primary", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getFollowCounts(
  profileId: string
): Promise<{ followers: number; following: number }> {
  if (!hasSupabaseConfig) {
    return {
      followers: mockFollows.filter((f) => f.following_id === profileId).length,
      following: mockFollows.filter((f) => f.follower_id === profileId).length,
    };
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profileId),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profileId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  if (!hasSupabaseConfig) {
    return mockFollows.some(
      (f) => f.follower_id === followerId && f.following_id === followingId
    );
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return Boolean(data);
}

export interface OnboardingInput {
  userId: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  primaryCar: { make: string; model: string; year: number | null; photoUrl: string | null } | null;
}

/** Creates the profile row right after auth (username/avatar/bio) and, if
 * provided, the user's primary car — the onboarding step. */
export async function completeOnboarding(input: OnboardingInput): Promise<void> {
  if (!hasSupabaseConfig) {
    const existing = mockProfiles.find((p) => p.id === input.userId);
    if (existing) {
      existing.username = input.username;
      existing.bio = input.bio;
      existing.avatar_url = input.avatarUrl;
    } else {
      mockProfiles.push({
        id: input.userId,
        username: input.username,
        bio: input.bio,
        avatar_url: input.avatarUrl,
        email: null,
        phone: null,
        created_at: new Date().toISOString(),
        last_location: null,
        meets_attended_count: 0,
      });
    }
    if (input.primaryCar) {
      const { createCar } = await import("@/lib/data/cars");
      await createCar({
        profileId: input.userId,
        make: input.primaryCar.make,
        model: input.primaryCar.model,
        year: input.primaryCar.year,
        photoUrl: input.primaryCar.photoUrl,
        notes: null,
        isPrimary: true,
      });
    }
    return;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("profiles").upsert({
    id: input.userId,
    username: input.username,
    bio: input.bio,
    avatar_url: input.avatarUrl,
  });
  if (error) throw error;

  if (input.primaryCar) {
    const { createCar } = await import("@/lib/data/cars");
    await createCar({
      profileId: input.userId,
      make: input.primaryCar.make,
      model: input.primaryCar.model,
      year: input.primaryCar.year,
      photoUrl: input.primaryCar.photoUrl,
      notes: null,
      isPrimary: true,
    });
  }
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  if (!hasSupabaseConfig) {
    return mockProfiles.some((p) => p.username.toLowerCase() === username.toLowerCase());
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  return Boolean(data);
}

/** Records the one-time location snapshot on the profile (used for the
 * notification radius match, not for live tracking — called once per app open). */
export async function updateLastLocation(
  profileId: string,
  loc: { lat: number; lng: number }
): Promise<void> {
  if (!hasSupabaseConfig) {
    const profile = mockProfiles.find((p) => p.id === profileId);
    if (profile) profile.last_location = loc;
    return;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  await supabase.from("profile_locations").upsert({
    profile_id: profileId,
    location: `SRID=4326;POINT(${loc.lng} ${loc.lat})`,
    updated_at: new Date().toISOString(),
  });
}

export async function setFollowing(
  followerId: string,
  followingId: string,
  follow: boolean
): Promise<void> {
  if (!hasSupabaseConfig) {
    const idx = mockFollows.findIndex(
      (f) => f.follower_id === followerId && f.following_id === followingId
    );
    if (follow && idx < 0) mockFollows.push({ follower_id: followerId, following_id: followingId });
    if (!follow && idx >= 0) mockFollows.splice(idx, 1);
    return;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  if (follow) {
    const { error } = await supabase
      .from("follows")
      .upsert({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    if (error) throw error;
  }
}
