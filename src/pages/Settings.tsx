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
  Check,
  Database,
  Loader2,
  Zap
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
import { seedIntelligenceCache, getCacheStatus } from '@/services/seedCache';
import { Progress } from '@/components/ui/progress';
import { useDojoData } from '@/contexts/DojoDataContext';
import { clearAllCache } from '@/services/github';
import { clearIntelligenceCache } from '@/services/intelligenceCache';

export default function Settings() {
  const { syncMetadata, isSyncing, setIsSyncing } = useSyncStore();
  const { progress, clearProgress } = useProgressStore();
  const { sync, status, progressMessage } = useDojoData();
  const [syncResult, setSyncResult] = useState<string | null>(null);
  
  // Cache seeding state
  const [cacheCount, setCacheCount] = useState<number>(0);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState({ current: 0, total: 0, message: '' });
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [isForceExtracting, setIsForceExtracting] = useState(false);
  
  // Load cache status on mount
  useEffect(() => {
    getCacheStatus().then(status => setCacheCount(status.cached));
  }, []);
  
  // Refresh cache count when sync completes
  useEffect(() => {
    if (status === 'complete') {
      getCacheStatus().then(s => setCacheCount(s.cached));
    }
  }, [status]);
  
  const handleSeedCache = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    setSeedProgress({ current: 0, total: 100, message: 'Starting...' });
    
    try {
      const result = await seedIntelligenceCache((current, total, message) => {
        setSeedProgress({ current, total, message });
      });
      
      setCacheCount(result.cached + result.seeded);
      setSeedResult(`Seeded ${result.seeded} episodes!`);
    } catch (error) {
      console.error('Seed cache error:', error);
      setSeedResult('Error: ' + (error instanceof Error ? error.message : 'Unknown'));
    } finally {
      setIsSeeding(false);
      setTimeout(() => setSeedResult(null), 5000);
    }
  };
  
  const handleForceExtract = async () => {
    setIsForceExtracting(true);
    setSyncResult(null);
    
    try {
      // Clear all caches
      await clearIntelligenceCache();
      clearAllCache();
      setCacheCount(0);
      
      // Trigger full sync with AI extraction
      sync();
      setSyncResult('Extraction started!');
    } catch (error) {
      console.error('Force extract error:', error);
      setSyncResult('Error: ' + (error instanceof Error ? error.message : 'Unknown'));
    } finally {
      setIsForceExtracting(false);
    }
  };
  
  const handleCheckUpdates = async () => {
    // Just trigger sync directly
    sync();
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
          {/* Intelligence Cache */}
          <section className="p-6 rounded-xl border border-border bg-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Intelligence Cache
            </h2>
            
            <p className="text-sm text-muted-foreground mb-4">
              Pre-populate the cache with demo intelligence data for all episodes. 
              This enables the Companies and Frameworks pages to work without AI extraction.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Episodes cached</span>
                <span className="font-medium">{cacheCount}</span>
              </div>
              
              {isSeeding && (
                <div className="space-y-2">
                  <Progress value={(seedProgress.current / seedProgress.total) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">{seedProgress.message}</p>
                </div>
              )}
              
              <div className="pt-2">
                <Button
                  onClick={handleSeedCache}
                  disabled={isSeeding}
                  className="gap-2"
                  variant={cacheCount > 0 ? "outline" : "default"}
                >
                  {isSeeding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Seeding Cache...
                    </>
                  ) : seedResult ? (
                    <>
                      <Check className="h-4 w-4" />
                      {seedResult}
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      {cacheCount > 0 ? 'Re-seed Cache' : 'Seed Intelligence Cache'}
                    </>
                  )}
                </Button>
              </div>
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
              
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCheckUpdates}
                  disabled={status === 'syncing' || status === 'processing' || isForceExtracting}
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
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={status === 'syncing' || status === 'processing' || isForceExtracting}
                      className="gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Force AI Extraction
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Force AI Extraction?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear all cached intelligence and re-extract from all 303 episodes using real AI. 
                        This requires Lovable AI credits and will take several minutes.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleForceExtract}>
                        Start Extraction
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
