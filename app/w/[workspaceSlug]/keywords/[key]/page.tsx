"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { LibraryKeywordDetail } from "@/components/keywords/library-detail";
import { SerpSnapshot } from "@/components/keywords/serp-snapshot";
import { DetailPage } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useAwaitingData } from "@/hooks/use-awaiting-data";
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
 * ten beside them (beneath them on narrow screens), and "Use this keyword", which starts an article
 * from the saved research with the intent chosen here.
 */
export default function Page() {
  const params = useParams<{ key: string }>();
  const key = routeKey(params.key);
  const { workspace, workspaceSlug, error: workspaceError } = useWorkspace();
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
  // The item waits for the workspace and the signed-in user (D16a); without the right to read it
  // never runs.
  const isWaiting = useAwaitingData(item, canRead);
  const loading = isPermissionLoading || isWaiting;
  const failed = item.error ?? workspaceError;
  const showSkeleton = useShowAfter(loading);

  if (loading) {
    return (
      <DetailPage title="Keyword">
        {showSkeleton && <Skeleton className="h-48 w-full" />}
      </DetailPage>
    );
  }

  const libraryHref = workspaceRoutes.keywordLibrary(workspaceSlug) as Route;
  if (!canRead && !workspaceError) {
    return (
      <DetailPage title="Keyword">
        <EmptyState
          title="You can't see this workspace's keywords"
          description="Ask a workspace admin for access to its content."
        />
      </DetailPage>
    );
  }
  if (!item.data) {
    return (
      <DetailPage title="Keyword">
        <EmptyState
          title={
            failed
              ? "This keyword didn't load"
              : "This keyword isn't in your library"
          }
          description={
            failed
              ? "Refresh the page to try again."
              : "It may have been removed, or the link is from someone else's library."
          }
          action={{ label: "Back to keywords", href: libraryHref }}
        />
      </DetailPage>
    );
  }

  const { value } = item.data;
  const researched = dateFormat.short(value.timestamp);
  return (
    <DetailPage
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
      aside={
        <SerpSnapshot
          results={serpResultsFromOrganic(value.top_organic_results)}
        />
      }
    >
      <LibraryKeywordDetail
        entry={item.data}
        intent={intent}
        onIntentChange={setIntent}
      />
    </DetailPage>
  );
}
