"use client";

import { hasSupabaseConfig } from "@/lib/supabase/client";

export type StorageBucket = "avatars" | "cars" | "meet-galleries" | "checkins";

/** Uploads a file to Supabase Storage and returns its public URL. In mock
 * mode (no Supabase configured) it just returns a local blob: URL so image
 * pickers/previews still work end-to-end during UI development. */
export async function uploadImage(file: File, bucket: StorageBucket, pathPrefix: string): Promise<string> {
  if (!hasSupabaseConfig) {
    return URL.createObjectURL(file);
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
