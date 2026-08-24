create type public.badge_type as enum ('5', '10', '25', '50', '100');

create table public.badges (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  badge_type public.badge_type not null,
  earned_at timestamptz not null default now(),
  primary key (profile_id, badge_type)
);

alter table public.badges enable row level security;

create policy "badges are readable by authenticated users"
  on public.badges for select
  to authenticated
  using (true);

-- No insert/update/delete policies for regular users — badges are only ever
-- written by the award_badges() trigger (SECURITY DEFINER), which runs when
-- a check-in pushes meets_attended_count across a milestone.
