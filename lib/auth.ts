import "server-only";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MOCK_SELF_ID, mockProfiles } from "@/lib/mock/data";
import type { Profile } from "@/lib/types";

/** The signed-in profile for the current request, or the mock "you" profile
 * when Supabase isn't configured yet. Null means "redirect to /login". */
export async function getCurrentProfile(): Promise<Profile | null> {
  if (!hasSupabaseConfig) {
    return mockProfiles.find((p) => p.id === MOCK_SELF_ID) ?? null;
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data }, { data: location }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, bio, avatar_url, created_at, meets_attended_count")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profile_locations")
      .select("lat, lng")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  if (!data) {
    // Auth account exists but onboarding (username/avatar/bio/primary car) hasn't happened yet.
    return null;
  }

  return {
    id: data.id,
    username: data.username,
    bio: data.bio,
    avatar_url: data.avatar_url,
    email: user.email ?? null,
    phone: user.phone ?? null,
    created_at: data.created_at,
    last_location: location ? { lat: location.lat, lng: location.lng } : null,
    meets_attended_count: data.meets_attended_count,
  };
}
