-- Optional human-readable address for a meet. The map coordinates remain
-- authoritative; this field gives hosts a place for a street address or
-- meeting-point instructions.
alter table public.meets
  add column if not exists address text;

comment on column public.meets.address is
  'Optional human-readable street address or meeting-point instructions.';

-- Carry the address forward when a recurring meet creates its next occurrence.
create or replace function public.create_next_recurrences()
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
      host_id, title, description, address, location, notification_radius_meters,
      start_time, end_time, gallery_urls, recurrence, parent_meet_id
    ) values (
      v_meet.host_id, v_meet.title, v_meet.description, v_meet.address,
      v_meet.location, v_meet.notification_radius_meters, v_next_start,
      v_next_end, v_meet.gallery_urls, v_meet.recurrence, v_meet.id
    );
    v_created := v_created + 1;
  end loop;

  return v_created;
end;
$$;
