/**
 * Onboarding components barrel export
 *
 * Note: Consumers currently import from individual file paths rather than
 * using this barrel. This file defines the public API for the onboarding
 * component set and can be used for future refactors.
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
// Regular onboarding steps
// ---------------------------------------------------------------------------
export { OnboardingComplete } from "./steps/onboarding-complete";
export { OnboardingMarketingQuestions } from "./steps/onboarding-marketing-questions";

// ---------------------------------------------------------------------------
// Invited user onboarding steps
// ---------------------------------------------------------------------------
export { InvitedUserFirstTasks } from "./steps/invited-user-first-tasks";
export {
  getRolePermissions,
  InvitedUserPermissions,
} from "./steps/invited-user-permissions";
export { InvitedUserQuickTour } from "./steps/invited-user-quick-tour";
export { InvitedUserWelcome } from "./steps/invited-user-welcome";
