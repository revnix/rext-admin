/**
 * Onboarding API Client Namespace
 *
 * Handles user onboarding workflow including step progression,
 * marketing data collection, and status tracking.
 */

import type {
  OnboardingMarketingData,
  OnboardingReset,
  OnboardingStatus,
  OnboardingStepUpdate,
} from "@/types/onboarding";
import type {
  UserOnboardingResponse,
  ShouldShowOnboardingResponse,
  OnboardingStepUpdate as GeneratedOnboardingStepUpdate,
} from "@/types/generated/types.gen";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

export function createOnboardingNamespace(client: ApiClient) {
  return {
    /**
     * Get current user's onboarding status
     */
    async getStatus(): Promise<OnboardingStatus> {
      // Backend returns UserOnboardingResponse; we cast to local rigid OnboardingStatus
      return client.request<OnboardingStatus>(ENDPOINTS.ONBOARDING.BASE, {
        method: "GET",
      });
    },

    /**
     * Update onboarding step
     */
    async updateStep(data: OnboardingStepUpdate): Promise<OnboardingStatus> {
      return client.request<OnboardingStatus>(ENDPOINTS.ONBOARDING.update, {
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
      return client.request<OnboardingStatus>(ENDPOINTS.ONBOARDING.marketing, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Mark onboarding as fully completed
     */
    async complete(): Promise<OnboardingStatus> {
      return client.request<OnboardingStatus>(ENDPOINTS.ONBOARDING.complete, {
        method: "POST",
      });
    },

    /**
     * Reset onboarding to start from beginning
     */
    async reset(data: OnboardingReset): Promise<OnboardingStatus> {
      return client.request<OnboardingStatus>(ENDPOINTS.ONBOARDING.reset, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Check if onboarding should be shown to current user
     */
    async shouldShow(): Promise<{ should_show: boolean }> {
      // Backend returns ShouldShowOnboardingResponse
      return client.request<ShouldShowOnboardingResponse>(
        ENDPOINTS.ONBOARDING.shouldShow,
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
