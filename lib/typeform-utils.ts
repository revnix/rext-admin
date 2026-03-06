/**
 * TypeForm Visual Interaction Utilities
 *
 * Utility functions for managing TypeForm-style visual interactions,
 * microinteractions, and feedback patterns.
 */

import confetti from "canvas-confetti";

// ============================================================================
// VISUAL FEEDBACK UTILITIES
// ============================================================================

/**
 * Configuration for visual feedback effects
 */
export interface VisualFeedbackConfig {
  duration?: number;
  intensity?: "subtle" | "normal" | "strong";
  delay?: number;
}

/**
 * Applies shake animation to an element for error feedback
 */
export const triggerShakeAnimation = (
  element: HTMLElement,
  config: VisualFeedbackConfig = {},
): void => {
  const { duration = 400 } = config;

  element.classList.add("typeform-shake");

  setTimeout(() => {
    element.classList.remove("typeform-shake");
  }, duration);
};

/**
 * Applies bounce-in animation for positive feedback
 */
export const triggerBounceInAnimation = (
  element: HTMLElement,
  config: VisualFeedbackConfig = {},
): void => {
  const { duration = 600 } = config;

  element.classList.add("typeform-bounce-in");

  setTimeout(() => {
    element.classList.remove("typeform-bounce-in");
  }, duration);
};

/**
 * Applies success pulse animation
 */
export const triggerSuccessPulse = (
  element: HTMLElement,
  config: VisualFeedbackConfig = {},
): void => {
  const { duration = 1500 } = config;

  element.classList.add("typeform-pulse-success");

  setTimeout(() => {
    element.classList.remove("typeform-pulse-success");
  }, duration);
};

/**
 * Applies glow effect based on intensity
 */
export const applyGlowEffect = (
  element: HTMLElement,
  intensity: "normal" | "strong" = "normal",
): void => {
  element.classList.remove(
    "typeform-glow-effect",
    "typeform-glow-effect-strong",
  );

  if (intensity === "strong") {
    element.classList.add("typeform-glow-effect-strong");
  } else {
    element.classList.add("typeform-glow-effect");
  }
};

/**
 * Removes all glow effects
 */
export const removeGlowEffect = (element: HTMLElement): void => {
  element.classList.remove(
    "typeform-glow-effect",
    "typeform-glow-effect-strong",
  );
};

// ============================================================================
// MICROINTERACTION UTILITIES
// ============================================================================

/**
 * Configuration for option selection microinteractions
 */
export interface SelectionMicrointeractionConfig {
  showVisualFeedback?: boolean;
  hapticFeedback?: boolean;
  soundFeedback?: boolean;
  animationDuration?: number;
}

/**
 * Handles option card selection with comprehensive feedback
 */
export const handleOptionSelection = (
  element: HTMLElement,
  isSelected: boolean,
  config: SelectionMicrointeractionConfig = {},
): void => {
  const {
    showVisualFeedback = true,
    hapticFeedback = true,
    animationDuration = 300,
  } = config;

  if (showVisualFeedback) {
    if (isSelected) {
      element.classList.add("typeform-card-selected");
      triggerBounceInAnimation(element, { duration: animationDuration });
    } else {
      element.classList.remove("typeform-card-selected");
    }
  }

  // Haptic feedback for mobile devices
  if (hapticFeedback && "vibrate" in navigator) {
    navigator.vibrate(50);
  }
};

/**
 * Handles validation error display with animations
 */
export const showValidationError = (
  element: HTMLElement,
  _errorMessage?: string,
): void => {
  element.classList.add("typeform-card-error");
  triggerShakeAnimation(element);

  // Focus for screen readers
  if (element.getAttribute("role") === "option") {
    element.focus();
  }
};

/**
 * Clears validation error state
 */
export const clearValidationError = (element: HTMLElement): void => {
  element.classList.remove("typeform-card-error");
};

/**
 * Shows loading state for async operations
 */
export const showLoadingState = (element: HTMLElement): void => {
  element.classList.add("typeform-card-loading");
};

/**
 * Hides loading state
 */
export const hideLoadingState = (element: HTMLElement): void => {
  element.classList.remove("typeform-card-loading");
};

// ============================================================================
// PROGRESS CELEBRATION UTILITIES
// ============================================================================

/**
 * Configuration for milestone celebrations
 */
export interface MilestoneCelebrationConfig {
  type: "progress" | "completion" | "perfect-score";
  intensity: "subtle" | "normal" | "exciting";
  showConfetti?: boolean;
  customMessage?: string;
  duration?: number;
}

/**
 * Triggers milestone celebration effects
 */
export const celebrateMilestone = async (
  config: MilestoneCelebrationConfig,
): Promise<void> => {
  const { type, intensity, showConfetti = true, duration = 2000 } = config;

  if (showConfetti) {
    const confettiConfig = getConfettiConfigForMilestone(type, intensity);
    await triggerConfetti(confettiConfig);
  }

  // Additional celebration effects can be added here
  if (intensity === "exciting") {
    // Trigger screen-wide celebration
    document.body.classList.add("typeform-celebration-active");
    setTimeout(() => {
      document.body.classList.remove("typeform-celebration-active");
    }, duration);
  }
};

/**
 * Configuration for confetti effects
 */
export interface ConfettiConfig {
  particleCount?: number;
  angle?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  colors?: string[];
  origin?: { x: number; y: number };
}

function resolveParticleCountForIntensity(
  intensity: "subtle" | "normal" | "exciting",
  subtle: number,
  normal: number,
  exciting: number,
): number {
  if (intensity === "subtle") return subtle;
  if (intensity === "normal") return normal;
  return exciting;
}

/**
 * Gets confetti configuration based on celebration type
 */
export const getConfettiConfigForMilestone = (
  type: "progress" | "completion" | "perfect-score",
  intensity: "subtle" | "normal" | "exciting",
): ConfettiConfig => {
  const baseConfig: ConfettiConfig = {
    colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
    decay: 0.94,
    startVelocity: 30,
  };

  switch (type) {
    case "progress":
      return {
        ...baseConfig,
        particleCount: resolveParticleCountForIntensity(intensity, 15, 30, 60),
        angle: 90,
        spread: 30,
        origin: { x: 0.5, y: 0.3 },
      };

    case "completion":
      return {
        ...baseConfig,
        particleCount: resolveParticleCountForIntensity(intensity, 30, 60, 120),
        angle: 90,
        spread: 45,
        origin: { x: 0.5, y: 0.5 },
      };

    case "perfect-score":
      return {
        ...baseConfig,
        particleCount: resolveParticleCountForIntensity(
          intensity,
          50,
          100,
          200,
        ),
        angle: 90,
        spread: 70,
        startVelocity: 45,
        origin: { x: 0.5, y: 0.6 },
      };

    default:
      return baseConfig;
  }
};

/**
 * Triggers confetti with given configuration
 */
export const triggerConfetti = async (
  config: ConfettiConfig,
): Promise<void> => {
  return new Promise((resolve) => {
    confetti({
      ...config,
      zIndex: 9999,
    });

    // Resolve after animation completes
    setTimeout(resolve, 1000);
  });
};

// ============================================================================
// ENCOURAGING MESSAGE UTILITIES
// ============================================================================

/**
 * Collection of encouraging messages for different contexts
 */
export const ENCOURAGING_MESSAGES = {
  selection: [
    "Great choice!",
    "Perfect!",
    "Excellent!",
    "Nice pick!",
    "Wonderful!",
    "Outstanding!",
    "Brilliant!",
  ],

  progress: [
    "You're doing great!",
    "Keep going!",
    "Almost there!",
    "Fantastic progress!",
    "You're on fire!",
    "Looking good!",
    "Way to go!",
  ],

  completion: [
    "Amazing work!",
    "You did it!",
    "Fantastic!",
    "Mission accomplished!",
    "Well done!",
    "Incredible!",
    "You're a star!",
  ],
} as const;

/**
 * Gets a random encouraging message for the given context
 */
export const getEncouragingMessage = (
  context: keyof typeof ENCOURAGING_MESSAGES,
): string => {
  const messages = ENCOURAGING_MESSAGES[context];
  return messages[Math.floor(Math.random() * messages.length)];
};

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

/**
 * Announces important changes to screen readers
 */
export const announceToScreenReader = (message: string): void => {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Checks if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Conditionally applies animation based on user preferences
 */
export const conditionallyAnimate = (
  _element: HTMLElement,
  animationFunction: () => void,
): void => {
  if (!prefersReducedMotion()) {
    animationFunction();
  }
};

// ============================================================================
// TOUCH AND GESTURE UTILITIES
// ============================================================================

/**
 * Makes element touch-friendly with proper sizing and feedback
 */
export const makeTouchFriendly = (element: HTMLElement): void => {
  // Ensure minimum touch target size (44px)
  const computedStyle = window.getComputedStyle(element);
  const height = parseInt(computedStyle.height, 10);

  if (height < 44) {
    element.style.minHeight = "44px";
  }

  // Add touch feedback classes if not present
  if (!element.classList.contains("typeform-card-interactive")) {
    element.classList.add("typeform-card-interactive");
  }
};

/**
 * Configuration for gesture handling
 */
export interface GestureConfig {
  onTap?: (event: Event) => void;
  onDoubleTap?: (event: Event) => void;
  onLongPress?: (event: Event) => void;
  longPressDuration?: number;
}

/**
 * Adds gesture handling to an element
 */
export const addGestureHandling = (
  element: HTMLElement,
  config: GestureConfig,
): (() => void) => {
  const { onTap, onDoubleTap, onLongPress, longPressDuration = 500 } = config;

  let tapCount = 0;
  let tapTimer: number | null = null;
  let longPressTimer: number | null = null;

  const handleTouchStart = (event: TouchEvent) => {
    if (onLongPress) {
      longPressTimer = window.setTimeout(() => {
        onLongPress(event);
      }, longPressDuration);
    }
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    tapCount++;

    if (tapCount === 1) {
      tapTimer = window.setTimeout(() => {
        if (onTap) onTap(event);
        tapCount = 0;
      }, 300);
    } else if (tapCount === 2) {
      if (tapTimer) clearTimeout(tapTimer);
      if (onDoubleTap) onDoubleTap(event);
      tapCount = 0;
    }
  };

  element.addEventListener("touchstart", handleTouchStart, { passive: true });
  element.addEventListener("touchend", handleTouchEnd, { passive: true });

  // Return cleanup function
  return () => {
    element.removeEventListener("touchstart", handleTouchStart);
    element.removeEventListener("touchend", handleTouchEnd);
    if (tapTimer) clearTimeout(tapTimer);
    if (longPressTimer) clearTimeout(longPressTimer);
  };
};

// ============================================================================
// THEME UTILITIES
// ============================================================================

/**
 * Gets current theme (light/dark) from document
 */
export const getCurrentTheme = (): "light" | "dark" => {
  if (typeof document === "undefined") return "light";

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

/**
 * Gets theme-appropriate colors for animations
 */
export const getThemeColors = (): {
  primary: string;
  success: string;
  warning: string;
  error: string;
} => {
  const theme = getCurrentTheme();

  if (theme === "dark") {
    return {
      primary: "#6366f1",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
    };
  }

  return {
    primary: "#3b82f6",
    success: "#059669",
    warning: "#d97706",
    error: "#dc2626",
  };
};

export default {
  triggerShakeAnimation,
  triggerBounceInAnimation,
  triggerSuccessPulse,
  applyGlowEffect,
  removeGlowEffect,
  handleOptionSelection,
  showValidationError,
  clearValidationError,
  showLoadingState,
  hideLoadingState,
  celebrateMilestone,
  triggerConfetti,
  getEncouragingMessage,
  announceToScreenReader,
  prefersReducedMotion,
  conditionallyAnimate,
  makeTouchFriendly,
  addGestureHandling,
  getCurrentTheme,
  getThemeColors,
};
