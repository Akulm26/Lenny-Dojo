-- Create table for caching per-episode extracted intelligence
CREATE TABLE public.episode_intelligence_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id TEXT NOT NULL UNIQUE,
  guest_name TEXT NOT NULL,
  episode_title TEXT NOT NULL,
  intelligence JSONB NOT NULL,
  extracted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for fast lookups by episode_id
CREATE INDEX idx_episode_intelligence_episode_id ON public.episode_intelligence_cache(episode_id);

-- Enable RLS but allow public read/write since this is app-level cache (no user data)
ALTER TABLE public.episode_intelligence_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached intelligence
CREATE POLICY "Anyone can read intelligence cache"
ON public.episode_intelligence_cache
FOR SELECT
USING (true);

-- Allow anyone to insert into cache (app-level, not user-specific)
CREATE POLICY "Anyone can insert intelligence cache"
ON public.episode_intelligence_cache
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update cache entries
CREATE POLICY "Anyone can update intelligence cache"
ON public.episode_intelligence_cache
FOR UPDATE
USING (true);