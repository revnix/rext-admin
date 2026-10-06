"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllContent } from "@/hooks/use-content";
import { useShowAfter } from "@/hooks/use-show-after";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { workspaceRoutes } from "@/lib/routes";
import {
  CONTENT_LIST_STATUS_LABELS,
  type ContentListStatus,
} from "@/lib/search-params/content";
import type { ContentItem } from "@/types/content";

/**
 * The pipeline's columns: the backend's content states in the order an article moves through them
 * (content_service.py's transitions). Archived articles are out of the pipeline; the library shows them.
 */
const BOARD_STATUSES = [
  "draft",
  "generating",
  "ready",
  "review",
  "scheduled",
  "published",
  "failed",
] as const satisfies readonly ContentListStatus[];

type BoardStatus = (typeof BOARD_STATUSES)[number];

/** Cards a column shows before "View all". */
const CARDS_PER_COLUMN = 8;

function whenOf(item: ContentItem, status: BoardStatus): string {
  if (status === "scheduled" && item.wordpress_published_at) {
    return `Publishes ${dateFormat.short(item.wordpress_published_at)}`;
  }
  if (status === "published" && item.wordpress_published_at) {
    return `Published ${dateFormat.short(item.wordpress_published_at)}`;
  }
  return `Updated ${dateFormat.short(item.updated_at || item.created_at)}`;
}

function columnOrder(status: BoardStatus) {
  const at = (item: ContentItem) =>
    item.wordpress_published_at || item.updated_at || item.created_at;
  // What publishes next first; everywhere else, what moved last first.
  return status === "scheduled"
    ? (a: ContentItem, b: ContentItem) => at(a).localeCompare(at(b))
    : (a: ContentItem, b: ContentItem) => at(b).localeCompare(at(a));
}

/**
 * The calendar's board lens: every article in the workspace by its status, one column each, the
 * same items the library lists (design/app-language.md §6; research 04 §3). It reads only: an
 * article's status changes where the work happens, not by dragging a card.
 */
export function CalendarBoard({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId: string;
  workspaceSlug: string;
}) {
  const { data, isLoading, error, refetch } = useAllContent(workspaceId);
  const showSkeleton = useShowAfter(isLoading);

  const columns = useMemo(() => {
    const byStatus = new Map<BoardStatus, ContentItem[]>(
      BOARD_STATUSES.map((status) => [status, []]),
    );
    for (const item of data ?? []) {
      byStatus.get(item.status as BoardStatus)?.push(item);
    }
    return BOARD_STATUSES.map((status) => ({
      status,
      items: (byStatus.get(status) ?? []).sort(columnOrder(status)),
    }));
  }, [data]);

  if (error) {
    return (
      <Notice
        tone="danger"
        title="The board didn't load"
        action={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        }
      >
        The articles couldn't be read from the server.
      </Notice>
    );
  }

  if (isLoading) {
    return showSkeleton ? (
      <div role="status" className="flex gap-3 overflow-hidden">
        <span className="sr-only">Loading the board</span>
        {BOARD_STATUSES.map((status) => (
          <Skeleton key={status} className="h-96 w-64 shrink-0" />
        ))}
      </div>
    ) : null;
  }

  const library = workspaceRoutes.content(workspaceSlug);

  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
      {columns.map(({ status, items }) => (
        <section
          key={status}
          aria-labelledby={`column-${status}`}
          className="flex w-64 shrink-0 snap-start flex-col gap-2 rounded-md border border-border bg-surface-inset p-2"
        >
          <header className="flex items-baseline justify-between gap-2 px-1">
            <h2
              id={`column-${status}`}
              className="text-sm font-medium text-foreground"
            >
              {CONTENT_LIST_STATUS_LABELS[status]}
            </h2>
            <span className="num text-xs text-muted-foreground">
              {items.length}
            </span>
          </header>
          {items.length === 0 ? (
            <p className="px-1 py-2 text-sm text-muted-foreground">None</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.slice(0, CARDS_PER_COLUMN).map((item) => (
                <li key={item.id}>
                  <Link
                    href={
                      workspaceRoutes.contentDetail(
                        workspaceSlug,
                        item.id,
                      ) as Route
                    }
                    className="flex flex-col gap-1 rounded-sm border border-border bg-card p-3 outline-none hover:border-ring focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="line-clamp-2 text-sm font-medium text-foreground">
                      {item.title || "Untitled"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {whenOf(item, status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {items.length > CARDS_PER_COLUMN && (
            <Link
              href={`${library}?status=${status}` as Route}
              className="rounded-sm px-1 text-sm text-muted-foreground underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              View all {items.length} in the library
            </Link>
          )}
        </section>
      ))}
    </div>
  );
}
