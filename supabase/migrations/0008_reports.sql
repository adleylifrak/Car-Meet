create type public.report_target_type as enum ('photo', 'profile');

create table public.reports (
  id uuid primary key default extensions.gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index reports_target_idx on public.reports (target_type, target_id);

alter table public.reports enable row level security;

-- Reports go to the app, never to other users — reporters can see their own
-- submissions (so the UI can show "reported"), nobody else can read them.
-- Full moderation access is via the Supabase dashboard / service_role key.
create policy "users see their own reports"
  on public.reports for select
  to authenticated
  using (auth.uid() = reporter_id);

create policy "users create reports"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);
