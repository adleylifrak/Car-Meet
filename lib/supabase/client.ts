"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True once real Supabase credentials are configured; false = app runs on mock data. */
export const hasSupabaseConfig = Boolean(url && anonKey);

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/** Browser-side Supabase client for use in client components. */
export function createClient() {
  if (!hasSupabaseConfig) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or use the mock data layer in lib/mock."
    );
  }
  if (!browserClient) {
    browserClient = createBrowserClient(url as string, anonKey as string);
  }
  return browserClient;
}
