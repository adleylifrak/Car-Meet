-- Web Push subscriptions (one browser/device registration per row). Not in
-- the original table list either, but "send a real push, not just an
-- in-app notification" needs somewhere to keep each subscriber's endpoint.
create table public.push_subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_profile_id_idx on public.push_subscriptions (profile_id);

alter table public.push_subscriptions enable row level security;

create policy "users manage their own push subscriptions"
  on public.push_subscriptions for all
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Used by the notify-new-meet Edge Function (service_role, bypasses RLS) to
-- find who to push to. Excludes the host so they don't get pinged about
-- their own post.
create function public.nearby_subscribers(
  center_lat double precision,
  center_lng double precision,
  radius_m double precision,
  exclude_profile_id uuid
)
returns table (
  profile_id uuid,
  endpoint text,
  p256dh text,
  auth text
)
language sql
security definer
set search_path = public
stable
as $$
  select ps.profile_id, ps.endpoint, ps.p256dh, ps.auth
  from public.profile_locations pl
  join public.push_subscriptions ps on ps.profile_id = pl.profile_id
  where pl.profile_id <> exclude_profile_id
    and extensions.st_dwithin(
      pl.location,
      extensions.st_setsrid(extensions.st_makepoint(center_lng, center_lat), 4326)::extensions.geography,
      radius_m
    );
$$;

-- Same match, but every nearby profile (not just ones with a push
-- subscription) — used to also write the in-app "new meet nearby" list.
create function public.nearby_profile_ids(
  center_lat double precision,
  center_lng double precision,
  radius_m double precision,
  exclude_profile_id uuid
)
returns table (profile_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select pl.profile_id
  from public.profile_locations pl
  where pl.profile_id <> exclude_profile_id
    and extensions.st_dwithin(
      pl.location,
      extensions.st_setsrid(extensions.st_makepoint(center_lng, center_lat), 4326)::extensions.geography,
      radius_m
    );
$$;
