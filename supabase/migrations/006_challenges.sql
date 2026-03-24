-- Migration 006: Daily challenge completions
-- Adds challenge_completions JSONB to profiles.
-- Structure: { "dayNumber": ["challengeId1", "challengeId2"] }

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS challenge_completions jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.challenge_completions IS
  'Daily challenge completion tracking. Keys are day numbers (floor(epoch_ms/86400000)), values are arrays of completed challenge IDs.';
