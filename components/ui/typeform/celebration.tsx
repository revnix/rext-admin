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

const COLOR_CLASS_MAP = {
  blue: {
    particle: "bg-blue-500",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    bar: "bg-blue-500",
  },
  purple: {
    particle: "bg-purple-500",
    icon: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    bar: "bg-purple-500",
  },
  indigo: {
    particle: "bg-indigo-500",
    icon: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    bar: "bg-indigo-500",
  },
  green: {
    particle: "bg-green-500",
    icon: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    bar: "bg-green-500",
  },
  emerald: {
    particle: "bg-emerald-500",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  teal: {
    particle: "bg-teal-500",
    icon: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
    bar: "bg-teal-500",
  },
  pink: {
    particle: "bg-pink-500",
    icon: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    bar: "bg-pink-500",
  },
  rose: {
    particle: "bg-rose-500",
    icon: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    bar: "bg-rose-500",
  },
  red: {
    particle: "bg-red-500",
    icon: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    bar: "bg-red-500",
  },
  yellow: {
    particle: "bg-yellow-500",
    icon: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    bar: "bg-yellow-500",
  },
  orange: {
    particle: "bg-orange-500",
    icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    bar: "bg-orange-500",
  },
  amber: {
    particle: "bg-amber-500",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    bar: "bg-amber-500",
  },
} as const;

type CelebrationColor = keyof typeof COLOR_CLASS_MAP;

const GRADIENT_CLASS_MAP: Record<CelebrationColor, Record<CelebrationColor, string>> = {
  blue: {
    blue: "bg-gradient-to-br from-blue-500 to-blue-500",
    purple: "bg-gradient-to-br from-blue-500 to-purple-500",
    indigo: "bg-gradient-to-br from-blue-500 to-indigo-500",
    green: "bg-gradient-to-br from-blue-500 to-green-500",
    emerald: "bg-gradient-to-br from-blue-500 to-emerald-500",
    teal: "bg-gradient-to-br from-blue-500 to-teal-500",
    pink: "bg-gradient-to-br from-blue-500 to-pink-500",
    rose: "bg-gradient-to-br from-blue-500 to-rose-500",
    red: "bg-gradient-to-br from-blue-500 to-red-500",
    yellow: "bg-gradient-to-br from-blue-500 to-yellow-500",
    orange: "bg-gradient-to-br from-blue-500 to-orange-500",
    amber: "bg-gradient-to-br from-blue-500 to-amber-500",
  },
  purple: {
    blue: "bg-gradient-to-br from-purple-500 to-blue-500",
    purple: "bg-gradient-to-br from-purple-500 to-purple-500",
    indigo: "bg-gradient-to-br from-purple-500 to-indigo-500",
    green: "bg-gradient-to-br from-purple-500 to-green-500",
    emerald: "bg-gradient-to-br from-purple-500 to-emerald-500",
    teal: "bg-gradient-to-br from-purple-500 to-teal-500",
    pink: "bg-gradient-to-br from-purple-500 to-pink-500",
    rose: "bg-gradient-to-br from-purple-500 to-rose-500",
    red: "bg-gradient-to-br from-purple-500 to-red-500",
    yellow: "bg-gradient-to-br from-purple-500 to-yellow-500",
    orange: "bg-gradient-to-br from-purple-500 to-orange-500",
    amber: "bg-gradient-to-br from-purple-500 to-amber-500",
  },
  indigo: {
    blue: "bg-gradient-to-br from-indigo-500 to-blue-500",
    purple: "bg-gradient-to-br from-indigo-500 to-purple-500",
    indigo: "bg-gradient-to-br from-indigo-500 to-indigo-500",
    green: "bg-gradient-to-br from-indigo-500 to-green-500",
    emerald: "bg-gradient-to-br from-indigo-500 to-emerald-500",
    teal: "bg-gradient-to-br from-indigo-500 to-teal-500",
    pink: "bg-gradient-to-br from-indigo-500 to-pink-500",
    rose: "bg-gradient-to-br from-indigo-500 to-rose-500",
    red: "bg-gradient-to-br from-indigo-500 to-red-500",
    yellow: "bg-gradient-to-br from-indigo-500 to-yellow-500",
    orange: "bg-gradient-to-br from-indigo-500 to-orange-500",
    amber: "bg-gradient-to-br from-indigo-500 to-amber-500",
  },
  green: {
    blue: "bg-gradient-to-br from-green-500 to-blue-500",
    purple: "bg-gradient-to-br from-green-500 to-purple-500",
    indigo: "bg-gradient-to-br from-green-500 to-indigo-500",
    green: "bg-gradient-to-br from-green-500 to-green-500",
    emerald: "bg-gradient-to-br from-green-500 to-emerald-500",
    teal: "bg-gradient-to-br from-green-500 to-teal-500",
    pink: "bg-gradient-to-br from-green-500 to-pink-500",
    rose: "bg-gradient-to-br from-green-500 to-rose-500",
    red: "bg-gradient-to-br from-green-500 to-red-500",
    yellow: "bg-gradient-to-br from-green-500 to-yellow-500",
    orange: "bg-gradient-to-br from-green-500 to-orange-500",
    amber: "bg-gradient-to-br from-green-500 to-amber-500",
  },
  emerald: {
    blue: "bg-gradient-to-br from-emerald-500 to-blue-500",
    purple: "bg-gradient-to-br from-emerald-500 to-purple-500",
    indigo: "bg-gradient-to-br from-emerald-500 to-indigo-500",
    green: "bg-gradient-to-br from-emerald-500 to-green-500",
    emerald: "bg-gradient-to-br from-emerald-500 to-emerald-500",
    teal: "bg-gradient-to-br from-emerald-500 to-teal-500",
    pink: "bg-gradient-to-br from-emerald-500 to-pink-500",
    rose: "bg-gradient-to-br from-emerald-500 to-rose-500",
    red: "bg-gradient-to-br from-emerald-500 to-red-500",
    yellow: "bg-gradient-to-br from-emerald-500 to-yellow-500",
    orange: "bg-gradient-to-br from-emerald-500 to-orange-500",
    amber: "bg-gradient-to-br from-emerald-500 to-amber-500",
  },
  teal: {
    blue: "bg-gradient-to-br from-teal-500 to-blue-500",
    purple: "bg-gradient-to-br from-teal-500 to-purple-500",
    indigo: "bg-gradient-to-br from-teal-500 to-indigo-500",
    green: "bg-gradient-to-br from-teal-500 to-green-500",
    emerald: "bg-gradient-to-br from-teal-500 to-emerald-500",
    teal: "bg-gradient-to-br from-teal-500 to-teal-500",
    pink: "bg-gradient-to-br from-teal-500 to-pink-500",
    rose: "bg-gradient-to-br from-teal-500 to-rose-500",
    red: "bg-gradient-to-br from-teal-500 to-red-500",
    yellow: "bg-gradient-to-br from-teal-500 to-yellow-500",
    orange: "bg-gradient-to-br from-teal-500 to-orange-500",
    amber: "bg-gradient-to-br from-teal-500 to-amber-500",
  },
  pink: {
    blue: "bg-gradient-to-br from-pink-500 to-blue-500",
    purple: "bg-gradient-to-br from-pink-500 to-purple-500",
    indigo: "bg-gradient-to-br from-pink-500 to-indigo-500",
    green: "bg-gradient-to-br from-pink-500 to-green-500",
    emerald: "bg-gradient-to-br from-pink-500 to-emerald-500",
    teal: "bg-gradient-to-br from-pink-500 to-teal-500",
    pink: "bg-gradient-to-br from-pink-500 to-pink-500",
    rose: "bg-gradient-to-br from-pink-500 to-rose-500",
    red: "bg-gradient-to-br from-pink-500 to-red-500",
    yellow: "bg-gradient-to-br from-pink-500 to-yellow-500",
    orange: "bg-gradient-to-br from-pink-500 to-orange-500",
    amber: "bg-gradient-to-br from-pink-500 to-amber-500",
  },
  rose: {
    blue: "bg-gradient-to-br from-rose-500 to-blue-500",
    purple: "bg-gradient-to-br from-rose-500 to-purple-500",
    indigo: "bg-gradient-to-br from-rose-500 to-indigo-500",
    green: "bg-gradient-to-br from-rose-500 to-green-500",
    emerald: "bg-gradient-to-br from-rose-500 to-emerald-500",
    teal: "bg-gradient-to-br from-rose-500 to-teal-500",
    pink: "bg-gradient-to-br from-rose-500 to-pink-500",
    rose: "bg-gradient-to-br from-rose-500 to-rose-500",
    red: "bg-gradient-to-br from-rose-500 to-red-500",
    yellow: "bg-gradient-to-br from-rose-500 to-yellow-500",
    orange: "bg-gradient-to-br from-rose-500 to-orange-500",
    amber: "bg-gradient-to-br from-rose-500 to-amber-500",
  },
  red: {
    blue: "bg-gradient-to-br from-red-500 to-blue-500",
    purple: "bg-gradient-to-br from-red-500 to-purple-500",
    indigo: "bg-gradient-to-br from-red-500 to-indigo-500",
    green: "bg-gradient-to-br from-red-500 to-green-500",
    emerald: "bg-gradient-to-br from-red-500 to-emerald-500",
    teal: "bg-gradient-to-br from-red-500 to-teal-500",
    pink: "bg-gradient-to-br from-red-500 to-pink-500",
    rose: "bg-gradient-to-br from-red-500 to-rose-500",
    red: "bg-gradient-to-br from-red-500 to-red-500",
    yellow: "bg-gradient-to-br from-red-500 to-yellow-500",
    orange: "bg-gradient-to-br from-red-500 to-orange-500",
    amber: "bg-gradient-to-br from-red-500 to-amber-500",
  },
  yellow: {
    blue: "bg-gradient-to-br from-yellow-500 to-blue-500",
    purple: "bg-gradient-to-br from-yellow-500 to-purple-500",
    indigo: "bg-gradient-to-br from-yellow-500 to-indigo-500",
    green: "bg-gradient-to-br from-yellow-500 to-green-500",
    emerald: "bg-gradient-to-br from-yellow-500 to-emerald-500",
    teal: "bg-gradient-to-br from-yellow-500 to-teal-500",
    pink: "bg-gradient-to-br from-yellow-500 to-pink-500",
    rose: "bg-gradient-to-br from-yellow-500 to-rose-500",
    red: "bg-gradient-to-br from-yellow-500 to-red-500",
    yellow: "bg-gradient-to-br from-yellow-500 to-yellow-500",
    orange: "bg-gradient-to-br from-yellow-500 to-orange-500",
    amber: "bg-gradient-to-br from-yellow-500 to-amber-500",
  },
  orange: {
    blue: "bg-gradient-to-br from-orange-500 to-blue-500",
    purple: "bg-gradient-to-br from-orange-500 to-purple-500",
    indigo: "bg-gradient-to-br from-orange-500 to-indigo-500",
    green: "bg-gradient-to-br from-orange-500 to-green-500",
    emerald: "bg-gradient-to-br from-orange-500 to-emerald-500",
    teal: "bg-gradient-to-br from-orange-500 to-teal-500",
    pink: "bg-gradient-to-br from-orange-500 to-pink-500",
    rose: "bg-gradient-to-br from-orange-500 to-rose-500",
    red: "bg-gradient-to-br from-orange-500 to-red-500",
    yellow: "bg-gradient-to-br from-orange-500 to-yellow-500",
    orange: "bg-gradient-to-br from-orange-500 to-orange-500",
    amber: "bg-gradient-to-br from-orange-500 to-amber-500",
  },
  amber: {
    blue: "bg-gradient-to-br from-amber-500 to-blue-500",
    purple: "bg-gradient-to-br from-amber-500 to-purple-500",
    indigo: "bg-gradient-to-br from-amber-500 to-indigo-500",
    green: "bg-gradient-to-br from-amber-500 to-green-500",
    emerald: "bg-gradient-to-br from-amber-500 to-emerald-500",
    teal: "bg-gradient-to-br from-amber-500 to-teal-500",
    pink: "bg-gradient-to-br from-amber-500 to-pink-500",
    rose: "bg-gradient-to-br from-amber-500 to-rose-500",
    red: "bg-gradient-to-br from-amber-500 to-red-500",
    yellow: "bg-gradient-to-br from-amber-500 to-yellow-500",
    orange: "bg-gradient-to-br from-amber-500 to-orange-500",
    amber: "bg-gradient-to-br from-amber-500 to-amber-500",
  },
};

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
        COLOR_CLASS_MAP[color as CelebrationColor]?.particle ?? "bg-blue-500",
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

    const safeColors = colors as CelebrationColor[];
    const primaryColor = safeColors[0] ?? "blue";
    const secondaryColor = safeColors[1] ?? primaryColor;

    const iconClass = COLOR_CLASS_MAP[primaryColor].icon;
    const progressBarClass = COLOR_CLASS_MAP[primaryColor].bar;
    const gradientClass = GRADIENT_CLASS_MAP[primaryColor][secondaryColor];
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
                  gradientClass,
                )}
                aria-hidden="true"
              />

              {/* Icon */}
              <motion.div
                className={cn(
                  "relative z-10 p-3 rounded-full",
                  iconClass,
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
                        progressBarClass,
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
                    COLOR_CLASS_MAP[colors[i % colors.length] as CelebrationColor]?.particle ?? "bg-blue-500",
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
