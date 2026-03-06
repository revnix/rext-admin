/**
 * Onboarding components barrel export
 *
 * This file defines the public API of the onboarding module.
 * Components listed here can be imported by code outside this folder.
 *
 * Internal-only components (not exported):
 * - OnboardingStrategy  — step used only by OnboardingModal
 * - OnboardingWorkspace — step used only by OnboardingModal
 *
 * These are imported via relative paths within the module and should not
 * be used directly by code outside `components/onboarding/`.
 */

// ---------------------------------------------------------------------------
// Main modals
// ---------------------------------------------------------------------------
export { OnboardingModal } from "./onboarding-modal";
export { InvitedUserOnboardingModal } from "./invited-user-onboarding-modal";

// ---------------------------------------------------------------------------
// Progress indicators
// ---------------------------------------------------------------------------
export { OnboardingProgress } from "./onboarding-progress";

// ---------------------------------------------------------------------------
// Regular onboarding steps (used by OnboardingModal)
// ---------------------------------------------------------------------------
export { OnboardingComplete } from "./steps/onboarding-complete";
export { OnboardingMarketingQuestions } from "./steps/onboarding-marketing-questions";

// ---------------------------------------------------------------------------
// Invited user onboarding steps (used by InvitedUserOnboardingModal)
// ---------------------------------------------------------------------------
export { InvitedUserWelcome } from "./steps/invited-user-welcome";
export {
  InvitedUserPermissions,
  getRolePermissions,
} from "./steps/invited-user-permissions";
export { InvitedUserQuickTour } from "./steps/invited-user-quick-tour";
export { InvitedUserFirstTasks } from "./steps/invited-user-first-tasks";
