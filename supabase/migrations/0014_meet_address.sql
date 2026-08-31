-- Optional human-readable address for a meet. The map coordinates remain
-- authoritative; this field gives hosts a place for a street address or
-- meeting-point instructions.
alter table public.meets
  add column if not exists address text;

comment on column public.meets.address is
  'Optional human-readable street address or meeting-point instructions.';
