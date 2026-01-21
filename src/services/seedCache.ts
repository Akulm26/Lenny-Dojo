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
  
  onProgress?.(total * 0.1, total, `Found ${total} episodes. Preparing batch...`);
  
  // Convert episode IDs to minimal metadata (no individual fetches needed!)
  const episodes = episodeIds.map(id => ({
    id,
    guest: slugToName(id),
    title: `${slugToName(id)} on Lenny's Podcast`,
  }));
  
  onProgress?.(total * 0.2, total, `Extracting intelligence from ${episodes.length} episodes with AI...`);
  
  // Call edge function to seed the cache with real AI extraction
  const { data, error } = await supabase.functions.invoke('seed-intelligence-cache', {
    body: { episodes, forceReExtract }
  });
  
  if (error) {
    console.error('Seed cache error:', error);
    throw new Error(error.message || 'Failed to seed intelligence cache');
  }
  
  const seededCount = data.seeded || 0;
  onProgress?.(total, total, `Done! Extracted ${seededCount} episodes with real AI.`);
  
  return data;
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
