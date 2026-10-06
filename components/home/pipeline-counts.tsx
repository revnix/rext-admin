import type { Route } from "next";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { workspaceRoutes } from "@/lib/routes";
import type { PipelineCounts as Counts } from "./home-data";

/**
 * The pipeline (plans/app/D-pages.md §2.1): how many articles wait at each step, each opening the
 * library filtered to it. "Published this month" opens every published article: the library has no
 * date filter.
 */
export function PipelineCounts({
  slug,
  counts,
}: {
  slug: string;
  counts: Counts | null;
}) {
  const library = workspaceRoutes.content(slug);
  const tiles = [
    { label: "Drafts", value: counts?.drafts, status: "draft,ready" },
    { label: "In review", value: counts?.review, status: "review" },
    { label: "Scheduled", value: counts?.scheduled, status: "scheduled" },
    {
      label: "Published this month",
      value: counts?.publishedThisMonth,
      status: "published",
    },
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <li key={tile.label}>
          <Link
            href={`${library}?status=${tile.status}` as Route}
            className="flex h-full flex-col gap-1 rounded-md border border-border bg-card p-4 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {tile.value === undefined ? (
              <Skeleton className="h-8 w-10" />
            ) : (
              <span className="num font-display text-page-title text-foreground">
                {tile.value.toLocaleString()}
              </span>
            )}
            <span className="text-sm text-muted-foreground">{tile.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
