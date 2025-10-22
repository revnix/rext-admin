/**
 * Onboarding API Client Namespace
 */

import type {
  OnboardingMarketingData,
  OnboardingReset,
  OnboardingStatus,
  OnboardingStepUpdate,
} from "@/types/onboarding";
import type { ApiClient } from "./core";

export function createOnboardingNamespace(client: ApiClient) {
  const ONBOARDING_BASE = "/api/v1/onboarding";

  return {
    /**
     * Get current user's onboarding status
     */
    async getStatus(): Promise<OnboardingStatus> {
      return client.request<OnboardingStatus>(ONBOARDING_BASE, {
        method: "GET",
      });
    },

    /**
     * Update onboarding step
     */
    async updateStep(data: OnboardingStepUpdate): Promise<OnboardingStatus> {
      return client.request<OnboardingStatus>(`${ONBOARDING_BASE}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Update marketing data collected during onboarding
     */
    async updateMarketingData(
      data: OnboardingMarketingData,
    ): Promise<OnboardingStatus> {
      return client.request<OnboardingStatus>(`${ONBOARDING_BASE}/marketing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Mark onboarding as fully completed
     */
    async complete(): Promise<OnboardingStatus> {
      return client.request<OnboardingStatus>(`${ONBOARDING_BASE}/complete`, {
        method: "POST",
      });
    },

    /**
     * Reset onboarding to start from beginning
     */
    async reset(data: OnboardingReset): Promise<OnboardingStatus> {
      return client.request<OnboardingStatus>(`${ONBOARDING_BASE}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Check if onboarding should be shown to current user
     */
    async shouldShow(): Promise<{ should_show: boolean }> {
      return client.request<{ should_show: boolean }>(
        `${ONBOARDING_BASE}/should-show`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Complete current step
     */
    async completeStep(step: number): Promise<OnboardingStatus> {
      return this.updateStep({ step, action: "complete" });
    },

    /**
     * Skip current step (not allowed for required steps)
     */
    async skipStep(step: number): Promise<OnboardingStatus> {
      return this.updateStep({ step, action: "skip" });
    },

    /**
     * Navigate to a specific step
     */
    async goToStep(step: number): Promise<OnboardingStatus> {
      return this.updateStep({ step, action: "set_current" });
    },
  };
}

export type OnboardingNamespace = ReturnType<typeof createOnboardingNamespace>;
