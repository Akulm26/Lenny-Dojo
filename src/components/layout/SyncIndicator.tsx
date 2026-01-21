import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncStore } from '@/stores/syncStore';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function SyncIndicator() {
  const { syncMetadata, isSyncing } = useSyncStore();
  
  const status = isSyncing ? 'syncing' : (syncMetadata?.sync_status || 'synced');
  
  const statusConfig = {
    synced: {
      icon: Check,
      label: 'Synced',
      className: 'text-success',
    },
    syncing: {
      icon: RefreshCw,
      label: 'Syncing...',
      className: 'text-primary animate-spin',
    },
    error: {
      icon: AlertCircle,
      label: 'Sync Error',
      className: 'text-destructive',
    },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.synced;
  const Icon = config.icon;
  
  const episodeCount = syncMetadata?.total_episodes || 284;
  const lastSyncDate = syncMetadata?.last_sync_at 
    ? new Date(syncMetadata.last_sync_at).toLocaleDateString()
    : 'Never';
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors text-sm text-muted-foreground">
          <Icon className={cn('h-3.5 w-3.5', config.className)} />
          <span className="hidden sm:inline">{episodeCount} episodes</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <p className="font-medium">{config.label}</p>
        <p className="text-muted-foreground">Last synced: {lastSyncDate}</p>
        {syncMetadata?.latest_episode_date && (
          <p className="text-muted-foreground">
            Transcripts through: {syncMetadata.latest_episode_date}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
