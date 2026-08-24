-- Recurring meets: rather than one row whose dates magically shift, each
-- occurrence is its own row. When a recurring meet's end_time passes, this
-- function inserts the next occurrence (start/end shifted by a week or
-- month) linked back via parent_meet_id, carrying over title/description/
-- location/radius/gallery. The Edge Function notify-new-meet fires on every
-- INSERT into meets, so the new occurrence gets its own push notification
-- automatically, same as a fresh meet.
create function public.create_next_recurrences()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meet record;
  v_next_start timestamptz;
  v_next_end timestamptz;
  v_created integer := 0;
begin
  for v_meet in
    select m.*
    from public.meets m
    where m.recurrence is not null
      and m.end_time < now()
      -- only the most recent occurrence in a chain carries the recurrence
      -- forward; skip it once its own next occurrence already exists.
      and not exists (
        select 1 from public.meets child where child.parent_meet_id = m.id
      )
  loop
    v_next_start := v_meet.start_time + case v_meet.recurrence
      when 'weekly' then interval '7 days'
      when 'monthly' then interval '1 month'
    end;
    v_next_end := v_meet.end_time + case v_meet.recurrence
      when 'weekly' then interval '7 days'
      when 'monthly' then interval '1 month'
    end;

    insert into public.meets (
      host_id, title, description, location, notification_radius_meters,
      start_time, end_time, gallery_urls, recurrence, parent_meet_id
    ) values (
      v_meet.host_id, v_meet.title, v_meet.description, v_meet.location,
      v_meet.notification_radius_meters, v_next_start, v_next_end,
      v_meet.gallery_urls, v_meet.recurrence, v_meet.id
    );
    v_created := v_created + 1;
  end loop;

  return v_created;
end;
$$;

-- To run this automatically, schedule it with pg_cron (Database ->
-- Extensions -> enable pg_cron in the Supabase dashboard first):
--
--   select cron.schedule(
--     'carmeet-create-next-recurrences',
--     '0 * * * *', -- hourly
--     $$ select public.create_next_recurrences(); $$
--   );
--
-- pg_cron isn't enabled by this migration since it requires a superuser
-- grant that varies by plan — run the snippet above once pg_cron is on.
