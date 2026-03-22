-- Marathon Idle — migration 002: unique runner names
-- Apply in the Supabase SQL Editor after migration 001.

-- Use a unique index on lower(runner_name) for case-insensitive uniqueness.
-- This means "Atlas" and "atlas" cannot both exist.
create unique index if not exists profiles_runner_name_unique
  on public.profiles (lower(runner_name));

-- Remove the default 'Runner' fallback — runner_name must now be explicitly
-- chosen by the user on first login.
alter table public.profiles
  alter column runner_name drop default;
