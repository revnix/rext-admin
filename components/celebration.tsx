"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Celebration Component
 *
 * Shows a celebratory animation when onboarding milestones are completed.
 * Uses CSS animations for a lightweight, performant effect.
 *
 * @example
 * ```tsx
 * {isComplete && <Celebration onComplete={() => console.log('Done!')} />}
 * ```
 */

interface CelebrationProps {
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds
}

export function Celebration({ onComplete, duration = 3000 }: CelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* Backdrop with fade */}
      <div className="absolute inset-0 bg-background/80 animate-in fade-in duration-300" />

      {/* Center celebration message */}
      <div className="relative animate-in zoom-in-95 fade-in duration-500">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 backdrop-blur-sm">
          {/* Animated icon */}
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <Sparkles className="h-16 w-16 text-primary" />
            </div>
            <Sparkles className="h-16 w-16 text-primary animate-pulse" />
          </div>

          {/* Message */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              🎉 Congratulations!
            </h2>
            <p className="text-muted-foreground">
              You've completed your onboarding
            </p>
          </div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: decorative particles have no natural ID
            key={`particle-${i}`}
            className={cn(
              "absolute w-2 h-2 rounded-full bg-primary/40",
              "animate-float",
            )}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Compact celebration for milestone completion
 */
export function MilestoneCelebration({
  milestoneName,
  onComplete,
}: {
  milestoneName: string;
  onComplete?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 pointer-events-none z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary text-primary-foreground shadow-lg">
        <Sparkles className="h-5 w-5 animate-pulse" />
        <div>
          <p className="font-medium">Milestone Complete!</p>
          <p className="text-sm opacity-90">{milestoneName}</p>
        </div>
      </div>
    </div>
  );
}
