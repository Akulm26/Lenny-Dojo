import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LoadingScreenProps {
  progress?: number;
  message?: string;
}

export function LoadingScreen({ progress = 0, message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md px-6 space-y-6 text-center">
        {/* Logo */}
        <div className="text-4xl mb-2">🥋</div>
        <h1 className="text-2xl font-bold text-gradient">Lenny's Dojo</h1>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        
        {/* Spinner */}
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
      </div>
    </div>
  );
}
