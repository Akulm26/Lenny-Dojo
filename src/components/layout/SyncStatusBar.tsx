import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDojoData } from '@/contexts/DojoDataContext';

export function SyncStatusBar() {
  const { status, progress, progressMessage, error, totalEpisodes, sync, isLoading } = useDojoData();
  
  if (status === 'complete' && !error) {
    return null; // Don't show when everything is fine
  }
  
  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 px-4 py-2 rounded-full shadow-lg border flex items-center gap-3 text-sm",
      status === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-card border-border'
    )}>
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>{progressMessage || `Syncing... ${progress}%`}</span>
        </>
      ) : status === 'error' ? (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>{error || 'Sync failed'}</span>
          <Button size="sm" variant="ghost" onClick={sync} className="h-7 px-2">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </>
      ) : status === 'complete' ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span>{totalEpisodes} episodes synced</span>
        </>
      ) : null}
    </div>
  );
}
