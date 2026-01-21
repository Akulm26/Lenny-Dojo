import { forwardRef } from 'react';
import { useDojoData } from '@/contexts/DojoDataContext';

export const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
  const { totalEpisodes, lastSyncDate, latestTranscriptDate, isLoading } = useDojoData();

  const episodeCount = totalEpisodes;
  const formattedSyncDate = lastSyncDate 
    ? new Date(lastSyncDate).toLocaleDateString()
    : 'recently';
  
  return (
    <footer ref={ref} className="border-t border-border bg-surface/50 py-6">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-lg">🥋</span>
            <span>Trained on {isLoading ? '...' : episodeCount} episodes of Lenny's Podcast wisdom</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span>Last synced: {formattedSyncDate}</span>
            {latestTranscriptDate && (
              <span className="hidden sm:inline">
                Transcripts through: {latestTranscriptDate}
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/50 text-center text-xs text-muted-foreground/70">
          By: Akul S. Malhotra
        </div>
      </div>
    </footer>
  );
});
