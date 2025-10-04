"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { TopicsClientWrapper } from "@/app/topics/topics-client-wrapper";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useTopics } from "@/hooks/use-topics";
import { log } from "@/lib/logger";
import { workspaceRoutes } from "@/lib/routes";
import { transformTopicsForDisplay } from "@/lib/simple-topic-transformer";
import { useWorkspace } from "@/providers/workspace-provider";

export default function WorkspaceTopicsPage() {
  const { workspace, workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const { data: topics, isLoading, error, refetch } = useTopics(workspaceId);

  const handleRetry = async () => {
    try {
      // Proper error recovery without losing SPA state
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["topics", workspaceId] }),
        refetch(),
      ]);
    } catch (error) {
      log.error("Retry failed:", error);
    }
  };

  const handleForceRefresh = () => {
    // Clear all caches and refetch
    queryClient.clear();
    queryClient.invalidateQueries();
  };

  const breadcrumbs = [
    { label: "Workspaces", href: "/workspaces" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceId),
    },
    { label: "Topics" },
  ];

  const emptyActions = [
    {
      label: "Generate Topics",
      icon: <Plus className="h-4 w-4" />,
      href: workspaceRoutes.topicCreate(workspaceId),
    },
  ];

  const tableActions = (
    <Button asChild>
      <Link href={workspaceRoutes.topicCreate(workspaceId)}>
        <Plus className="h-4 w-4 mr-2" />
        Generate Topics
      </Link>
    </Button>
  );

  return (
    <PageLayout
      title="Topic Library"
      description={`Browse AI-generated topics for ${workspace?.title || "this workspace"}. Generate new topics or explore your saved collection.`}
      breadcrumbs={breadcrumbs}
    >
      {isLoading ? (
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
    </PageLayout>
  );
}
