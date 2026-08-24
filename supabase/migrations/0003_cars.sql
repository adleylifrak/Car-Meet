create table public.cars (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  make text not null,
  model text not null,
  year integer,
  photo_url text,
  notes text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index cars_profile_id_idx on public.cars (profile_id);

alter table public.cars enable row level security;

create policy "cars are readable by authenticated users"
  on public.cars for select
  to authenticated
  using (true);

create policy "owners manage their own cars"
  on public.cars for insert
  to authenticated
  with check (auth.uid() = profile_id);

create policy "owners update their own cars"
  on public.cars for update
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "owners delete their own cars"
  on public.cars for delete
  to authenticated
  using (auth.uid() = profile_id);
