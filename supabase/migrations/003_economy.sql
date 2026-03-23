-- Marathon Idle — economy columns
-- Adds server-authoritative resource balances and stat upgrade levels to profiles.
-- Resources replace the client-side (localStorage) economy so they can't be
-- trivially manipulated before a multiplayer run.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS resources     jsonb NOT NULL DEFAULT '{"credits":100,"metals":0,"electronics":0,"data":0}'::jsonb,
  ADD COLUMN IF NOT EXISTS stat_upgrades jsonb NOT NULL DEFAULT '{}'::jsonb;
