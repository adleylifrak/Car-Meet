"use client";

import { hasSupabaseConfig } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
  );
}

export async function getPushPermissionState(): Promise<NotificationPermission | "unsupported"> {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

/** Registers the service worker, requests permission, subscribes to Web
 * Push, and saves the subscription server-side so the notify-new-meet Edge
 * Function can find it. */
export async function enablePushNotifications(profileId: string): Promise<boolean> {
  if (!pushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.register("/sw.js");
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

  if (!hasSupabaseConfig) {
    console.log("[mock] push subscription saved", json.endpoint);
    return true;
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      profile_id: profileId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  return !error;
}
