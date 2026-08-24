create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

alter table public.follows enable row level security;

create policy "follows are readable by authenticated users"
  on public.follows for select
  to authenticated
  using (true);

create policy "users create their own follows"
  on public.follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

create policy "users remove their own follows"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

-- Blocks are private to the blocker — never exposed to the blocked user or
-- anyone else (peer-to-peer visibility of a block would defeat its purpose).
create policy "users see only their own blocks"
  on public.blocks for select
  to authenticated
  using (auth.uid() = blocker_id);

create policy "users create their own blocks"
  on public.blocks for insert
  to authenticated
  with check (auth.uid() = blocker_id);

create policy "users remove their own blocks"
  on public.blocks for delete
  to authenticated
  using (auth.uid() = blocker_id);
