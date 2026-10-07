/**
 * Onboarding API Namespace
 *
 * The questions asked once at first login: whether to ask them (only an organic sign-up who has not
 * finished onboarding; never an invited user or an admin), the answers, and the end of onboarding,
 * which a skip also reaches so the questions are asked once.
 */

import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

export interface OnboardingMarketingAnswers {
  user_industry?: string | null;
  user_role?: string | null;
  user_goal?: string | null;
  heard_from?: string | null;
}

export function createOnboardingNamespace(client: ApiClient) {
  return {
    /** Whether the first-login questions are for this user. */
    shouldShow: async (): Promise<{ should_show: boolean }> =>
      client.request<{ should_show: boolean }>(
        ENDPOINTS.ONBOARDING.shouldShow,
        {
          method: "GET",
        },
      ),

    /** Saves the answers (each optional, at most 100 characters). */
    saveAnswers: async (
      answers: OnboardingMarketingAnswers,
    ): Promise<unknown> =>
      client.request(ENDPOINTS.ONBOARDING.marketing, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      }),

    /** Ends onboarding: the questions are not asked again. */
    complete: async (): Promise<unknown> =>
      client.request(ENDPOINTS.ONBOARDING.complete, { method: "POST" }),
  };
}
