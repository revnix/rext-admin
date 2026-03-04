/**
 * Framer Motion animation variants and utilities for TypeForm-style components
 *
 * Provides consistent animation patterns across the TypeForm-like experience
 * with proper accessibility support and reduced motion preferences.
 */

import type { Transition, Variants } from "framer-motion";
import type { AnimationTiming } from "@/types/typeform";

// ============================================================================
// ANIMATION TIMING CONSTANTS
// ============================================================================

export const ANIMATION_TIMING: AnimationTiming = {
  fast: 0.1,
  normal: 0.15,
  slow: 0.25,
  celebration: 1.0,
} as const;

export const EASING = {
  easeInOut: [0.4, 0.0, 0.2, 1],
  easeOut: [0.0, 0.0, 0.2, 1],
  easeIn: [0.4, 0.0, 1, 1],
  spring: { type: "spring", stiffness: 300, damping: 30 },
  gentleSpring: { type: "spring", stiffness: 200, damping: 25 },
  anticipate: [0.175, 0.885, 0.32, 1.275],
} as const;

// ============================================================================
// OPTION CARD ANIMATIONS
// ============================================================================

export const optionCardVariants: Variants = {
  idle: {
    scale: 1,
    y: 0,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    borderWidth: "2px",
    borderColor: "hsl(var(--border))",
  },

  hover: {
    scale: 1.02,
    y: -2,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    borderColor: "hsl(var(--border))",
    transition: {
      duration: ANIMATION_TIMING.fast,
      ease: EASING.easeOut,
    },
  },

  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: EASING.easeInOut,
    },
  },

  selected: {
    scale: 1.02,
    boxShadow: "0 0 0 3px hsl(var(--primary) / 0.2)",
    borderColor: "hsl(var(--primary))",
    backgroundColor: "hsl(var(--primary) / 0.05)",
    transition: {
      ...EASING.spring,
    },
  },

  disabled: {
    opacity: 0.6,
    scale: 1,
    cursor: "not-allowed",
    transition: {
      duration: ANIMATION_TIMING.fast,
    },
  },
};

// ============================================================================
// SELECTION INDICATOR ANIMATIONS
// ============================================================================

export const selectionIndicatorVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
    rotate: -180,
  },

  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25,
      duration: ANIMATION_TIMING.normal,
    },
  },
};

// ============================================================================
// QUESTION TRANSITION ANIMATIONS
// ============================================================================

export const questionTransitionVariants: Variants = {
  enter: () => ({
    opacity: 0,
  }),

  center: {
    zIndex: 1,
    opacity: 1,
  },

  exit: () => ({
    zIndex: 0,
    opacity: 0,
  }),
};

export const questionTransition: Transition = {
  opacity: {
    duration: ANIMATION_TIMING.normal,
    ease: EASING.easeInOut,
  },
};

// ============================================================================
// QUESTION CONTENT STAGGERED ANIMATIONS
// ============================================================================

export const questionContentVariants: Variants = {
  hidden: { opacity: 0 },

  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },

  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const questionItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },

  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },

  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: ANIMATION_TIMING.fast,
    },
  },
};

// ============================================================================
// PROGRESS BAR ANIMATIONS
// ============================================================================

export const progressBarVariants: Variants = {
  initial: {
    width: "0%",
    opacity: 0,
  },

  animate: {
    width: "var(--progress-width)",
    opacity: 1,
    transition: {
      width: {
        duration: 0.4,
        ease: EASING.easeOut,
      },
      opacity: {
        duration: ANIMATION_TIMING.fast,
      },
    },
  },

  milestone: {
    boxShadow: [
      "0 0 0 rgba(59, 130, 246, 0)",
      "0 0 20px rgba(59, 130, 246, 0.4)",
      "0 0 0 rgba(59, 130, 246, 0)",
    ],
    transition: {
      duration: ANIMATION_TIMING.celebration,
      repeat: 2,
    },
  },
};

// ============================================================================
// CELEBRATION ANIMATIONS
// ============================================================================

export const celebrationVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
    y: 20,
  },

  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      duration: ANIMATION_TIMING.normal,
    },
  },

  confetti: {
    scale: [1, 1.1, 1],
    rotate: [0, 10, -10, 0],
    transition: {
      duration: ANIMATION_TIMING.celebration,
      repeat: 1,
    },
  },

  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: ANIMATION_TIMING.fast,
    },
  },
};

// ============================================================================
// BUTTON ANIMATIONS
// ============================================================================

export const buttonVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  hover: {
    scale: 1.05,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: {
      duration: ANIMATION_TIMING.fast,
      ease: EASING.easeOut,
    },
  },

  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },

  disabled: {
    opacity: 0.6,
    scale: 1,
    transition: {
      duration: ANIMATION_TIMING.fast,
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates reduced motion variants for accessibility
 */
export const createReducedMotionVariants = (variants: Variants): Variants => {
  const reduced: Variants = {};

  Object.keys(variants).forEach((key) => {
    const original = variants[key];
    if (typeof original === "object" && original !== null) {
      reduced[key] = {
        ...original,
        scale: 1, // Remove scaling
        x: 0, // Remove horizontal movement
        y: 0, // Remove vertical movement
        rotate: 0, // Remove rotation
        transition: {
          duration: 0.1, // Very fast transitions
        },
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

// Removed unused animationVariants aggregate, utilities (createStaggeredAnimation, createSpringAnimation), 
// and default export per TASK-267.
