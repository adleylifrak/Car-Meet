import { hasSupabaseConfig } from "@/lib/supabase/client";
import type { AppNotification } from "@/lib/types";
import { mockNotifications } from "@/lib/mock/data";

export async function getNotifications(profileId: string): Promise<AppNotification[]> {
  if (!hasSupabaseConfig) {
    return mockNotifications
      .filter((n) => n.profile_id === profileId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!hasSupabaseConfig) {
    const n = mockNotifications.find((n) => n.id === id);
    if (n) n.read = true;
    return;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllNotificationsRead(profileId: string): Promise<void> {
  if (!hasSupabaseConfig) {
    mockNotifications.forEach((n) => {
      if (n.profile_id === profileId) n.read = true;
    });
    return;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  await supabase.from("notifications").update({ read: true }).eq("profile_id", profileId).eq("read", false);
}

export interface NotificationPreferences {
  radiusMeters: number;
  muted: boolean;
}

const mockPreferences = new Map<string, NotificationPreferences>();
const mockMeetSubscriptions = new Set<string>();

export async function getNotificationPreferences(profileId: string): Promise<NotificationPreferences> {
  if (!hasSupabaseConfig) {
    return mockPreferences.get(profileId) ?? { radiusMeters: 32186.88, muted: false };
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("radius_meters, muted")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return {
    radiusMeters: data?.radius_meters ?? 32186.88,
    muted: data?.muted ?? false,
  };
}

export async function setNotificationPreferences(
  profileId: string,
  preferences: NotificationPreferences
): Promise<void> {
  if (!hasSupabaseConfig) {
    mockPreferences.set(profileId, preferences);
    return;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("notification_preferences").upsert({
    profile_id: profileId,
    radius_meters: Math.round(preferences.radiusMeters),
    muted: preferences.muted,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getMeetNotificationEnabled(
  profileId: string,
  meetId: string
): Promise<boolean> {
  if (!hasSupabaseConfig) return mockMeetSubscriptions.has(`${profileId}:${meetId}`);
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meet_notification_subscriptions")
    .select("meet_id")
    .eq("profile_id", profileId)
    .eq("meet_id", meetId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function setMeetNotificationEnabled(
  profileId: string,
  meetId: string,
  enabled: boolean
): Promise<void> {
  const key = `${profileId}:${meetId}`;
  if (!hasSupabaseConfig) {
    enabled ? mockMeetSubscriptions.add(key) : mockMeetSubscriptions.delete(key);
    return;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const query = supabase.from("meet_notification_subscriptions");
  const { error } = enabled
    ? await query.upsert({ profile_id: profileId, meet_id: meetId })
    : await query.delete().eq("profile_id", profileId).eq("meet_id", meetId);
  if (error) throw error;
}
