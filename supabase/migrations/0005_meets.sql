create type public.meet_recurrence as enum ('weekly', 'monthly');

create table public.meets (
  id uuid primary key default extensions.gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  location extensions.geography(Point, 4326) not null,
  lat double precision generated always as (extensions.st_y(location::extensions.geometry)) stored,
  lng double precision generated always as (extensions.st_x(location::extensions.geometry)) stored,
  notification_radius_meters integer not null default 16000
    check (notification_radius_meters > 0 and notification_radius_meters <= 200000),
  start_time timestamptz not null,
  end_time timestamptz not null,
  gallery_urls text[] not null default '{}',
  recurrence public.meet_recurrence,
  -- Set on the auto-generated next occurrence of a recurring meet; null on
  -- the original post. See create_next_recurrences() in the functions
  -- migration for how these get created.
  parent_meet_id uuid references public.meets (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint end_after_start check (end_time > start_time)
);

create index meets_geo_idx on public.meets using gist (location);
create index meets_host_id_idx on public.meets (host_id);
create index meets_start_time_idx on public.meets (start_time);

alter table public.meets enable row level security;

create policy "meets are readable by authenticated users"
  on public.meets for select
  to authenticated
  using (true);

create policy "hosts create their own meets"
  on public.meets for insert
  to authenticated
  with check (auth.uid() = host_id);

create policy "hosts update their own meets"
  on public.meets for update
  to authenticated
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "hosts delete their own meets"
  on public.meets for delete
  to authenticated
  using (auth.uid() = host_id);

-- Radius search used by the map home screen (lib/data/meets.ts ->
-- getNearbyMeets). SECURITY INVOKER so it still respects the caller's RLS.
create function public.nearby_meets(center_lat double precision, center_lng double precision, radius_m double precision)
returns table (
  id uuid,
  host_id uuid,
  title text,
  description text,
  lat double precision,
  lng double precision,
  notification_radius_meters integer,
  start_time timestamptz,
  end_time timestamptz,
  gallery_urls text[],
  recurrence public.meet_recurrence,
  parent_meet_id uuid,
  created_at timestamptz,
  host_username text,
  host_avatar_url text
)
language sql
security invoker
stable
as $$
  select
    m.id, m.host_id, m.title, m.description, m.lat, m.lng,
    m.notification_radius_meters, m.start_time, m.end_time,
    m.gallery_urls, m.recurrence, m.parent_meet_id, m.created_at,
    p.username as host_username, p.avatar_url as host_avatar_url
  from public.meets m
  join public.profiles p on p.id = m.host_id
  where extensions.st_dwithin(
    m.location,
    extensions.st_setsrid(extensions.st_makepoint(center_lng, center_lat), 4326)::extensions.geography,
    radius_m
  )
  order by m.start_time asc;
$$;

grant execute on function public.nearby_meets(double precision, double precision, double precision) to authenticated;
