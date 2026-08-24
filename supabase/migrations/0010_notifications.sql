-- In-app notification list (feature 6). Not in the original table list the
-- spec called out explicitly, but the feature ("new follower, new RSVP on a
-- meet you host, new meet within your radius") needs somewhere to live —
-- this is that table. Populated by triggers in the functions migration.
create type public.notification_type as enum ('new_follower', 'new_rsvp', 'new_meet_nearby');

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  actor_id uuid references public.profiles (id) on delete set null,
  meet_id uuid references public.meets (id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_profile_id_idx on public.notifications (profile_id, created_at desc);

alter table public.notifications enable row level security;

create policy "users see their own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = profile_id);

create policy "users update their own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- No insert policy for regular users — notifications are only ever written
-- by triggers (SECURITY DEFINER) or the service_role key (the
-- new-meet-nearby push flow, from the Edge Function).
