import { createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";

/**
 * The content library's filters as URL search params (`?q=…&status=draft`),
 * so a reload, a shared link and Back keep them. One parsers object serves
 * both sides: the page reads and sets them with `useQueryStates(contentListParams)`
 * and server code parses a request's `searchParams` with `loadContentListParams`.
 * Imported from `nuqs/server`, which carries no "use client" directive.
 */

/** The backend's content states (its transition table), trash excluded. */
export const CONTENT_LIST_STATUSES = [
  "draft",
  "generating",
  "ready",
  "review",
  "scheduled",
  "published",
  "failed",
  "archived",
] as const;

export type ContentListStatus = (typeof CONTENT_LIST_STATUSES)[number];

export const CONTENT_LIST_STATUS_LABELS: Record<ContentListStatus, string> = {
  draft: "Draft",
  generating: "Generating",
  ready: "Ready",
  review: "In review",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
  archived: "Archived",
};

export const contentListParams = {
  q: parseAsString.withDefault(""),
  status: parseAsStringLiteral(CONTENT_LIST_STATUSES),
};

export const loadContentListParams = createLoader(contentListParams);
