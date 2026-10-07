/**
 * Motion presets (design/app-language.md §10): only state changes move, at
 * 120 ms for hover and focus, 200 ms to open and close and 320 ms for a sheet,
 * with ease-out, and only transforms and opacity. `DURATION` and `EASE_OUT`
 * are the CSS tokens `--duration-*` and `--ease-out` in app/globals.css.
 */

import type { Variants } from "motion/react";

export const DURATION = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
} as const;

export const EASE_OUT = [0.2, 0, 0, 1] as const;

// ============================================================================
// STEP CHANGE
// ============================================================================

/**
 * A wizard's step change, for a keyed child of `<AnimatePresence mode="wait"
 * initial={false}>`: the new step fades in over 200 ms and the old one leaves
 * at once. `initial={false}` keeps the first step still on the first render.
 */
export const stepChangeVariants: Variants = {
  enter: { opacity: 0 },
  center: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
  exit: { opacity: 0, transition: { duration: 0 } },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Reduced motion shows every finished state at once (design/app-language.md
 * §10): no movement and no duration.
 */
export const createReducedMotionVariants = (variants: Variants): Variants => {
  const reduced: Variants = {};

  Object.keys(variants).forEach((key) => {
    const original = variants[key];
    if (typeof original === "object" && original !== null) {
      reduced[key] = {
        ...original,
        scale: 1,
        x: 0,
        y: 0,
        rotate: 0,
        transition: { duration: 0 },
      };
    } else {
      reduced[key] = original;
    }
  });

  return reduced;
};

/**
 * Gets animation variants based on user motion preferences
 */
export const getMotionVariants = (
  variants: Variants,
  prefersReducedMotion: boolean,
): Variants => {
  return prefersReducedMotion
    ? createReducedMotionVariants(variants)
    : variants;
};

/**
 * Custom hook for detecting reduced motion preference
 */
export const useReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * The variants as given, or, for a visitor who asked for reduced motion, with
 * every finished state at once.
 */
export const useMotionVariants = (variants: Variants): Variants =>
  getMotionVariants(variants, useReducedMotion());
