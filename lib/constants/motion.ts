/**
 * Centralized timing constants for modal display delays and animations.
 *
 * These values control how long the app waits after page load before
 * showing onboarding/welcome modals. They are intentionally different
 * from animation durations (which are handled by Framer Motion).
 *
 * Timing rationale:
 * - DEFAULT: 500ms gives the page enough time to render and settle
 *   before a modal overlay appears. Below 300ms feels jarring (NN/g).
 * - INVITED_USER: 800ms is slightly longer to let the invited user
 *   see and register the workspace they just joined before the
 *   onboarding modal covers it.
 * - ANIMATION_CLEANUP: 300ms allows exit animations to complete
 *   before state is cleared. Aligned with standard modal exit
 *   duration (NN/g recommends 200-250ms for exit transitions).
 *
 * @see https://www.nngroup.com/articles/animation-duration/
 * @see https://m3.material.io/styles/motion/easing-and-duration/tokens-specs
 */
export const MODAL_DELAYS = {
  /** Standard delay before showing a modal after page load */
  DEFAULT: 500,

  /**
   * Delay before showing onboarding to invited users.
   * Longer than DEFAULT to let them see the workspace first.
   */
  INVITED_USER: 800,

  /**
   * Delay before clearing modal state after close.
   * Allows exit animation to complete before React unmounts the component.
   */
  ANIMATION_CLEANUP: 300,
} as const;
