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
