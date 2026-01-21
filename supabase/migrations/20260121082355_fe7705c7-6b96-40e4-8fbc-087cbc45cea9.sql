-- Drop the overly permissive INSERT and UPDATE policies
DROP POLICY IF EXISTS "Anyone can insert intelligence cache" ON public.episode_intelligence_cache;
DROP POLICY IF EXISTS "Anyone can update intelligence cache" ON public.episode_intelligence_cache;

-- Create new policies that only allow service role to write
-- The service role is used by edge functions for automated syncing
CREATE POLICY "Service role can insert intelligence cache"
ON public.episode_intelligence_cache
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update intelligence cache"
ON public.episode_intelligence_cache
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Add DELETE policy for service role (for cache cleanup)
CREATE POLICY "Service role can delete intelligence cache"
ON public.episode_intelligence_cache
FOR DELETE
TO service_role
USING (true);