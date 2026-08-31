-- Per-user notification distance and per-meet notification subscriptions.
create table public.notification_preferences (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  radius_meters integer not null default 32187 check (radius_meters between 1609 and 160934),
  muted boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "users read own notification preferences"
  on public.notification_preferences for select to authenticated
  using (profile_id = auth.uid());

create policy "users insert own notification preferences"
  on public.notification_preferences for insert to authenticated
  with check (profile_id = auth.uid());

create policy "users update own notification preferences"
  on public.notification_preferences for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create table public.meet_notification_subscriptions (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  meet_id uuid not null references public.meets (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, meet_id)
);

alter table public.meet_notification_subscriptions enable row level security;

create policy "users read own meet notification subscriptions"
  on public.meet_notification_subscriptions for select to authenticated
  using (profile_id = auth.uid());

create policy "users add own meet notification subscriptions"
  on public.meet_notification_subscriptions for insert to authenticated
  with check (profile_id = auth.uid());

create policy "users remove own meet notification subscriptions"
  on public.meet_notification_subscriptions for delete to authenticated
  using (profile_id = auth.uid());

-- Each recipient owns their notification distance. Muted users are excluded.
-- Profiles without a saved preference retain the 20-mile default.
create or replace function public.profiles_to_notify_for_meet(
  center_lat double precision,
  center_lng double precision,
  exclude_profile_id uuid
)
returns table (profile_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select pl.profile_id
  from public.profile_locations pl
  left join public.notification_preferences np on np.profile_id = pl.profile_id
  where pl.profile_id <> exclude_profile_id
    and not coalesce(np.muted, false)
    and st_dwithin(
      pl.location,
      st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography,
      coalesce(np.radius_meters, 32187)
    );
$$;

create or replace function public.subscribers_to_notify_for_meet(
  center_lat double precision,
  center_lng double precision,
  exclude_profile_id uuid
)
returns table (endpoint text, p256dh text, auth text, profile_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select ps.endpoint, ps.p256dh, ps.auth, ps.profile_id
  from public.push_subscriptions ps
  join public.profile_locations pl on pl.profile_id = ps.profile_id
  left join public.notification_preferences np on np.profile_id = ps.profile_id
  where ps.profile_id <> exclude_profile_id
    and not coalesce(np.muted, false)
    and st_dwithin(
      pl.location,
      st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography,
      coalesce(np.radius_meters, 32187)
    );
$$;
