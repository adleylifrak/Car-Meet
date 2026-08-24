create table public.checkins (
  id uuid primary key default extensions.gen_random_uuid(),
  meet_id uuid not null references public.meets (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  photo_url text not null,
  submitted_at timestamptz not null default now(),
  unique (meet_id, profile_id)
);

create index checkins_meet_id_idx on public.checkins (meet_id);
create index checkins_profile_id_idx on public.checkins (profile_id);

alter table public.checkins enable row level security;

create policy "checkins are readable by authenticated users"
  on public.checkins for select
  to authenticated
  using (true);

-- The active-window gate (submitted_at must fall within the meet's
-- start/end) and the meets_attended_count / badge side effects are enforced
-- in a BEFORE INSERT trigger — see enforce_checkin_window() in the
-- functions migration, since a CHECK constraint can't reference another
-- table.
create policy "users create their own checkins"
  on public.checkins for insert
  to authenticated
  with check (auth.uid() = profile_id);

-- Hosts can remove any photo from their own meet's collage; a check-in's
-- owner can also remove their own.
create policy "hosts and owners remove checkins"
  on public.checkins for delete
  to authenticated
  using (
    auth.uid() = profile_id
    or auth.uid() in (select host_id from public.meets where id = meet_id)
  );
