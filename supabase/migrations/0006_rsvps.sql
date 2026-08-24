create type public.rsvp_status as enum ('interested', 'going', 'spectating');

create table public.rsvps (
  id uuid primary key default extensions.gen_random_uuid(),
  meet_id uuid not null references public.meets (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  car_id uuid references public.cars (id) on delete set null,
  status public.rsvp_status not null,
  created_at timestamptz not null default now(),
  unique (meet_id, profile_id)
);

create index rsvps_meet_id_idx on public.rsvps (meet_id);
create index rsvps_profile_id_idx on public.rsvps (profile_id);

alter table public.rsvps enable row level security;

create policy "rsvps are readable by authenticated users"
  on public.rsvps for select
  to authenticated
  using (true);

create policy "users create their own rsvps"
  on public.rsvps for insert
  to authenticated
  with check (auth.uid() = profile_id);

create policy "users update their own rsvps"
  on public.rsvps for update
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "users delete their own rsvps"
  on public.rsvps for delete
  to authenticated
  using (auth.uid() = profile_id);
