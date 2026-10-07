import { Badge, type BadgeProps } from "@/components/ui/badge";
import { CONTENT_LIST_STATUS_LABELS } from "@/lib/search-params/content";
import type { ContentStatus } from "@/types/content";

// The words for every status a row can hold (the backend's ten): the library's, and the trash's.
const STATUS_LABELS: Readonly<Record<ContentStatus, string>> = {
  ...CONTENT_LIST_STATUS_LABELS,
  trashed: "In the trash",
  deleted: "Deleted",
};

// A tint only for a status worth noticing (design/app-language.md §2); the rest stay neutral.
const STATUS_TINT: Readonly<Record<string, BadgeProps["variant"]>> = {
  published: "success",
  scheduled: "info",
  review: "warning",
  failed: "danger",
};

/** The word for a content status, as the library and the calendar show it. */
export function contentStatusLabel(status: string): string {
  return STATUS_LABELS[status as ContentStatus] ?? status;
}

/** A content item's status as a quiet badge, tinted only where it is worth noticing. */
export function ContentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_TINT[status] ?? "neutral"}>
      {contentStatusLabel(status)}
    </Badge>
  );
}
