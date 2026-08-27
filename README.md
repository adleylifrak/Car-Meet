# CarMeet

Mobile-first web app for finding and organizing local car meets. Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, backed by Supabase (Postgres/PostGIS, Auth, Storage) with Mapbox GL (Leaflet/OpenStreetMap fallback) for maps and Web Push for notifications.

## Status

The app runs end-to-end today on **seeded mock data** — every page works with zero configuration. Flip it over to a real backend by filling in the Supabase env vars below; the data layer (`lib/data/*`) transparently swaps from mock to live Supabase calls the moment `NEXT_PUBLIC_SUPABASE_URL` is set.

## Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Backend:** Supabase — Postgres + PostGIS (geo radius queries), Supabase Auth (email/phone OTP), Supabase Storage (avatars/car photos/meet galleries/check-ins)
- **Maps:** Mapbox GL JS, automatically falling back to Leaflet + OpenStreetMap when no Mapbox token is set
- **Push:** Web Push (service worker + Push API) triggered from a Supabase Edge Function on new-meet insert
- **Deploy:** Vercel, auto-deploy on push to `main`

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in as much or as little as you have — see below
npm run dev
```

Open http://localhost:3000 — it redirects to `/map`. With no env vars set at all, you're browsing a seeded LA-area dataset (mock "you" is already signed in) so every v1 screen — map, RSVP, check-in/collage, profile, and notifications — is fully clickable before any backend exists.

### Env vars (`.env.local`)

| Var | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Real backend | Project Settings -> API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Real backend | Project Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function / admin ops | Keep server-only, never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox map | Blank = Leaflet/OpenStreetMap fallback, no signup needed |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Push notifications | Generate with `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | Push notifications | `mailto:you@example.com` |
| `NEXT_PUBLIC_SITE_URL` | — | Used for absolute links (push, etc.) |

## Wiring up the real backend

1. **Create a Supabase project.**
2. **Run the migrations** in `supabase/migrations/` in order (Supabase CLI: `supabase link` then `supabase db push`, or paste each file into the SQL Editor in order — they're numbered). This creates every table, RLS policy, the `nearby_meets` / `nearby_subscribers` PostGIS RPCs, and the triggers that bump `meets_attended_count` and populate in-app notifications.
3. **Create the storage buckets** — the last migration (`0013_storage_buckets.sql`) creates `avatars`, `cars`, `meet-galleries`, and `checkins` with the right RLS policies, so this happens automatically with the migration run above.
4. **Enable phone auth** (Authentication -> Providers -> Phone) if you want phone OTP login, and configure an SMS provider (Twilio, MessageBird, etc.) there. Email OTP works out of the box.
5. **Deploy the Edge Function:**
   ```bash
   supabase functions deploy notify-new-meet
   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com SUPABASE_SERVICE_ROLE_KEY=...
   ```
6. **Wire the trigger:** in the Supabase dashboard, go to Database -> Webhooks -> Create a new hook -> table `meets`, event `Insert`, type `Edge Function`, target `notify-new-meet`. Every new meet (including each auto-generated recurrence) now fires a real push to everyone within its notification radius, plus an in-app "new meet nearby" notification.
7. **(Optional) Recurring meets:** enable the `pg_cron` extension (Database -> Extensions) and run the `cron.schedule(...)` snippet at the bottom of `supabase/migrations/0012_recurrence.sql` to auto-create each recurring meet's next occurrence.
8. **Fill in the rest of `.env.local`** (Mapbox token if you want it, VAPID keys matching what you set as Edge Function secrets) and restart `npm run dev`.

## Deploying to Vercel

Connect this repo to Vercel (New Project -> import repo). Set the same env vars from `.env.local` in the Vercel project settings (Production + Preview). Every push to `main` auto-deploys.

## Project structure

```
app/                 Routes (App Router) — one folder per screen, mostly client components
components/          UI split by domain: ui/, layout/, map/, meets/, checkin/, profile/, auth/
lib/data/            Data-access layer — mock or real Supabase per function, same call sites either way
lib/mock/            Seeded in-memory dataset used when no Supabase env is set
lib/supabase/        Browser/server/admin Supabase clients + the auth-refresh proxy helper
lib/types.ts         Domain types mirroring the Postgres schema
supabase/migrations/ Numbered SQL migrations — schema, RLS, PostGIS RPCs, triggers
supabase/functions/  notify-new-meet Edge Function (push + in-app "nearby" notifications)
public/sw.js          Service worker for Web Push
```

## What's deliberately not in v1

Per spec: no swipe-based user discovery, no general social feed, no DMs/chat, no GPS verification of check-ins (the active-time-window gate is the only one), no full real-time collage sync (pull/reload only), no recurring-hotspot heatmaps, and no badges or leaderboards. Badges and rankings are deferred to v1.5; v1 keeps only the public meets-attended counter.

## Design notes worth knowing about

- **Location is a one-time snapshot, not tracking.** `useLocationSnapshot` calls `getCurrentPosition()` once per app open; there's no `watchPosition`. It's stored in a separate `profile_locations` table (not a column on `profiles`) specifically so it's never exposed on a public profile — profiles are readable by any signed-in user (for host names, RSVP lists, garages), but `profile_locations` is owner-only via RLS, and only the notify-new-meet Edge Function (service role, bypasses RLS) reads across users for the radius match.
- **Recurring meets are separate rows**, chained via `parent_meet_id`, rather than one row whose dates shift — that way each occurrence gets its own real push notification through the same insert-triggered flow as any other meet.
- **The "Going" filter chip** shows any meet you've RSVP'd to (interested/going/spectating) — matching the "My meets" tab's definition of "yours."
- **RSVP'd meets bypass browse limits.** Saved meets are merged into the radius search results, so they remain pinned with a checkmark regardless of radius, filters, or age.
