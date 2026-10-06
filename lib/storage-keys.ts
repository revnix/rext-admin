/**
 * Centralized registry of browser-storage keys used by the onboarding module.
 *
 * Keeping keys in one file makes them discoverable, prevents typos,
 * and makes it easy to audit what is stored in the browser.
 */

export const ONBOARDING_STORAGE_KEYS = {
  /**
   * Array of milestone IDs already reported via analytics.
   * Scoped per workspace — prevents re-firing `onboarding_milestone_completed`
   * when the hook remounts after the milestone was completed elsewhere.
   */
  trackedMilestones: (workspaceId?: string) =>
    workspaceId
      ? `onboarding-tracked-milestones-${workspaceId}`
      : "onboarding-tracked-milestones-global",

  /** Whether the workspace welcome modal was shown. Scoped per workspace. */
  welcomeShown: (workspaceId: string) =>
    `workspace_welcome_shown_${workspaceId}`,

  /** Serialized WelcomeData in sessionStorage. Scoped per workspace. */
  welcomeData: (workspaceId: string) => `workspace_welcome_${workspaceId}`,
} as const;
