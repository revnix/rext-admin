/**
 * TypeForm-style Celebration Component
 *
 * Provides delightful celebration animations and feedback for milestones,
 * completions, and selections. Includes confetti effects and success messages.
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, PartyPopper, Sparkles, Trophy } from "lucide-react";
import * as React from "react";
import { MOTION_DURATION, useReducedMotion } from "@/lib/animations";
import { celebrationVariants, useTypeformMotionVariants } from "./motion";
import { announceToScreenReader, triggerConfetti } from "@/lib/typeform-utils";
import { cn } from "@/lib/utils";
import type { CelebrationProps } from "@/types/typeform";

function resolveConfettiParticleCount(
  type: "completion" | "milestone" | "selection",
): number {
  if (type === "completion") return 100;
  if (type === "milestone") return 50;
  return 30;
}

function resolveConfettiSpread(
  type: "completion" | "milestone" | "selection",
): number {
  if (type === "completion") return 70;
  return 45;
}

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
    const motionVariants = useTypeformMotionVariants(celebrationVariants);
    // Completion timeout ref for cleanup
    const completionTimeoutRef = React.useRef<number | null>(null);

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
            subtitle: "Well done!",
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
          particleCount: resolveConfettiParticleCount(type),
          spread: resolveConfettiSpread(type),
          origin: { x: 0.5, y: 0.6 },
          colors: colors.map((color) => {
            // Convert Tailwind color names to hex values
            const colorMap: Record<string, string> = {
              blue: "#3641f5", // Brand.600
              purple: "#6938ef", // Purple.600
              indigo: "#444ce7", // Indigo.600
              green: "#12b76a", // Success.500
              emerald: "#039855", // Success.600
              teal: "#14b8a6", // Teal standard
              pink: "#dd2590", // Pink.600
              rose: "#ee46bc", // Pink.500
              red: "#f04438", // Error.500
              yellow: "#f79009", // Warning.500
              orange: "#dc6803", // Warning.600
              amber: "#f59e0b", // Warning standard
            };
            return colorMap[color] || "#3b82f6";
          }),
        };

        triggerConfetti(confettiConfig);
      }

      // Clear any existing timeout before creating a new one
      if (completionTimeoutRef.current !== null) {
        window.clearTimeout(completionTimeoutRef.current);
      }

      // Auto-complete after duration
      completionTimeoutRef.current = window.setTimeout(() => {
        onComplete?.();
        completionTimeoutRef.current = null;
      }, duration);

      return () => {
        if (completionTimeoutRef.current !== null) {
          window.clearTimeout(completionTimeoutRef.current);
          completionTimeoutRef.current = null;
        }
      };
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
        duration: MOTION_DURATION.shimmer + Math.random() * 0.5,
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
                "bg-card border rounded-md p-8 shadow-lg max-w-sm mx-4",
                "relative overflow-hidden",
              )}
              variants={motionVariants}
              animate={type === "completion" ? "confetti" : "visible"}
            >
              {/* Background Glow Effect */}
              <div
                className={cn(
                  "absolute inset-0 opacity-10 rounded-md",
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
                  duration:
                    type === "completion"
                      ? MOTION_DURATION.medium
                      : MOTION_DURATION.veryFast,
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
                transition={{ duration: MOTION_DURATION.veryFast, delay: 0.2 }}
              >
                {title}
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                className="relative z-10 flex items-center gap-1 text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: MOTION_DURATION.veryFast, delay: 0.3 }}
              >
                <span>{subtitle}</span>
                {type === "completion" ? (
                  <PartyPopper className="h-4 w-4" aria-hidden="true" />
                ) : null}
              </motion.p>

              {/* Progress Bar for Milestone */}
              {type === "milestone" && progress && (
                <motion.div
                  className="relative z-10 w-full max-w-xs"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: MOTION_DURATION.veryFast,
                    delay: 0.4,
                  }}
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
                        duration: MOTION_DURATION.long,
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
                    duration: MOTION_DURATION.floating + Math.random(),
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
