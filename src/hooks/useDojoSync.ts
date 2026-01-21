import { useState, useEffect, useCallback } from 'react';
import {
  fetchEpisodeList,
  fetchAndParseEpisode,
  checkForUpdates,
  getSyncStatus,
  updateSyncStatus,
  getStoredEpisodes,
  storeEpisodes,
  Episode,
  storeCompanies,
  storeFrameworks,
  getStoredCompanies,
  getStoredFrameworks,
  clearTranscriptCache
} from '@/services/github';
import { extractAllIntelligence, loadCachedCompaniesAndFrameworks, CompanyIntelligence, Framework } from '@/services/intelligence';
import { getCacheStatus } from '@/services/seedCache';

interface DojoSyncState {
  status: 'idle' | 'checking' | 'syncing' | 'processing' | 'complete' | 'error';
  progress: number;
  progressMessage: string;
  error: string | null;
  episodes: Episode[];
  companies: CompanyIntelligence[];
  frameworks: Framework[];
  totalEpisodes: number;
  lastSyncDate: string | null;
  latestTranscriptDate: string | null;
}

export function useDojoSync() {
  const [state, setState] = useState<DojoSyncState>({
    status: 'idle',
    progress: 0,
    progressMessage: '',
    error: null,
    episodes: [],
    companies: [],
    frameworks: [],
    totalEpisodes: 0,
    lastSyncDate: null,
    latestTranscriptDate: null
  });

  // Load cached data on mount - try Supabase first, then localStorage
  useEffect(() => {
    // Clear old transcript cache to free localStorage quota
    clearTranscriptCache();
    
    const loadInitialData = async () => {
      // Always fetch the authoritative cached-episode count from the database.
      // This keeps global UI (header/footer) in sync even if localStorage is stale.
      let cachedEpisodeCount = 0;
      try {
        const status = await getCacheStatus();
        cachedEpisodeCount = status.cached;
      } catch {
        // Ignore; we'll fall back to whatever else we can infer.
      }

      // First check localStorage for quick load
      const localCompanies = getStoredCompanies<CompanyIntelligence>();
      const localFrameworks = getStoredFrameworks<Framework>();
      
      if (localCompanies.length > 0 && localFrameworks.length > 0) {
        const syncStatus = getSyncStatus();
        const episodes = getStoredEpisodes();
        setState(prev => ({
          ...prev,
          episodes,
          companies: localCompanies,
          frameworks: localFrameworks,
          totalEpisodes: cachedEpisodeCount || episodes.length,
          lastSyncDate: syncStatus.last_sync,
          latestTranscriptDate: syncStatus.latest_episode_date,
          status: 'complete'
        }));

        // IMPORTANT: localStorage may contain stale/demo aggregates.
        // In the background, refresh from the database cache and overwrite
        // localStorage + in-memory state if authoritative data exists.
        // (Keeps fast initial render while ensuring data correctness.)
        (async () => {
          try {
            const { companies, frameworks } = await loadCachedCompaniesAndFrameworks();
            if (companies.length > 0) {
              storeCompanies(companies);
              storeFrameworks(frameworks);

              setState(prev => ({
                ...prev,
                companies,
                frameworks,
                totalEpisodes: cachedEpisodeCount || prev.totalEpisodes,
                progressMessage: `Loaded ${companies.length} companies from cache`,
              }));
            }
          } catch (e) {
            // Keep local data if cache refresh fails.
            console.warn('Background cache refresh failed:', e);
          }
        })();

        return;
      }
      
      // No localStorage data - try loading from Supabase cache
      setState(prev => ({ ...prev, status: 'checking', progressMessage: 'Loading from database...' }));
      
      try {
        const { companies, frameworks } = await loadCachedCompaniesAndFrameworks();
        
        if (companies.length > 0) {
          // Store in localStorage for future quick loads
          storeCompanies(companies);
          storeFrameworks(frameworks);
          
          setState(prev => ({
            ...prev,
            companies,
            frameworks,
            totalEpisodes: cachedEpisodeCount,
            status: 'complete',
            progressMessage: `Loaded ${companies.length} companies from cache`
          }));
          return;
        }
      } catch (e) {
        console.warn('Failed to load from Supabase cache:', e);
      }
      
      // No data anywhere - stay idle and wait for sync
      setState(prev => ({ ...prev, status: 'idle' }));
    };
    
    loadInitialData();
  }, []);

  // Light sync: just refresh from cache, no extraction
  const refreshFromCache = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        status: 'checking',
        progress: 10,
        progressMessage: 'Refreshing from database cache...',
        error: null
      }));

      const cacheStatus = await getCacheStatus();

      // Load companies and frameworks from Supabase cache
      const { companies, frameworks } = await loadCachedCompaniesAndFrameworks();
      
      if (companies.length > 0) {
        // Store in localStorage for future quick loads
        storeCompanies(companies);
        storeFrameworks(frameworks);
        
        // Update sync status
        updateSyncStatus({
          status: 'complete',
          last_sync: new Date().toISOString(),
          total_episodes: cacheStatus.cached,
          error_message: null
        });
        
        setState(prev => ({
          ...prev,
          status: 'complete',
          progress: 100,
          progressMessage: `Loaded ${companies.length} companies from cache`,
          companies,
          frameworks,
          totalEpisodes: cacheStatus.cached,
          lastSyncDate: new Date().toISOString(),
        }));
        return;
      }
      
      // No cached data - inform user to seed cache first
      setState(prev => ({
        ...prev,
        status: 'complete',
        progress: 100,
        progressMessage: 'No cached data. Use "Seed Intelligence Cache" first.',
      }));
      
    } catch (error) {
      console.error('Cache refresh failed:', error);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to load cache'
      }));
    }
  }, []);

  const checkAndSyncIfNeeded = useCallback(async () => {
    // If we already have data in state, no need to sync
    if (state.companies.length > 0 && state.frameworks.length > 0) {
      setState(prev => ({ 
        ...prev, 
        status: 'complete', 
        progressMessage: 'Data already loaded'
      }));
      return;
    }
    
    // Try to load from Supabase cache
    await refreshFromCache();
  }, [refreshFromCache, state.companies.length, state.frameworks.length]);

  const manualSync = useCallback(() => {
    // Manual sync now just refreshes from cache - no extraction
    refreshFromCache();
  }, [refreshFromCache]);

  return {
    ...state,
    sync: manualSync,
    checkAndSync: checkAndSyncIfNeeded,
    isLoading: ['checking', 'syncing', 'processing'].includes(state.status),
    // "Ready" should mean the UI can render real data.
    // When loading from the database cache we may not have episode transcripts/metadata in memory,
    // but companies/frameworks are still fully usable.
    isReady: state.status === 'complete' && (state.companies.length > 0 || state.frameworks.length > 0)
  };
}
