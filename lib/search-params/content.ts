import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";
import type { ContentStatus } from "@/types/content";
import {
  dataTableParams,
  parseAsFacet,
  parseAsSortOf,
} from "@/components/ui/data-table/url-state";

/**
 * The content library's table state as URL search params
 * (`?q=…&status=draft,review&sort=title.asc&page=2`), so a reload, a shared
 * link and Back keep them. One parsers object serves both sides: the page reads
 * and sets them with `useDataTableUrlState(contentListParams)` and server code
 * parses a request's `searchParams` with `loadContentListParams`. Imported from
 * `nuqs/server`, which carries no "use client" directive.
 */

/** The backend's content states (`ContentStatus`), the trash excluded. */
export const CONTENT_LIST_STATUSES = [
  "draft",
  "generating",
  "ready",
  "review",
  "scheduled",
  "published",
  "failed",
  "archived",
] as const satisfies readonly ContentStatus[];

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

/** The library's columns a link may sort by; an older link's Type, Words or Platform sort falls back. */
export const CONTENT_LIST_SORTS = [
  "title",
  "status",
  "persona",
  "updated_at",
  "published_to",
  "seo",
  "created_at",
] as const;

export const contentListParams = {
  ...dataTableParams,
  sort: parseAsSortOf(CONTENT_LIST_SORTS).withDefault({
    id: "updated_at",
    desc: true,
  }),
  status: parseAsFacet(CONTENT_LIST_STATUSES),
  // An open set: the workspace's persona ids.
  persona: parseAsArrayOf(parseAsString).withDefault([]),
};

/** The keys of `contentListParams` that are faceted filters on the table's columns. */
export const CONTENT_LIST_FACETS = ["status", "persona"] as const;

export const loadContentListParams = createLoader(contentListParams);
