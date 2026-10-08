"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { KeywordCard } from "@/components/keywords/keyword-card";
import { LockedFeatureTooltip } from "@/components/permission/locked-feature-tooltip";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { useShowAfter } from "@/hooks/use-show-after";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { libraryStartQuery } from "@/lib/generate-content/library-item";
import { keywordMetrics } from "@/lib/keywords/keyword-metrics";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { libraryQueries } from "@/lib/query-keys";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";
import { GENERATE_LOCKED_MESSAGE } from "./keyword";

/** How many of the newest keywords the start screen lists; the library holds the rest. */
const RECENT = 5;

/**
 * The start screen's second half (plans/app/E-workflow.md §4 step 0): the keywords the user
 * researched last in this workspace, each as the compact keyword card with "Use", which starts an
 * article from that keyword (the run reuses the saved research for a week, then reads the search results again: E24 #496).
 * Nothing at all before the first one.
 */
export function RecentKeywords() {
  const { workspace, workspaceSlug } = useWorkspace();
  const { user } = useAuthSession();
  const router = useRouter();
  const headingId = useId();
  const workspaceId = workspace?.id ?? "";
  // The research is read only by someone who may read the workspace's content, as in the library.
  const { hasPermission: canRead } = useWorkspacePermission(
    CONTENT_PERMISSIONS.READ,
    workspaceId,
  );
  const { hasPermission: canGenerate, isLoading: isPermissionLoading } =
    useWorkspacePermission(CONTENT_PERMISSIONS.CREATE, workspaceId);
  const locked = !isPermissionLoading && !canGenerate;

  const query = libraryQueries.list(workspaceId, user?.id ?? "");
  const library = useQuery({ ...query, enabled: query.enabled && canRead });
  const showSkeleton = useShowAfter(library.isLoading);

  if (library.isLoading) {
    // The list as it will stand (FB3.2): its heading, then rows of a keyword with its figures
    // and its button.
    return showSkeleton ? (
      <div
        data-slot="recent-keywords-skeleton"
        className="mt-6 flex w-full flex-col gap-3"
        aria-hidden
      >
        <div className="flex items-baseline justify-between gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <ul className="flex flex-col divide-y rounded-(--card-radius) border bg-card">
          {[0, 1, 2].map((row) => (
            <li key={row} className="flex items-start gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className={row === 1 ? "h-5 w-40" : "h-5 w-56"} />
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <Skeleton className="h-4 w-24" />
                  <span className="flex items-center gap-1.5">
                    <Skeleton className="size-5 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                  </span>
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <Skeleton className="h-8 w-12 shrink-0" />
            </li>
          ))}
        </ul>
      </div>
    ) : null;
  }
  if (library.error) {
    return (
      <div className="mt-6">
        <Notice tone="danger" title="Your recent keywords didn't load">
          Refresh the page to try again, or type the keyword above.
        </Notice>
      </div>
    );
  }
  const recent = (library.data ?? []).slice(0, RECENT);
  if (recent.length === 0) return null;

  const use = (key: string) =>
    router.push(
      `${workspaceRoutes.generate_content(workspaceSlug)}?${libraryStartQuery(key)}` as Route,
    );

  return (
    <section
      aria-labelledby={headingId}
      className="mt-6 flex w-full flex-col gap-3"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="text-label text-muted-foreground">
          Recent keywords
        </h2>
        <Link
          href={workspaceRoutes.keywordLibrary(workspaceSlug) as Route}
          className="text-label link"
        >
          All keywords
        </Link>
      </div>
      <ul className="flex flex-col divide-y rounded-(--card-radius) border bg-card">
        {recent.map(({ key, value }) => {
          const button = (
            <Button
              variant="outline"
              size="sm"
              aria-label={`Use: ${value.original_query}`}
              onClick={() => use(key)}
            >
              Use
            </Button>
          );
          return (
            <li key={key} className="px-4 py-3">
              <KeywordCard
                size="compact"
                keyword={value.original_query}
                metrics={keywordMetrics(value.seo_state)}
                eyebrow={
                  value.timestamp
                    ? `Researched ${dateFormat.short(value.timestamp)}`
                    : undefined
                }
                action={
                  <div className="shrink-0">
                    {locked ? (
                      <LockedFeatureTooltip
                        permission={CONTENT_PERMISSIONS.CREATE}
                        message={GENERATE_LOCKED_MESSAGE}
                      >
                        {button}
                      </LockedFeatureTooltip>
                    ) : (
                      button
                    )}
                  </div>
                }
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
