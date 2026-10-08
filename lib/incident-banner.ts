// The incident banner as the dashboard shows it (rext-control#728): what the shell says from the
// backend's answer, and how its one read is made so that it can never hold or break a page.

import { queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import {
  BANNER_AREAS,
  BANNER_MESSAGE_MAX,
  type BannerArea,
} from "@/lib/api-client/incident-banner";
import { incidentBannerQueries } from "@/lib/query-keys";

/** Every signed-in page shows a banner within this of its being switched on. */
export const INCIDENT_BANNER_POLL_MS = 60_000;
/** A read that hasn't answered by now is dropped: the page shows no banner and goes on. */
export const INCIDENT_BANNER_TIMEOUT_MS = 4_000;

/** Each area in the reader's words, as the banner's "Affected" line lists them. */
export const BANNER_AREA_LABELS: Record<BannerArea, string> = {
  generation: "writing articles",
  keyword_research: "keyword research",
  publishing: "publishing",
  billing: "billing",
  sign_in: "signing in",
};

export interface ShownBanner {
  /** Plain text; the shell renders it as text. */
  message: string;
  /** "writing articles, publishing", or null when the banner names nothing. */
  affected: string | null;
  /** Epoch ms, or null when the backend gave no end time. */
  until: number | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * What to show for the backend's answer, or null for no banner. Read defensively: the answer is on
 * every page, so anything that isn't a banner now (switched off, past its end time, no words, a
 * shape this code doesn't know) shows nothing, and an over-long message is cut to the limit.
 */
export function shownBanner(
  answer: unknown,
  now: number = Date.now(),
): ShownBanner | null {
  if (!isRecord(answer) || answer.active !== true) return null;
  if (typeof answer.message !== "string") return null;
  const message = answer.message
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, BANNER_MESSAGE_MAX);
  if (!message) return null;

  const until =
    typeof answer.expires_at === "string" ? Date.parse(answer.expires_at) : NaN;
  // The last answer is kept while later reads fail, so the end time is checked here too.
  if (!Number.isNaN(until) && until <= now) return null;

  const areas = Array.isArray(answer.areas) ? answer.areas : [];
  const labels = BANNER_AREAS.filter((area) => areas.includes(area)).map(
    (area) => BANNER_AREA_LABELS[area],
  );
  return {
    message,
    affected: labels.length > 0 ? labels.join(", ") : null,
    until: Number.isNaN(until) ? null : until,
  };
}

/** A signal that ends with the query's own, or after `ms`, whichever comes first. */
function limited(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  signal?.addEventListener(
    "abort",
    () => {
      clearTimeout(timer);
      controller.abort();
    },
    { once: true },
  );
  return controller.signal;
}

/**
 * The shell's read of the banner: once a minute while the tab is in view, dropped after four
 * seconds, never tried again before the next minute, and never thrown. A failed read leaves what
 * was last read (a banner is likelier still true than not while the server can't be reached), and
 * `shownBanner` ends that at the banner's own end time.
 */
export const incidentBannerQueryOptions = () =>
  queryOptions({
    queryKey: incidentBannerQueries.all(),
    queryFn: ({ signal }) =>
      apiClient.incidentBanner.get(limited(signal, INCIDENT_BANNER_TIMEOUT_MS)),
    refetchInterval: INCIDENT_BANNER_POLL_MS,
    staleTime: INCIDENT_BANNER_POLL_MS / 2,
    retry: false,
    throwOnError: false,
  });
