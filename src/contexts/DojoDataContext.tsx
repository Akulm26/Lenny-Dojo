import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDojoSync } from '@/hooks/useDojoSync';
import { CompanyIntelligence, Framework } from '@/services/intelligence';
import { Episode } from '@/services/github';

interface DojoDataContextValue {
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
  isLoading: boolean;
  isReady: boolean;
  sync: () => void;
}

const DojoDataContext = createContext<DojoDataContextValue | null>(null);

export function DojoDataProvider({ children }: { children: ReactNode }) {
  const dojoSync = useDojoSync();
  
  // Auto-trigger sync check on mount if no data
  useEffect(() => {
    if (dojoSync.status === 'idle' && dojoSync.episodes.length === 0) {
      // Load from cache first, then check for updates
      dojoSync.checkAndSync();
    }
  }, []);

  return (
    <DojoDataContext.Provider value={dojoSync}>
      {children}
    </DojoDataContext.Provider>
  );
}

export function useDojoData() {
  const context = useContext(DojoDataContext);
  if (!context) {
    throw new Error('useDojoData must be used within a DojoDataProvider');
  }
  return context;
}
