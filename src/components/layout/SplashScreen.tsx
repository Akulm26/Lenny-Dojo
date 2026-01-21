import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export function SplashScreen({ onComplete, minDuration = 2500 }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const [beltProgress, setBeltProgress] = useState(0);

  useEffect(() => {
    // Phase 1: Enter animation
    const enterTimer = setTimeout(() => setPhase('hold'), 600);
    
    // Animate belt tying
    const beltInterval = setInterval(() => {
      setBeltProgress(prev => Math.min(prev + 2, 100));
    }, 30);

    // Phase 2: Exit
    const exitTimer = setTimeout(() => {
      setPhase('exit');
      setTimeout(onComplete, 600);
    }, minDuration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearInterval(beltInterval);
    };
  }, [minDuration, onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden",
        phase === 'exit' && "pointer-events-none"
      )}
    >
      {/* Animated radial gradient background */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-700",
          phase === 'exit' && "opacity-0"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.15)_0%,transparent_70%)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Circular reveal mask */}
      <div
        className={cn(
          "absolute inset-0 bg-background transition-all duration-700 ease-out",
          phase === 'enter' && "clip-path-circle-0",
          phase === 'hold' && "clip-path-circle-full opacity-0",
          phase === 'exit' && "clip-path-circle-full opacity-0"
        )}
        style={{
          clipPath: phase === 'enter' 
            ? 'circle(0% at 50% 50%)' 
            : 'circle(150% at 50% 50%)'
        }}
      />

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated dojo emblem */}
        <div 
          className={cn(
            "relative mb-8 transition-all duration-700 ease-out",
            phase === 'enter' && "scale-0 rotate-180",
            phase === 'hold' && "scale-100 rotate-0",
            phase === 'exit' && "scale-150 opacity-0"
          )}
        >
          {/* Outer ring with rotating segments */}
          <div className="absolute inset-0 -m-6">
            <svg viewBox="0 0 120 120" className="w-40 h-40 animate-[spin_8s_linear_infinite]">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                strokeDasharray="8 12"
                opacity="0.3"
              />
            </svg>
          </div>
          
          {/* Inner glowing ring */}
          <div className="absolute inset-0 -m-3">
            <svg viewBox="0 0 100 100" className="w-34 h-34">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="289"
                strokeDashoffset={289 - (289 * beltProgress) / 100}
                className="transition-all duration-100 drop-shadow-[0_0_8px_hsl(var(--primary))]"
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
              />
            </svg>
          </div>

          {/* Emoji with glow */}
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-primary/40 rounded-full scale-150" />
            <span className="relative text-7xl block filter drop-shadow-2xl">🥋</span>
          </div>
        </div>

        {/* Title with staggered letter animation */}
        <div 
          className={cn(
            "text-center transition-all duration-500 delay-200",
            phase === 'enter' && "opacity-0 translate-y-8",
            phase === 'hold' && "opacity-100 translate-y-0",
            phase === 'exit' && "opacity-0 -translate-y-8"
          )}
        >
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-3">
            <span className="inline-block bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]">
              Lenny's Dojo
            </span>
          </h1>
          
          {/* Animated underline */}
          <div className="relative h-0.5 w-48 mx-auto overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent"
              style={{
                transform: `translateX(${beltProgress - 100}%)`,
                transition: 'transform 0.1s ease-out'
              }}
            />
          </div>
        </div>

        {/* Tagline with typewriter effect */}
        <p 
          className={cn(
            "mt-6 text-muted-foreground text-lg tracking-wide transition-all duration-500 delay-300",
            phase === 'enter' && "opacity-0",
            phase === 'hold' && "opacity-100",
            phase === 'exit' && "opacity-0"
          )}
        >
          <span className="inline-flex items-center gap-2">
            <span className="w-8 h-px bg-gradient-to-r from-transparent to-muted-foreground/50" />
            Master the art of Product
            <span className="w-8 h-px bg-gradient-to-l from-transparent to-muted-foreground/50" />
          </span>
        </p>

        {/* Belt progress indicator */}
        <div 
          className={cn(
            "mt-10 flex items-center gap-3 transition-all duration-500 delay-400",
            phase === 'enter' && "opacity-0 scale-90",
            phase === 'hold' && "opacity-100 scale-100",
            phase === 'exit' && "opacity-0 scale-110"
          )}
        >
          {/* Belt ranks */}
          {['white', 'yellow', 'orange', 'green', 'black'].map((belt, i) => (
            <div
              key={belt}
              className={cn(
                "w-10 h-2 rounded-full transition-all duration-300",
                beltProgress > (i + 1) * 20
                  ? "scale-100"
                  : "scale-75 opacity-40"
              )}
              style={{
                background: belt === 'white' 
                  ? 'hsl(var(--muted))' 
                  : belt === 'yellow'
                  ? '#facc15'
                  : belt === 'orange'
                  ? 'hsl(var(--primary))'
                  : belt === 'green'
                  ? '#22c55e'
                  : '#1a1a1a',
                boxShadow: beltProgress > (i + 1) * 20 
                  ? `0 0 12px ${belt === 'orange' ? 'hsl(var(--primary))' : belt === 'yellow' ? '#facc15' : belt === 'green' ? '#22c55e' : 'transparent'}`
                  : 'none',
                transitionDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom fade gradient for polish */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent transition-opacity duration-500",
          phase === 'exit' && "opacity-0"
        )}
      />

      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: -200% center; }
          50% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}
