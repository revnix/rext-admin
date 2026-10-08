/**
 * The incident banner (rext-control#728): the one notice every signed-in user sees while a
 * provider or our own servers are failing. Any signed-in user reads it; a super admin
 * (`security.manage`) switches it on and off, with no deploy.
 */

import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

/** What a banner may say is affected: the backend's fixed list. */
export const BANNER_AREAS = [
  "generation",
  "keyword_research",
  "publishing",
  "billing",
  "sign_in",
] as const;
export type BannerArea = (typeof BANNER_AREAS)[number];

/** The backend's limits, said in the form before the request is. */
export const BANNER_MESSAGE_MAX = 280;
export const BANNER_MIN_MINUTES = 15;
export const BANNER_MAX_MINUTES = 24 * 60;

/** The banner as the backend sends it; `active` false means there is none. */
export interface IncidentBanner {
  active: boolean;
  message: string | null;
  areas: BannerArea[];
  started_at: string | null;
  expires_at: string | null;
}

export interface IncidentBannerInput {
  /** Plain text, shown as text. */
  message: string;
  areas: BannerArea[];
  /** How long it shows unless it is switched off first. */
  duration_minutes: number;
}

export function createIncidentBannerNamespace(client: ApiClient) {
  const E = ENDPOINTS.INCIDENT_BANNER;
  return {
    /** The banner showing now. The shell's read gives a signal, so a slow answer is dropped. */
    get: (signal?: AbortSignal) =>
      client.request<IncidentBanner>(E.read, { method: "GET", signal }),

    /** Switch it on, or replace the one showing. Throws ApiError 422 / 503. */
    set: (input: IncidentBannerInput) =>
      client.request<IncidentBanner>(E.admin, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),

    /** Switch it off. Throws ApiError 503 when the banner may still be showing. */
    clear: () => client.request<IncidentBanner>(E.admin, { method: "DELETE" }),
  };
}
