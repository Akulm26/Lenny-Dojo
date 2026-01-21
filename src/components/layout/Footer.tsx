import { useSyncStore } from '@/stores/syncStore';

export function Footer() {
  const { syncMetadata } = useSyncStore();
  
  const episodeCount = syncMetadata?.total_episodes || 284;
  const lastSyncDate = syncMetadata?.last_sync_at 
    ? new Date(syncMetadata.last_sync_at).toLocaleDateString()
    : 'recently';
  
  return (
    <footer className="border-t border-border bg-surface/50 py-6">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-lg">🥋</span>
            <span>Trained on {episodeCount} episodes of Lenny's Podcast wisdom</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span>Last synced: {lastSyncDate}</span>
            {syncMetadata?.latest_episode_date && (
              <span className="hidden sm:inline">
                Transcripts through: {syncMetadata.latest_episode_date}
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
