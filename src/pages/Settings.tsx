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
  Check
} from 'lucide-react';
import { useState } from 'react';
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

export default function Settings() {
  const { syncMetadata, isSyncing, setIsSyncing } = useSyncStore();
  const { progress, clearProgress } = useProgressStore();
  const [syncResult, setSyncResult] = useState<string | null>(null);
  
  const handleCheckUpdates = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    // Simulate sync check
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSyncing(false);
    setSyncResult('Already up to date');
    
    setTimeout(() => setSyncResult(null), 3000);
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
              
              <div className="pt-2">
                <Button
                  onClick={handleCheckUpdates}
                  disabled={isSyncing}
                  className="gap-2"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : syncResult ? (
                    <>
                      <Check className="h-4 w-4" />
                      {syncResult}
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
