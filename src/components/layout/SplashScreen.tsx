import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export function SplashScreen({ onComplete, minDuration = 2000 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      // Wait for exit animation to complete
      setTimeout(onComplete, 500);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-all duration-500",
        isExiting && "opacity-0 scale-105"
      )}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-primary/10 via-transparent to-primary/5 animate-[spin_20s_linear_infinite]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center space-y-6">
        {/* Logo with pulse animation */}
        <div className="relative">
          <div className="absolute inset-0 blur-2xl bg-primary/30 animate-pulse rounded-full scale-150" />
          <div className="relative text-8xl animate-[bounce_2s_ease-in-out_infinite]">
            🥋
          </div>
        </div>

        {/* Title with fade-in animation */}
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-2">
            Lenny's Dojo
          </h1>
          <p className="text-muted-foreground text-lg">
            Master Product Management
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center gap-2 mt-8">
          <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite]" />
          <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1s_ease-in-out_0.1s_infinite]" />
          <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1s_ease-in-out_0.2s_infinite]" />
        </div>
      </div>
    </div>
  );
}
