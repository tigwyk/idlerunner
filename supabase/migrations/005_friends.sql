-- Marathon Idle — friends system
-- Friendships are stored as directed pairs: sender sends a request to receiver.
-- A bidirectional friendship requires status = 'accepted'.
-- RLS: users can see rows where they are sender or receiver; they can only
--       insert rows where they are the sender; status updates are limited to
--       the receiver accepting/declining.

CREATE TABLE IF NOT EXISTS public.friendships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_friend CHECK (sender_id <> receiver_id),
  CONSTRAINT unique_pair    UNIQUE (sender_id, receiver_id)
);

-- Index for efficient lookup of a user's friendships
CREATE INDEX IF NOT EXISTS idx_friendships_sender   ON public.friendships(sender_id);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver ON public.friendships(receiver_id);

-- RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can see friendships they're part of
CREATE POLICY "view own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can only insert friendships where they are the sender
CREATE POLICY "send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Receiver can accept (update status); sender can delete (cancel/unfriend)
CREATE POLICY "accept or remove friendships"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "delete friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
