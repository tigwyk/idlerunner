-- Marathon Idle — achievement columns
-- Tracks unlocked achievement IDs and lifetime kill counters per player.
-- All fields are optional (NULL → not yet set) and default to safe empty values.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS unlocked_achievements jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bosses_killed         integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_enemies_killed  integer NOT NULL DEFAULT 0;
