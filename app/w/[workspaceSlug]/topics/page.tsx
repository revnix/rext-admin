"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { TopicsClientWrapper } from "@/app/topics/topics-client-wrapper";
import { PageLayout } from "@/components/page-layout";
import { CanAccess } from "@/components/permissions/can-access";
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
import { TOPIC_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { transformTopicsForDisplay } from "@/lib/simple-topic-transformer";
import { useWorkspace } from "@/providers/workspace-provider";

export default function WorkspaceTopicsPage() {
  const { workspace, workspaceId, workspaceSlug } = useWorkspace();
  const queryClient = useQueryClient();

  // Permissions for creating topics
  const { hasPermission: canCreateTopic, isLoading: isPermissionLoading } =
    useWorkspacePermission(TOPIC_PERMISSIONS.CREATE, workspaceId);

  const {
    data: topics,
    isLoading: isTopicsLoading,
    error,
    refetch,
  } = useTopics(workspaceId);

  const handleRetry = async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["topics", workspaceId] }),
        refetch(),
      ]);
    } catch (error) {
      log.error("Retry failed:", error);
    }
  };

  const handleForceRefresh = () => {
    queryClient.clear();
    queryClient.invalidateQueries();
  };

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Topics" },
  ];

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
      <Link href={workspaceRoutes.topicCreate(workspaceSlug)}>
        <Plus className="h-4 w-4 mr-2" />
        Generate Topics
      </Link>
    </Button>
  ) : null;

  // 🧠 Show skeleton until permissions are ready (prevents flicker)
  if (isPermissionLoading) {
    return (
      <PageLayout title="Topic Library" breadcrumbs={breadcrumbs}>
        <TableSkeleton rows={8} />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Topic Library"
      description={`Browse AI-generated topics for ${
        workspace?.title || "this workspace"
      }. Generate new topics or explore your saved collection.`}
      breadcrumbs={breadcrumbs}
    >
      <CanAccess
        permission={TOPIC_PERMISSIONS.READ}
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
                <code className="text-xs bg-muted px-1 rounded">
                  topic:read
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        {isTopicsLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-lg font-semibold">Failed to load topics</h2>
            <p className="text-muted-foreground text-center max-w-md">
              {error.message ||
                "An unexpected error occurred while loading topics."}
            </p>
            <div className="flex space-x-2">
              <Button onClick={handleRetry} variant="default" size="sm">
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
      </CanAccess>
    </PageLayout>
  );
}
