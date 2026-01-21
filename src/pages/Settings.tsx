import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useSyncStore } from '@/stores/syncStore';
import { useProgressStore } from '@/stores/progressStore';
import { 
  Settings as SettingsIcon,
  RefreshCw,
  Trash2,
  Download,
  ExternalLink,
  Loader2,
  CloudDownload,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDojoData } from '@/contexts/DojoDataContext';
import { supabase } from '@/integrations/supabase/client';
import { getCachedEpisodeCount } from '@/services/intelligenceCache';

export default function Settings() {
  const { syncMetadata } = useSyncStore();
  const { progress, clearProgress } = useProgressStore();
  const { sync, status, progressMessage } = useDojoData();
  
  // Cache count state
  const [cacheCount, setCacheCount] = useState<number>(0);
  
  // Manual sync state
  const [isSyncingEpisodes, setIsSyncingEpisodes] = useState(false);
  const [syncEpisodeResult, setSyncEpisodeResult] = useState<string | null>(null);
  
  // Load cache status on mount
  useEffect(() => {
    getCachedEpisodeCount().then(count => setCacheCount(count));
  }, []);
  
  // Refresh cache count when sync completes
  useEffect(() => {
    if (status === 'complete') {
      getCachedEpisodeCount().then(count => setCacheCount(count));
    }
  }, [status]);
  
  const handleCheckUpdates = async () => {
    // Just trigger sync directly
    sync();
  };
  
  const handleSyncNewEpisodes = async () => {
    setIsSyncingEpisodes(true);
    setSyncEpisodeResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-new-episodes', {
        headers: {
          'x-cron-secret': 'lenny-sync-2024-secret'
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update cache count
      const count = await getCachedEpisodeCount();
      setCacheCount(count);
      
      setSyncEpisodeResult(data.message || `Processed ${data.processed || 0} new episodes`);
    } catch (error) {
      console.error('Sync new episodes error:', error);
      setSyncEpisodeResult('Error: ' + (error instanceof Error ? error.message : 'Unknown'));
    } finally {
      setIsSyncingEpisodes(false);
      setTimeout(() => setSyncEpisodeResult(null), 8000);
    }
  };
  
  const handleExportProgress = () => {
    const data = JSON.stringify(progress, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lenny-dojo-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mb-8">
          Configure your preferences and manage your data
        </p>
        
        <div className="space-y-8">
          
          {/* Sync New Episodes from GitHub */}
          <section className="p-6 rounded-xl border border-border bg-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CloudDownload className="h-5 w-5 text-primary" />
              Sync New Episodes
            </h2>
            
            <p className="text-sm text-muted-foreground mb-4">
              Check the GitHub repository for new podcast transcripts and process them with AI. 
              This runs automatically daily at 2 AM UTC, but you can trigger it manually here.
            </p>
            
            <div className="space-y-4">
              {syncEpisodeResult && (
                <div className={`p-3 rounded-lg text-sm ${
                  syncEpisodeResult.startsWith('Error') 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {syncEpisodeResult}
                </div>
              )}
              
              <Button
                onClick={handleSyncNewEpisodes}
                disabled={isSyncingEpisodes}
                className="gap-2"
              >
                {isSyncingEpisodes ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking GitHub...
                  </>
                ) : (
                  <>
                    <CloudDownload className="h-4 w-4" />
                    Sync New Episodes
                  </>
                )}
              </Button>
            </div>
          </section>
          
          {/* Data Sync */}
          <section className="p-6 rounded-xl border border-border bg-card">
            <h2 className="text-lg font-semibold mb-4">Data Sync</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last synced</span>
                <span>
                  {syncMetadata?.last_sync_at 
                    ? new Date(syncMetadata.last_sync_at).toLocaleString()
                    : 'Never'
                  }
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Episodes loaded</span>
                <span>{syncMetadata?.total_episodes || 0}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Transcripts through</span>
                <span>{syncMetadata?.latest_episode_date || 'N/A'}</span>
              </div>
              
              {cacheCount > 0 && syncMetadata?.total_episodes && cacheCount !== syncMetadata.total_episodes && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <strong>Note:</strong> "Episodes cached" ({cacheCount}) reflects all episodes stored in the database, 
                  while "Episodes loaded" ({syncMetadata.total_episodes}) is the count from the latest GitHub sync. 
                  The cache may include older episodes no longer in the source repository.
                </p>
              )}
              
              {/* Show sync status message */}
              {(status === 'syncing' || status === 'processing' || status === 'checking') && (
                <div className="p-3 rounded-lg bg-primary/10 text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>{progressMessage || 'Syncing...'}</span>
                  </div>
                </div>
              )}
              
              <div className="pt-2">
                <Button
                  onClick={handleCheckUpdates}
                  disabled={status === 'syncing' || status === 'processing'}
                  className="gap-2"
                >
                  {status === 'syncing' || status === 'processing' ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Check for Updates
                    </>
                  )}
                </Button>
              </div>
            </div>
          </section>
          
          {/* Progress Data */}
          <section className="p-6 rounded-xl border border-border bg-card">
            <h2 className="text-lg font-semibold mb-4">Progress Data</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Questions practiced</span>
                <span>{progress.total_questions_attempted}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Practice sessions</span>
                <span>{progress.sessions.length}</span>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleExportProgress}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Progress
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 text-destructive hover:text-destructive hover:border-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear All Progress
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your practice history, scores, and progress. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={clearProgress}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete All Progress
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </section>
          
          {/* About */}
          <section className="p-6 rounded-xl border border-border bg-card">
            <h2 className="text-lg font-semibold mb-4">About</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>1.0.0</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Source</span>
                <span>Lenny's Podcast Transcripts</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">GitHub</span>
                <a
                  href="https://github.com/ChatPRD/lennys-podcast-transcripts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  View Repository
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
