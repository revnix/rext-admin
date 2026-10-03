"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { TopicsClientWrapper } from "@/app/topics/topics-client-wrapper";
import { PageLayout } from "@/components/page-layout";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { useTopics } from "@/hooks/use-topics";
import { log } from "@/lib/logger";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { transformTopicsForDisplay } from "@/lib/simple-topic-transformer";
import { useWorkspace } from "@/providers/workspace-provider";
import type { Route } from "next";

export default function WorkspaceTopicsPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const queryClient = useQueryClient();

  // Canonical workspace UUID for query keys — one identifier form across the
  // list page, detail page, and wizard so they share cache entries instead
  // of duplicating fetches under slug- and UUID-keyed queries (finding #10).
  // Note: /api/v1/topic/* currently 404s for ANY identifier — the backend
  // build has no topic routes registered — which is a separate gap.
  const workspaceUuid = workspace?.id || "";

  // Permissions
  const {
    hasPermission: canCreateTopic,
    isLoading: isCreatePermissionLoading,
  } = useWorkspacePermission(CONTENT_PERMISSIONS.CREATE, workspaceUuid);

  const { isLoading: isReadPermissionLoading } = useWorkspacePermission(
    CONTENT_PERMISSIONS.READ,
    workspaceUuid,
  );

  // Topics data
  const {
    data: topics,
    isLoading: isTopicsLoading,
    error,
  } = useTopics(workspaceUuid);

  // Handlers
  const handleRetry = async () => {
    try {
      // invalidateQueries already refetches active queries; a parallel
      // refetch() of the same key only duplicates work (React Query
      // coalesces them at the network layer).
      await queryClient.invalidateQueries({
        queryKey: ["topics", workspaceUuid],
      });
    } catch (err) {
      log.error("Retry failed:", err);
    }
  };

  const handleForceRefresh = () => {
    // Scope the hard refresh to topics queries. The previous clear() +
    // blanket invalidateQueries() wiped every cache in the app and, as
    // verified at runtime, issued no refetch at all — a no-op button.
    queryClient.invalidateQueries({ queryKey: ["topics"] });
  };

  // 🧩 Wait for all permission states before showing layout
  if (!workspace?.id || isCreatePermissionLoading || isReadPermissionLoading) {
    return (
      <PageLayout title="Loading Permissions...">
        <div className="flex h-screen items-center justify-center">
          <div className="space-y-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-foreground" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Actions
  const emptyActions = canCreateTopic
    ? [
        {
          label: "Generate Topics",
          icon: <Plus className="h-4 w-4" />,
          href: workspaceRoutes.topicCreate(workspaceSlug),
        },
      ]
    : [];

  const tableActions = canCreateTopic ? (
    <Button asChild>
      <Link href={workspaceRoutes.topicCreate(workspaceSlug) as Route}>
        <Plus className="h-4 w-4 mr-2" />
        Generate Topics
      </Link>
    </Button>
  ) : null;

  return (
    <PageLayout
      title="Topic Library"
      description={`Browse AI-generated topics for ${
        workspace?.name || "this workspace"
      }. Generate new topics or explore your saved collection.`}
    >
      <PermissionGuard
        permission={CONTENT_PERMISSIONS.READ}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don’t have permission to view topics in this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded-md">
                  topic.read
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        {isTopicsLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-64 space-y-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-lg font-semibold">Failed to load topics</h2>
            <p className="text-muted-foreground max-w-md">
              {error.message ||
                "An unexpected error occurred while loading topics."}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleRetry} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={handleForceRefresh} variant="outline" size="sm">
                Force Refresh
              </Button>
            </div>
          </div>
        ) : (
          <TopicsClientWrapper
            data={transformTopicsForDisplay(topics || [])}
            emptyActions={emptyActions}
            tableActions={tableActions}
          />
        )}
      </PermissionGuard>
    </PageLayout>
  );
}
