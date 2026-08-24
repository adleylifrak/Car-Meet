-- Public profile. Deliberately does NOT include location — see
-- profile_locations below for why that lives in its own, owner-only table.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  bio text,
  avatar_url text,
  meets_attended_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint username_format check (username ~ '^[a-zA-Z0-9._]{3,30}$');

alter table public.profiles enable row level security;

-- Anyone signed in can read basic public profile info (host names, RSVP
-- lists, garages, badges, etc. all join through this).
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- One-time location snapshot (NOT continuous tracking). Split into its own
-- table, rather than a column on profiles, specifically so it can be
-- owner-only: profiles.select is open to every authenticated user (for
-- hosts/attendees/garages to render), but a person's location must never be
-- exposed on their public profile. The push-notification Edge Function reads
-- this table with the service_role key, which bypasses RLS entirely.
create table public.profile_locations (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  location extensions.geography(Point, 4326) not null,
  lat double precision generated always as (extensions.st_y(location::extensions.geometry)) stored,
  lng double precision generated always as (extensions.st_x(location::extensions.geometry)) stored,
  updated_at timestamptz not null default now()
);

create index profile_locations_geo_idx on public.profile_locations using gist (location);

alter table public.profile_locations enable row level security;

create policy "users manage their own location"
  on public.profile_locations for all
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
