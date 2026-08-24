-- Storage buckets for the four kinds of images the app uploads. All public
-- read (so <img src> just works with the public URL) with writes gated by
-- folder-scoped policies below. Files are always uploaded as
-- "<ownerId>/<uuid>.<ext>" (see lib/storage.ts), so `(storage.foldername(name))[1]`
-- is the owning profile/meet id.
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('cars', 'cars', true),
  ('meet-galleries', 'meet-galleries', true),
  ('checkins', 'checkins', true)
on conflict (id) do nothing;

create policy "public read on carmeet buckets"
  on storage.objects for select
  using (bucket_id in ('avatars', 'cars', 'meet-galleries', 'checkins'));

-- avatars/cars: folder must be the uploader's own profile id.
create policy "users upload their own avatar/car photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('avatars', 'cars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users manage their own avatar/car photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('avatars', 'cars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete their own avatar/car photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('avatars', 'cars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- meet-galleries: folder is the host's profile id (host-context photos).
create policy "hosts upload their own meet gallery photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'meet-galleries'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "hosts manage their own meet gallery photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'meet-galleries'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- checkins: folder is the meet id, not the uploader — any signed-in user can
-- attempt an upload here, same as any signed-in user can attempt a check-in;
-- the real gate (active time window, one check-in per meet) is enforced by
-- the checkins table's trigger + unique constraint when the row is inserted
-- right after the upload.
create policy "authenticated users upload checkin photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'checkins');

-- Hosts can delete a checkin photo from their meet's collage (mirrors the
-- "hosts and owners remove checkins" table policy).
create policy "hosts remove checkin photos from their meets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'checkins'
    and (storage.foldername(name))[1] in (
      select id::text from public.meets where host_id = auth.uid()
    )
  );
