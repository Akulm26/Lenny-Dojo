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

// Persist the context instance across Vite HMR to avoid
// "Provider exists but consumer sees null" issues.
const globalKey = '__lennys_dojo_data_context__';
const DojoDataContext: React.Context<DojoDataContextValue | null> =
  (globalThis as any)[globalKey] ?? createContext<DojoDataContextValue | null>(null);

(globalThis as any)[globalKey] = DojoDataContext;

export function DojoDataProvider({ children }: { children: ReactNode }) {
  const dojoSync = useDojoSync();
  
  // Load cached data on mount - but don't auto-sync
  // The useDojoSync hook handles loading from localStorage/Supabase cache in its own useEffect
  // Users must explicitly trigger sync via Settings or refresh button

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
