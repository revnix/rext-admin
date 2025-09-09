/**
 * TypeScript types for TypeForm-style visual components and design system
 *
 * This module defines all types needed for the TypeForm-like UI components
 * including option cards, question layouts, progress indicators, and celebrations.
 */

import type { LucideIcon } from "lucide-react";
import type * as React from "react";

// ============================================================================
// VISUAL COMPONENT TYPES
// ============================================================================

/**
 * Props for TypeForm-style option cards
 */
export interface OptionCardProps {
  /** Unique identifier for the option */
  value: string;

  /** Display label for the option */
  label: string;

  /** Optional description text */
  description?: string;

  /** Icon component (Lucide React icon) */
  icon?: LucideIcon;

  /** Whether this option is currently selected */
  selected?: boolean;

  /** Whether this option is disabled */
  disabled?: boolean;

  /** Click handler */
  onClick?: (value: string) => void;

  /** Additional CSS classes */
  className?: string;

  /** Size variant */
  size?: "sm" | "md" | "lg";

  /** Visual variant */
  variant?: "default" | "compact" | "detailed";

  /** Whether to show selection indicator */
  showSelection?: boolean;

  /** Whether to animate on select */
  animateOnSelect?: boolean;

  /** ARIA label override */
  "aria-label"?: string;
}

/**
 * Props for TypeForm-style question cards
 */
export interface QuestionCardProps {
  /** Main question title */
  title: string;

  /** Optional subtitle/description */
  description?: string;

  /** Question content */
  children: React.ReactNode;

  /** Whether this question is required */
  required?: boolean;

  /** Error message to display */
  error?: string;

  /** Help text below the question */
  helpText?: string;

  /** Additional CSS classes */
  className?: string;

  /** Question ID for accessibility */
  questionId?: string;

  /** Progress information */
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
}

/**
 * Props for animated progress bar
 */
export interface ProgressBarProps {
  /** Current progress percentage (0-100) */
  progress: number;

  /** Current step number */
  currentStep?: number;

  /** Total number of steps */
  totalSteps?: number;

  /** Show step counter text */
  showStepCounter?: boolean;

  /** Show time estimate */
  showTimeEstimate?: boolean;

  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;

  /** Additional CSS classes */
  className?: string;

  /** Whether to animate progress changes */
  animated?: boolean;

  /** Callback when milestone is reached */
  onMilestone?: (milestone: number) => void;
}

/**
 * Props for celebration components
 */
export interface CelebrationProps {
  /** Type of celebration */
  type: "milestone" | "completion" | "selection";

  /** Whether celebration is active */
  active?: boolean;

  /** Progress percentage for milestone celebrations */
  progress?: number;

  /** Custom message to display */
  message?: string;

  /** Duration of celebration in milliseconds */
  duration?: number;

  /** Callback when celebration completes */
  onComplete?: () => void;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// ICON MAPPING TYPES
// ============================================================================

/**
 * Icon mapping for different option categories
 */
export interface IconMapping {
  /** Industry icons */
  industries: Record<string, LucideIcon>;

  /** Content type icons */
  contentTypes: Record<string, LucideIcon>;

  /** Platform icons */
  platforms: Record<string, LucideIcon>;

  /** Audience icons */
  audiences: Record<string, LucideIcon>;

  /** Purpose icons */
  purposes: Record<string, LucideIcon>;

  /** Tone icons */
  tones: Record<string, LucideIcon>;

  /** Default/fallback icons */
  defaults: {
    industry: LucideIcon;
    contentType: LucideIcon;
    platform: LucideIcon;
    audience: LucideIcon;
    purpose: LucideIcon;
    tone: LucideIcon;
    other: LucideIcon;
  };
}

/**
 * Icon resolver function type
 */
export type IconResolver = (
  category: keyof IconMapping,
  key: string,
) => LucideIcon;

// ============================================================================
// ANIMATION TYPES
// ============================================================================

/**
 * Animation variant types for Framer Motion
 */
export interface AnimationVariants {
  /** Option card animations */
  optionCard: {
    idle: object;
    hover: object;
    tap: object;
    selected: object;
    disabled: object;
  };

  /** Question transition animations */
  questionTransition: {
    enter: object;
    center: object;
    exit: object;
  };

  /** Progress bar animations */
  progressBar: {
    initial: object;
    animate: object;
    milestone: object;
  };

  /** Celebration animations */
  celebration: {
    hidden: object;
    visible: object;
    confetti: object;
  };

  /** Selection indicator animations */
  selectionIndicator: {
    hidden: object;
    visible: object;
  };
}

/**
 * Animation timing configuration
 */
export interface AnimationTiming {
  /** Fast micro-interactions */
  fast: number;

  /** Normal transitions */
  normal: number;

  /** Slower dramatic effects */
  slow: number;

  /** Celebration duration */
  celebration: number;
}

// ============================================================================
// DESIGN SYSTEM TYPES
// ============================================================================

/**
 * TypeForm color palette configuration
 */
export interface TypeFormColorPalette {
  /** Primary colors */
  primary: {
    50: string;
    100: string;
    500: string;
    600: string;
    900: string;
  };

  /** Success colors */
  success: {
    50: string;
    100: string;
    500: string;
    600: string;
  };

  /** Warning colors */
  warning: {
    50: string;
    100: string;
    500: string;
    600: string;
  };

  /** Neutral colors */
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    500: string;
    700: string;
    900: string;
  };
}

/**
 * Typography scale for TypeForm components
 */
export interface TypeFormTypography {
  /** Question titles */
  questionTitle: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };

  /** Question descriptions */
  questionDescription: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };

  /** Option labels */
  optionLabel: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };

  /** Helper text */
  helperText: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };
}

/**
 * Spacing scale for TypeForm components
 */
export interface TypeFormSpacing {
  /** Question title bottom margin */
  questionTitleMargin: string;

  /** Minimum padding between elements */
  minPadding: string;

  /** Option card gap */
  optionGap: string;

  /** Container max width */
  containerMaxWidth: string;

  /** Container padding */
  containerPadding: {
    mobile: string;
    desktop: string;
  };
}

/**
 * Responsive breakpoints
 */
export interface TypeFormBreakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
  large: string;
}

/**
 * Complete design system configuration
 */
export interface TypeFormDesignSystem {
  colors: TypeFormColorPalette;
  typography: TypeFormTypography;
  spacing: TypeFormSpacing;
  breakpoints: TypeFormBreakpoints;
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  animations: AnimationTiming;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Props that can be forwarded to DOM elements
 */
export interface ForwardableProps {
  id?: string;
  className?: string;
  "data-testid"?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
}

/**
 * Selection state for multi-select scenarios
 */
export interface SelectionState<T = string> {
  selected: Set<T>;
  isAllSelected: boolean;
  selectItem: (item: T) => void;
  deselectItem: (item: T) => void;
  toggleItem: (item: T) => void;
  selectAll: (items: T[]) => void;
  deselectAll: () => void;
  isSelected: (item: T) => boolean;
}

/**
 * Validation state for form components
 */
export interface ValidationState {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  touched: boolean;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Option selection event
 */
export interface OptionSelectionEvent {
  value: string;
  label: string;
  selected: boolean;
  multiSelect: boolean;
}

/**
 * Progress milestone event
 */
export interface ProgressMilestoneEvent {
  milestone: number;
  progress: number;
  step: number;
  totalSteps: number;
}

/**
 * Celebration event
 */
export interface CelebrationEvent {
  type: "milestone" | "completion" | "selection";
  progress?: number;
  message?: string;
}

// ============================================================================
// COMPONENT REGISTRY TYPES
// ============================================================================

/**
 * Component registry for different question types
 */
export interface TypeFormComponentRegistry {
  optionCard: React.ComponentType<OptionCardProps>;
  questionCard: React.ComponentType<QuestionCardProps>;
  progressBar: React.ComponentType<ProgressBarProps>;
  celebration: React.ComponentType<CelebrationProps>;
}

export default {};
