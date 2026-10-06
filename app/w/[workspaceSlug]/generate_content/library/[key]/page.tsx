"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { LibraryKeywordDetail } from "@/components/generate-content/library-detail";
import { SerpSnapshot } from "@/components/keywords/serp-snapshot";
import { WorkingSurface } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { useShowAfter } from "@/hooks/use-show-after";
import { libraryStartQuery } from "@/lib/generate-content/library-item";
import { dateFormat } from "@/lib/formatters/date-formatters";
import type { SearchIntent } from "@/lib/keywords/keyword-metrics";
import { serpResultsFromOrganic } from "@/lib/keywords/serp-results";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { libraryQueries } from "@/lib/query-keys";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

/**
 * The Library key a link names. Next hands the segment over decoded, but an escape left in it is
 * decoded once; a key with a literal "%" (a keyword such as "10% off") is kept as it is.
 */
function routeKey(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * One researched keyword from the library: its card and related keywords, the search results' top
 * ten beside them (a sheet on narrow screens), and "Use this keyword", which starts an article from
 * the saved research with the intent chosen here.
 */
export default function Page() {
  const params = useParams<{ key: string }>();
  const key = routeKey(params.key);
  const { workspace, workspaceSlug } = useWorkspace();
  const { user } = useAuthSession();
  const workspaceId = workspace?.id ?? "";
  // The research is read only by someone who may read the workspace's content, as on Generate.
  const { hasPermission: canRead, isLoading: isPermissionLoading } =
    useWorkspacePermission(CONTENT_PERMISSIONS.READ, workspaceId);
  const { hasPermission: canGenerate } = useWorkspacePermission(
    CONTENT_PERMISSIONS.CREATE,
    workspaceId,
  );
  const query = libraryQueries.item(workspaceId, user?.id ?? "", key);
  const item = useQuery({ ...query, enabled: query.enabled && canRead });
  const [intent, setIntent] = useState<SearchIntent | "">("");
  const loading = !workspaceId || isPermissionLoading || item.isLoading;
  const showSkeleton = useShowAfter(loading);

  if (loading) {
    return (
      <WorkingSurface title="Keyword">
        {showSkeleton && <Skeleton className="h-48 w-full" />}
      </WorkingSurface>
    );
  }

  const libraryHref = workspaceRoutes.keywordLibrary(workspaceSlug) as Route;
  if (!canRead) {
    return (
      <WorkingSurface title="Keyword">
        <EmptyState
          title="You can't see this workspace's keywords"
          description="Ask a workspace admin for access to its content."
        />
      </WorkingSurface>
    );
  }
  if (!item.data) {
    return (
      <WorkingSurface title="Keyword">
        <EmptyState
          title={
            item.error
              ? "This keyword didn't load"
              : "This keyword isn't in your library"
          }
          description={
            item.error
              ? "Refresh the page to try again."
              : "It may have been removed, or the link is from someone else's library."
          }
          action={{ label: "Back to keywords", href: libraryHref }}
        />
      </WorkingSurface>
    );
  }

  const { value } = item.data;
  const researched = dateFormat.short(value.timestamp);
  return (
    <WorkingSurface
      title={value.original_query}
      description={researched ? `Researched ${researched}` : undefined}
      actions={
        canGenerate ? (
          <Button asChild>
            <Link
              href={
                `${workspaceRoutes.generate_content(workspaceSlug)}?${libraryStartQuery(key, intent || undefined)}` as Route
              }
            >
              Use this keyword
            </Link>
          </Button>
        ) : undefined
      }
      side={
        <SerpSnapshot
          results={serpResultsFromOrganic(value.top_organic_results)}
        />
      }
      sideTitle="Top search results"
    >
      <LibraryKeywordDetail
        entry={item.data}
        intent={intent}
        onIntentChange={setIntent}
      />
    </WorkingSurface>
  );
}
