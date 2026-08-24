import { hasSupabaseConfig } from "@/lib/supabase/client";
import type { ReportTargetType } from "@/lib/types";

export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  if (!hasSupabaseConfig) return false;
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase
    .from("blocks")
    .select("blocker_id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();
  return Boolean(data);
}

export async function submitReport(params: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}): Promise<void> {
  if (!hasSupabaseConfig) {
    console.log("[mock] report submitted", params);
    return;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: params.reporterId,
    target_type: params.targetType,
    target_id: params.targetId,
    reason: params.reason,
  });
  if (error) throw error;
}

export async function blockProfile(blockerId: string, blockedId: string): Promise<void> {
  if (!hasSupabaseConfig) {
    console.log("[mock] block", blockerId, "->", blockedId);
    return;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase
    .from("blocks")
    .upsert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) throw error;
}

export async function unblockProfile(blockerId: string, blockedId: string): Promise<void> {
  if (!hasSupabaseConfig) return;
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
}
