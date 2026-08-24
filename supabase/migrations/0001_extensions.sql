-- Extensions CarMeet relies on.
-- postgis: geography columns + ST_DWithin for radius queries
-- pgcrypto: gen_random_uuid() for primary keys
create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;
