-- ============================================================================
-- Check-in gate + meets_attended_count
-- ============================================================================

-- The only gate on check-ins in v1: submitted_at must fall inside the meet's
-- [start_time, end_time] window. No GPS verification.
create function public.enforce_checkin_window()
returns trigger
language plpgsql
as $$
declare
  meet_start timestamptz;
  meet_end timestamptz;
begin
  select start_time, end_time into meet_start, meet_end
  from public.meets where id = new.meet_id;

  if meet_start is null then
    raise exception 'Meet % does not exist', new.meet_id;
  end if;

  if new.submitted_at < meet_start or new.submitted_at > meet_end then
    raise exception 'Check-ins are only allowed while the meet is active';
  end if;

  return new;
end;
$$;

create trigger enforce_checkin_window
  before insert on public.checkins
  for each row execute function public.enforce_checkin_window();

-- After a valid check-in, bump the public social-proof counter.
create function public.handle_new_checkin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set meets_attended_count = meets_attended_count + 1
  where id = new.profile_id;
  return new;
end;
$$;

create trigger handle_new_checkin
  after insert on public.checkins
  for each row execute function public.handle_new_checkin();

-- Keep the count accurate if a check-in is removed by its owner or host.
create function public.handle_checkin_removed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set meets_attended_count = greatest(0, meets_attended_count - 1)
  where id = old.profile_id;
  return old;
end;
$$;

create trigger handle_checkin_removed
  after delete on public.checkins
  for each row execute function public.handle_checkin_removed();

-- ============================================================================
-- In-app notifications
-- ============================================================================

create function public.handle_new_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (profile_id, type, actor_id)
  values (new.following_id, 'new_follower', new.follower_id);
  return new;
end;
$$;

create trigger handle_new_follow
  after insert on public.follows
  for each row execute function public.handle_new_follow();

create function public.handle_new_rsvp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id uuid;
begin
  select host_id into v_host_id from public.meets where id = new.meet_id;
  if v_host_id is not null and v_host_id <> new.profile_id then
    insert into public.notifications (profile_id, type, actor_id, meet_id)
    values (v_host_id, 'new_rsvp', new.profile_id, new.meet_id);
  end if;
  return new;
end;
$$;

create trigger handle_new_rsvp
  after insert on public.rsvps
  for each row execute function public.handle_new_rsvp();

-- Note: 'new_meet_nearby' notification rows are inserted by the
-- notify-new-meet Edge Function (supabase/functions/notify-new-meet), not a
-- DB trigger — it already runs the radius query to decide who to push to,
-- so it writes the matching in-app notifications in the same pass using the
-- service_role key.

-- ============================================================================
-- updated_at maintenance
-- ============================================================================

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profile_locations_set_updated_at
  before update on public.profile_locations
  for each row execute function public.set_updated_at();
