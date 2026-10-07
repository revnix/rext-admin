"use client";

import { MotionConfig } from "motion/react";

interface MotionProviderProps {
  children: React.ReactNode;
}

/**
 * Motion settings for the whole app. `reducedMotion="user"` follows the
 * visitor's "reduce motion" setting: transform and layout animations are
 * switched off, while opacity and colour changes still run
 * (design/app-language.md §2.9; the default, "never", ignores the setting).
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
