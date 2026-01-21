import { supabase } from '@/integrations/supabase/client';
import { fetchEpisodeList } from './github';

/**
 * Convert episode ID (slug) to display name
 * e.g., "brian-chesky" -> "Brian Chesky"
 */
function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Seed the intelligence cache with demo data for all episodes.
 * This bypasses the AI extraction and populates the cache directly.
 * FAST MODE: Uses episode IDs directly without fetching individual transcripts.
 */
export async function seedIntelligenceCache(
  onProgress?: (current: number, total: number, message: string) => void,
  forceReExtract: boolean = true // Default to true to always use real AI extraction
): Promise<{ cached: number; seeded: number; total: number }> {
  
  onProgress?.(0, 100, 'Fetching episode list from GitHub...');
  
  // Get episode list from GitHub (single fast API call)
  const episodeIds = await fetchEpisodeList();
  const total = episodeIds.length;
  
  onProgress?.(0, total, `Found ${total} episodes. Starting AI extraction...`);

  // IMPORTANT: do NOT send all episodes in a single request.
  // Edge functions have runtime limits; we chunk client-side and call repeatedly.
  const CHUNK_SIZE = 5;
  let processed = 0;
  let seededTotal = 0;

  for (let i = 0; i < episodeIds.length; i += CHUNK_SIZE) {
    const chunkIds = episodeIds.slice(i, i + CHUNK_SIZE);

    // Convert episode IDs to minimal metadata (we fetch real transcripts server-side)
    const episodes = chunkIds.map(id => ({
      id,
      guest: slugToName(id),
      title: `${slugToName(id)} on Lenny's Podcast`,
    }));

    onProgress?.(
      processed,
      total,
      `Extracting ${Math.min(processed + episodes.length, total)}/${total}...`
    );

    const { data, error } = await supabase.functions.invoke('seed-intelligence-cache', {
      body: { episodes, forceReExtract }
    });

    if (error) {
      console.error('Seed cache error:', error);
      throw new Error(error.message || 'Failed to extract intelligence');
    }

    seededTotal += (data?.seeded as number) || 0;
    processed += episodes.length;
  }

  onProgress?.(total, total, `Done! Processed ${total} episodes.`);
  return { cached: 0, seeded: seededTotal, total };
}

/**
 * Check how many episodes are currently cached
 */
export async function getCacheStatus(): Promise<{ cached: number }> {
  // Use a backend function so counts work even when the user is logged out.
  const { data, error } = await supabase.functions.invoke('get-cache-status');

  if (error) {
    console.warn('Failed to get cache status:', error);
    return { cached: 0 };
  }

  return { cached: (data?.cached as number) || 0 };
}
