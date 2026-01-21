import { supabase } from '@/integrations/supabase/client';
import { Episode, fetchEpisodeList, fetchAndParseEpisode } from './github';

/**
 * Seed the intelligence cache with demo data for all episodes.
 * This bypasses the AI extraction and populates the cache directly.
 */
export async function seedIntelligenceCache(
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ cached: number; seeded: number; total: number }> {
  
  onProgress?.(0, 100, 'Fetching episode list from GitHub...');
  
  // Get episode list from GitHub
  const episodeIds = await fetchEpisodeList();
  const total = episodeIds.length;
  
  onProgress?.(0, total, `Found ${total} episodes. Fetching metadata...`);
  
  // Fetch episode metadata in batches
  const FETCH_BATCH = 20;
  const episodes: Array<{ id: string; guest: string; title: string }> = [];
  
  for (let i = 0; i < episodeIds.length; i += FETCH_BATCH) {
    const batch = episodeIds.slice(i, i + FETCH_BATCH);
    
    onProgress?.(i, total, `Fetching episode metadata ${i + 1}-${Math.min(i + FETCH_BATCH, total)} of ${total}...`);
    
    const results = await Promise.allSettled(
      batch.map(id => fetchAndParseEpisode(id))
    );
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        episodes.push({
          id: result.value.id,
          guest: result.value.guest,
          title: result.value.title,
        });
      }
    }
  }
  
  onProgress?.(total, total, `Seeding cache for ${episodes.length} episodes...`);
  
  // Call edge function to seed the cache
  const { data, error } = await supabase.functions.invoke('seed-intelligence-cache', {
    body: { episodes }
  });
  
  if (error) {
    console.error('Seed cache error:', error);
    throw new Error(error.message || 'Failed to seed intelligence cache');
  }
  
  onProgress?.(total, total, `Done! Seeded ${data.seeded} episodes.`);
  
  return data;
}

/**
 * Check how many episodes are currently cached
 */
export async function getCacheStatus(): Promise<{ cached: number }> {
  const { count, error } = await supabase
    .from('episode_intelligence_cache')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.warn('Failed to get cache status:', error);
    return { cached: 0 };
  }
  
  return { cached: count || 0 };
}
