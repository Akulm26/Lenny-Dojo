import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SyncMetadata } from '@/types';

interface SyncStore {
  syncMetadata: SyncMetadata | null;
  isSyncing: boolean;
  setSyncMetadata: (metadata: SyncMetadata) => void;
  setIsSyncing: (syncing: boolean) => void;
}

// Default metadata for demo purposes
const defaultMetadata: SyncMetadata = {
  last_commit_sha: 'demo-sha',
  last_sync_at: new Date().toISOString(),
  episodes_processed: [],
  // Start at 0 and let the UI read the true count from the database cache.
  total_episodes: 0,
  latest_episode_date: '2024-01-15',
  sync_status: 'synced',
  error_message: null,
};

export const useSyncStore = create<SyncStore>()(
  persist(
    (set) => ({
      syncMetadata: defaultMetadata,
      isSyncing: false,
      setSyncMetadata: (metadata) => set({ syncMetadata: metadata }),
      setIsSyncing: (syncing) => set({ isSyncing: syncing }),
    }),
    {
      name: 'lenny-dojo-sync',
      version: 1,
      migrate: (persistedState: any) => {
        // Older builds hardcoded 284; if we see it, reset to 0 so the UI can show live counts.
        const sm = persistedState?.state?.syncMetadata;
        if (sm && sm.total_episodes === 284) {
          return {
            ...persistedState,
            state: {
              ...persistedState.state,
              syncMetadata: { ...sm, total_episodes: 0 },
            },
          };
        }
        return persistedState;
      },
    }
  )
);
