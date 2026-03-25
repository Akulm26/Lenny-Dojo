
-- Add is_new and published_at columns to episode_intelligence_cache
ALTER TABLE public.episode_intelligence_cache 
  ADD COLUMN is_new boolean NOT NULL DEFAULT false,
  ADD COLUMN published_at timestamp with time zone;

-- Create notifications_queue table for "Notify Me" feature
CREATE TABLE public.notifications_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_title text NOT NULL,
  guest_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notified boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, episode_title)
);

-- Enable RLS on notifications_queue
ALTER TABLE public.notifications_queue ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications_queue
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can insert their own notifications
CREATE POLICY "Users can insert own notifications" ON public.notifications_queue
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications_queue
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Auto-set is_new for episodes added in last 7 days
CREATE OR REPLACE FUNCTION public.auto_set_is_new()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_at >= (now() - interval '7 days') THEN
    NEW.is_new := true;
  ELSE
    NEW.is_new := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_episode_is_new
  BEFORE INSERT ON public.episode_intelligence_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_is_new();
