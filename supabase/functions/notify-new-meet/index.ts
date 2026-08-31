// Supabase Edge Function: notify-new-meet
//
// Wire-up (one-time, in the Supabase dashboard — Database -> Webhooks):
//   Create a new webhook -> table "meets" -> event "Insert" -> type "Edge
//   Function" -> function "notify-new-meet". That POSTs the new row here on
//   every meet insert, including each auto-created recurrence (see
//   supabase/migrations/0012_recurrence.sql), so recurring meets get a fresh
//   push every time without any extra wiring.
//
// Required function secrets (Project Settings -> Edge Functions -> Secrets,
// or `supabase secrets set`):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (SUPABASE_URL is provided
//     automatically; SERVICE_ROLE_KEY you set yourself)
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
//     (generate with `npx web-push generate-vapid-keys`; VAPID_PUBLIC_KEY
//     must match NEXT_PUBLIC_VAPID_PUBLIC_KEY in the app's env)

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

interface MeetRow {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  lat: number;
  lng: number;
  notification_radius_meters: number;
  start_time: string;
}

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: MeetRow;
}

Deno.serve(async (req) => {
  try {
    const payload = (await req.json()) as WebhookPayload;
    const meet = payload.record;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Each recipient chooses their own notification distance. Muted profiles
    // are excluded by the database function.
    const { data: nearbyProfiles, error: nearbyErr } = await supabase.rpc(
      "profiles_to_notify_for_meet",
      {
        center_lat: meet.lat,
        center_lng: meet.lng,
        exclude_profile_id: meet.host_id,
      }
    );
    if (nearbyErr) throw nearbyErr;

    if (nearbyProfiles && nearbyProfiles.length > 0) {
      await supabase.from("notifications").insert(
        nearbyProfiles.map((p: { profile_id: string }) => ({
          profile_id: p.profile_id,
          type: "new_meet_nearby",
          actor_id: meet.host_id,
          meet_id: meet.id,
        }))
      );
    }

    // Apply the same recipient-owned distance and mute preference to push.
    const { data: subscribers, error: subErr } = await supabase.rpc(
      "subscribers_to_notify_for_meet",
      {
        center_lat: meet.lat,
        center_lng: meet.lng,
        exclude_profile_id: meet.host_id,
      }
    );
    if (subErr) throw subErr;

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const notificationBody = JSON.stringify({
      title: `New meet: ${meet.title}`,
      body: meet.description?.slice(0, 120) ?? "Tap to see who's going.",
      url: `/meets/${meet.id}`,
    });

    const results = await Promise.allSettled(
      (subscribers ?? []).map(
        (sub: { endpoint: string; p256dh: string; auth: string; profile_id: string }) =>
          webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            notificationBody
          )
      )
    );

    // A 410/404 from the push service means the subscription is dead —
    // clean those up so we stop trying.
    const deadEndpoints = (subscribers ?? [])
      .filter((_: unknown, i: number) => {
        const r = results[i];
        return (
          r.status === "rejected" &&
          [404, 410].includes((r.reason as { statusCode?: number })?.statusCode ?? 0)
        );
      })
      .map((s: { endpoint: string }) => s.endpoint);

    if (deadEndpoints.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", deadEndpoints);
    }

    return new Response(
      JSON.stringify({
        notified_in_app: nearbyProfiles?.length ?? 0,
        pushed: subscribers?.length ?? 0,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("notify-new-meet failed", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
