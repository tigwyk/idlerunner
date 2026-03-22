-- Marathon Idle — initial multiplayer schema
-- Apply this in the Supabase SQL Editor, or via `supabase db push` with the CLI.
--
-- Supabase automatically creates the `auth.users` table managed by Supabase Auth.
-- This migration creates the game-specific tables that extend that identity layer.

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- One row per authenticated user.  id matches auth.users.id so that JWT claims
-- can be used directly in RLS policies without a separate lookup.
create table if not exists public.profiles (
  id           uuid        primary key references auth.users (id) on delete cascade,
  runner_name  text        not null default 'Runner',
  region       text        not null default 'NA',
  mmr          integer     not null default 1200,
  rank_tier    text        not null default 'Silver',
  career_runs  integer     not null default 0,
  career_wins  integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-update updated_at on row modification
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS: users manage their own row; leaderboard reads are public
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Leaderboard is public"
  on public.profiles for select
  using (true);

-- ─── Encounter summaries ─────────────────────────────────────────────────────
create table if not exists public.encounters (
  id               uuid        primary key default gen_random_uuid(),
  player_a_id      uuid        references public.profiles (id) on delete set null,
  player_b_id      uuid        references public.profiles (id) on delete set null,
  winner_id        uuid        references public.profiles (id) on delete set null,
  encounter_type   text        not null,
  sector           text        not null,
  mmr_change_a     integer,
  mmr_change_b     integer,
  created_at       timestamptz not null default now()
);

alter table public.encounters enable row level security;

create policy "Encounter participants can read their encounters"
  on public.encounters for select
  using (auth.uid() = player_a_id or auth.uid() = player_b_id);

-- ─── Reports ─────────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id           uuid        primary key default gen_random_uuid(),
  reporter_id  uuid        not null references public.profiles (id) on delete cascade,
  reported_id  uuid        not null references public.profiles (id) on delete cascade,
  reason       text        not null,
  details      text,
  created_at   timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Users can create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "Users can read their own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- ─── Block list ───────────────────────────────────────────────────────────────
create table if not exists public.blocks (
  blocker_id   uuid        not null references public.profiles (id) on delete cascade,
  blocked_id   uuid        not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table public.blocks enable row level security;

create policy "Users manage their own block list"
  on public.blocks for all
  using (auth.uid() = blocker_id);

-- ─── Seasons ──────────────────────────────────────────────────────────────────
create table if not exists public.seasons (
  id         serial      primary key,
  name       text        not null,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  active     boolean     not null default true
);

-- Seed the first season
insert into public.seasons (name) values ('Season 1') on conflict do nothing;
