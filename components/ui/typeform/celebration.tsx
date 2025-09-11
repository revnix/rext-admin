/**
 * TypeForm-style Celebration Component
 *
 * Provides delightful celebration animations and feedback for milestones,
 * completions, and selections. Includes confetti effects and success messages.
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Sparkles, Trophy } from "lucide-react";
import * as React from "react";
import {
  celebrationVariants,
  getMotionVariants,
  useReducedMotion,
} from "@/lib/animations";
import { announceToScreenReader, triggerConfetti } from "@/lib/typeform-utils";
import { cn } from "@/lib/utils";
import type { CelebrationProps } from "@/types/typeform";

// Confetti particle component
const ConfettiParticle: React.FC<{
  delay: number;
  duration: number;
  x: number;
  y: number;
  color: string;
}> = ({ delay, duration, x, y, color }) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      className={cn(
        "absolute w-2 h-2 rounded-full opacity-80",
        `bg-${color}-500`,
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
      initial={{
        scale: 0,
        rotate: 0,
        y: 0,
        x: 0,
        opacity: 0,
      }}
      animate={{
        scale: [0, 1, 1, 0],
        rotate: [0, 180, 360, 540],
        y: [-20, -60, -40, 20],
        x: [
          0,
          Math.random() * 40 - 20,
          Math.random() * 60 - 30,
          Math.random() * 80 - 40,
        ],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: duration,
        delay: delay,
        ease: "easeOut",
      }}
    />
  );
};

const Celebration = React.forwardRef<HTMLDivElement, CelebrationProps>(
  (
    {
      type = "selection",
      active = false,
      progress,
      message,
      duration = 2000,
      onComplete,
      className,
      ...props
    },
    ref,
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const motionVariants = getMotionVariants(
      celebrationVariants,
      prefersReducedMotion,
    );
    const floatIds = React.useMemo(
      () =>
        Array.from(
          { length: 6 },
          (_, i) => `float-${i}-${Math.random().toString(36).slice(2)}`,
        ),
      [],
    );

    // Get celebration content based on type
    const celebrationContent = React.useMemo(() => {
      switch (type) {
        case "milestone":
          return {
            icon: Trophy,
            title: "Great Progress!",
            subtitle: progress
              ? `${Math.round(progress)}% complete`
              : "Keep going!",
            colors: ["blue", "purple", "indigo"],
          };
        case "completion":
          return {
            icon: Check,
            title: "Completed!",
            subtitle: "Well done! 🎉",
            colors: ["green", "emerald", "teal"],
          };
        case "selection":
          return {
            icon: Heart,
            title: "Great Choice!",
            subtitle: message || "Looking good!",
            colors: ["pink", "rose", "red"],
          };
        default:
          return {
            icon: Sparkles,
            title: "Success!",
            subtitle: message || "Awesome!",
            colors: ["yellow", "orange", "amber"],
          };
      }
    }, [type, progress, message]);

    const { icon: Icon, title, subtitle, colors } = celebrationContent;

    // Trigger confetti and announcements when celebration becomes active
    React.useEffect(() => {
      if (!active) return;

      // Announce to screen readers
      announceToScreenReader(`${title}. ${subtitle}`);

      // Trigger confetti based on celebration type
      if (!prefersReducedMotion) {
        const confettiConfig = {
          particleCount:
            type === "completion" ? 100 : type === "milestone" ? 50 : 30,
          spread: type === "completion" ? 70 : 45,
          origin: { x: 0.5, y: 0.6 },
          colors: colors.map((color) => {
            // Convert Tailwind color names to hex values
            const colorMap: Record<string, string> = {
              blue: "#3b82f6",
              purple: "#8b5cf6",
              indigo: "#6366f1",
              green: "#10b981",
              emerald: "#059669",
              teal: "#14b8a6",
              pink: "#ec4899",
              rose: "#f43f5e",
              red: "#ef4444",
              yellow: "#eab308",
              orange: "#f97316",
              amber: "#f59e0b",
            };
            return colorMap[color] || "#3b82f6";
          }),
        };

        triggerConfetti(confettiConfig);
      }

      // Auto-complete after duration
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }, [
      active,
      duration,
      onComplete,
      type,
      prefersReducedMotion,
      title,
      subtitle,
      colors,
    ]);

    // Generate confetti particles
    const confettiParticles = React.useMemo(() => {
      if (prefersReducedMotion || type === "selection") return [];

      const particleCount = type === "completion" ? 20 : 12;
      return Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 0.5,
        x: 20 + Math.random() * 60,
        y: 30 + Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
    }, [type, colors, prefersReducedMotion]);

    return (
      <AnimatePresence>
        {active && (
          <motion.div
            ref={ref}
            className={cn(
              "fixed inset-0 z-50 flex items-center justify-center",
              "bg-background/80 backdrop-blur-sm",
              className,
            )}
            variants={motionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            {...props}
          >
            {/* Confetti Particles */}
            {confettiParticles.map((particle) => (
              <ConfettiParticle
                key={particle.id}
                delay={particle.delay}
                duration={particle.duration}
                x={particle.x}
                y={particle.y}
                color={particle.color}
              />
            ))}

            {/* Main Celebration Content */}
            <motion.div
              className={cn(
                "flex flex-col items-center text-center space-y-4",
                "bg-card border rounded-lg p-8 shadow-lg max-w-sm mx-4",
                "relative overflow-hidden",
              )}
              variants={motionVariants}
              animate={type === "completion" ? "confetti" : "visible"}
            >
              {/* Background Glow Effect */}
              <div
                className={cn(
                  "absolute inset-0 opacity-10 rounded-lg",
                  `bg-gradient-to-br from-${colors[0]}-500 to-${colors[1]}-500`,
                )}
                aria-hidden="true"
              />

              {/* Icon */}
              <motion.div
                className={cn(
                  "relative z-10 p-3 rounded-full",
                  `bg-${colors[0]}-100 text-${colors[0]}-600`,
                  `dark:bg-${colors[0]}-900/30 dark:text-${colors[0]}-400`,
                )}
                animate={
                  type === "completion"
                    ? { rotate: [0, -10, 10, -10, 10, 0] }
                    : { scale: [1, 1.1, 1] }
                }
                transition={{
                  duration: type === "completion" ? 0.6 : 0.3,
                  delay: 0.1,
                }}
              >
                <Icon className="w-8 h-8" />
              </motion.div>

              {/* Title */}
              <motion.h2
                className="relative z-10 text-xl font-bold text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {title}
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                className="relative z-10 text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {subtitle}
              </motion.p>

              {/* Progress Bar for Milestone */}
              {type === "milestone" && progress && (
                <motion.div
                  className="relative z-10 w-full max-w-xs"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        `bg-${colors[0]}-500`,
                      )}
                      initial={{ width: "0%" }}
                      animate={{ width: `${Math.round(progress)}%` }}
                      transition={{
                        duration: 1,
                        delay: 0.5,
                        ease: "easeOut",
                      }}
                    />
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-sm font-medium text-foreground">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Auto-dismiss indicator */}
              <motion.div
                className="relative z-10 text-xs text-muted-foreground/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: duration / 1000 - 0.5 }}
              >
                Continuing in {Math.round((duration - (duration - 500)) / 1000)}
                s...
              </motion.div>
            </motion.div>

            {/* Floating Elements for Completion */}
            {type === "completion" &&
              !prefersReducedMotion &&
              floatIds.map((id, i) => (
                <motion.div
                  key={id}
                  className={cn(
                    "absolute w-1 h-1 rounded-full opacity-60",
                    `bg-${colors[i % colors.length]}-500`,
                  )}
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                  }}
                  animate={{
                    y: [-10, -30, -10],
                    x: [0, Math.random() * 20 - 10, 0],
                    opacity: [0.6, 1, 0.6],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random(),
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);

Celebration.displayName = "Celebration";

export { Celebration };
export type { CelebrationProps };
