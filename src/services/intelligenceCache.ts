import { supabase } from '@/integrations/supabase/client';
import { ExtractedIntelligence } from './ai';

// ============================================
// INTELLIGENCE CACHE SERVICE
// ============================================

interface CachedIntelligence {
  episode_id: string;
  guest_name: string;
  episode_title: string;
  intelligence: ExtractedIntelligence;
  extracted_at: string;
}

/**
 * Get cached intelligence for multiple episodes
 */
export async function getCachedIntelligence(
  episodeIds: string[]
): Promise<Map<string, ExtractedIntelligence>> {
  const cache = new Map<string, ExtractedIntelligence>();
  
  if (episodeIds.length === 0) return cache;
  
  try {
    const { data, error } = await supabase
      .from('episode_intelligence_cache')
      .select('episode_id, intelligence')
      .in('episode_id', episodeIds);
    
    if (error) {
      console.warn('Failed to fetch intelligence cache:', error);
      return cache;
    }
    
    for (const row of data || []) {
      cache.set(row.episode_id, row.intelligence as unknown as ExtractedIntelligence);
    }
  } catch (e) {
    console.warn('Error reading intelligence cache:', e);
  }
  
  return cache;
}

/**
 * Store extracted intelligence in cache
 */
export async function cacheIntelligence(
  episodeId: string,
  guestName: string,
  episodeTitle: string,
  intelligence: ExtractedIntelligence
): Promise<void> {
  try {
    // Use raw insert with type assertion since the generated types may not include this new table yet
    const { error } = await supabase
      .from('episode_intelligence_cache')
      .upsert(
        {
          episode_id: episodeId,
          guest_name: guestName,
          episode_title: episodeTitle,
          intelligence: intelligence as unknown,
          extracted_at: new Date().toISOString()
        } as any,
        { onConflict: 'episode_id' }
      );
    
    if (error) {
      console.warn('Failed to cache intelligence for', episodeId, error);
    }
  } catch (e) {
    console.warn('Error caching intelligence:', e);
  }
}

/**
 * Get count of cached episodes
 */
export async function getCachedEpisodeCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('episode_intelligence_cache')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.warn('Failed to get cache count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (e) {
    console.warn('Error getting cache count:', e);
    return 0;
  }
}

/**
 * Clear all cached intelligence (for debugging/reset)
 */
export async function clearIntelligenceCache(): Promise<void> {
  try {
    const { error } = await supabase
      .from('episode_intelligence_cache')
      .delete()
      .neq('episode_id', ''); // Delete all rows
    
    if (error) {
      console.warn('Failed to clear intelligence cache:', error);
    }
  } catch (e) {
    console.warn('Error clearing cache:', e);
  }
}
