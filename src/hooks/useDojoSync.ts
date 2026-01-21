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
  SyncStatus,
  storeCompanies,
  storeFrameworks,
  getStoredCompanies,
  getStoredFrameworks
} from '@/services/github';
import { extractAllIntelligence, loadCachedCompaniesAndFrameworks, CompanyIntelligence, Framework } from '@/services/intelligence';

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
    const loadInitialData = async () => {
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
          totalEpisodes: episodes.length,
          lastSyncDate: syncStatus.last_sync,
          latestTranscriptDate: syncStatus.latest_episode_date,
          status: 'complete'
        }));
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
            totalEpisodes: companies.length > 0 ? companies[0].episode_count : 0,
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

  const performFullSync = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        status: 'syncing',
        progress: 0,
        progressMessage: 'Fetching episode list...',
        error: null
      }));

      const episodeIds = await fetchEpisodeList();
      const total = episodeIds.length;

      setState(prev => ({
        ...prev,
        totalEpisodes: total,
        progress: 5,
        progressMessage: `Found ${total} episodes. Loading transcripts...`
      }));

      const episodes: Episode[] = [];
      const batchSize = 10;

      for (let i = 0; i < episodeIds.length; i += batchSize) {
        const batch = episodeIds.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(id => fetchAndParseEpisode(id))
        );

        batchResults.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            episodes.push(result.value);
          } else {
            console.warn(`Failed to fetch ${batch[idx]}:`, result.reason);
          }
        });

        const progress = Math.round(((i + batch.length) / total) * 70) + 5;
        setState(prev => ({
          ...prev,
          progress,
          progressMessage: `Loading transcripts... ${episodes.length}/${total}`
        }));

        if (i + batchSize < episodeIds.length) {
          await new Promise(r => setTimeout(r, 100));
        }
      }

      storeEpisodes(episodes);
      setState(prev => ({ ...prev, episodes }));

      setState(prev => ({
        ...prev,
        status: 'processing',
        progress: 75,
        progressMessage: 'Extracting company intelligence...'
      }));

      let companies: CompanyIntelligence[] = [];
      let frameworks: Framework[] = [];
      let extractionError: string | null = null;

      try {
        const result = await extractAllIntelligence(episodes, (current, total, message) => {
          const progress = 75 + Math.round((current / total) * 20);
          setState(prev => ({ ...prev, progress, progressMessage: message }));
        });
        companies = result.companies;
        frameworks = result.frameworks;
      } catch (error) {
        // If extraction fails (e.g., 402 payment required), log but don't fail the sync
        // The cache may have partial data we can still use
        console.warn('Intelligence extraction failed:', error);
        extractionError = error instanceof Error ? error.message : 'Extraction failed';
        
        // Try to use whatever was already cached in localStorage
        companies = getStoredCompanies<CompanyIntelligence>();
        frameworks = getStoredFrameworks<Framework>();
      }

      // Ensure state updates even if storage write fails
      setState(prev => ({ ...prev, companies, frameworks }));

      if (companies.length > 0) {
        storeCompanies(companies);
      }
      if (frameworks.length > 0) {
        storeFrameworks(frameworks);
      }

      const { sha, date } = await checkForUpdates();

      updateSyncStatus({
        status: 'complete',
        last_sync: new Date().toISOString(),
        last_commit_sha: sha,
        total_episodes: episodes.length,
        latest_episode_date: date,
        error_message: null
      });

      setState(prev => ({
        ...prev,
        status: 'complete',
        progress: 100,
        progressMessage: `Synced ${episodes.length} episodes`,
        episodes,
        companies,
        frameworks,
        lastSyncDate: new Date().toISOString(),
        latestTranscriptDate: date
      }));

    } catch (error) {
      console.error('Full sync failed:', error);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Sync failed'
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
    
    // Try to load from Supabase cache first
    setState(prev => ({ ...prev, status: 'checking', progressMessage: 'Checking cache...' }));
    
    try {
      const { companies, frameworks } = await loadCachedCompaniesAndFrameworks();
      
      if (companies.length > 0) {
        storeCompanies(companies);
        storeFrameworks(frameworks);
        
        setState(prev => ({ 
          ...prev, 
          status: 'complete', 
          progressMessage: `Loaded ${companies.length} companies`,
          companies,
          frameworks
        }));
        return;
      }
    } catch (e) {
      console.warn('Cache check failed:', e);
    }
    
    // No cached data - perform full sync
    try {
      const { hasUpdates } = await checkForUpdates();
      if (hasUpdates || state.companies.length === 0) {
        setState(prev => ({ ...prev, progressMessage: 'Syncing episodes...' }));
        await performFullSync();
      } else {
        setState(prev => ({ ...prev, status: 'complete', progressMessage: 'Already up to date' }));
      }
    } catch (error) {
      console.error('Sync check failed:', error);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to check for updates'
      }));
    }
  }, [performFullSync, state.companies.length, state.frameworks.length]);

  const manualSync = useCallback(() => {
    performFullSync();
  }, [performFullSync]);

  return {
    ...state,
    sync: manualSync,
    checkAndSync: checkAndSyncIfNeeded,
    isLoading: ['checking', 'syncing', 'processing'].includes(state.status),
    isReady: state.status === 'complete' && state.episodes.length > 0
  };
}
