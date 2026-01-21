-- Drop the public read policy
DROP POLICY IF EXISTS "Anyone can read intelligence cache" ON public.episode_intelligence_cache;

-- Create new policy requiring authentication to read
CREATE POLICY "Authenticated users can read intelligence cache"
ON public.episode_intelligence_cache
FOR SELECT
TO authenticated
USING (true);