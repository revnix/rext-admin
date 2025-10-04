"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useTopics } from "@/hooks/use-topics";
import { transformTopicsForDisplay } from "@/lib/simple-topic-transformer";
import { useCurrentWorkspace } from "@/stores/workspace-store";
import { TopicsClientWrapper } from "./topics-client-wrapper";

export default function TopicsPage() {
  const breadcrumbs = [{ label: "Library", href: "#" }, { label: "Topics" }];
  const queryClient = useQueryClient();
  const currentWorkspace = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id || "";

  const { data: topics, isLoading, error, refetch } = useTopics(workspaceId);

  const handleRetry = async () => {
    try {
      // Proper error recovery without losing SPA state
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["topics"] }),
        refetch(),
      ]);
    } catch (error) {
      console.error("Retry failed:", error);
    }
  };

  const handleForceRefresh = () => {
    // Clear all caches and refetch
    queryClient.clear();
    queryClient.invalidateQueries();
  };

  const emptyActions = [
    {
      label: "Generate Topics",
      icon: <Plus className="h-4 w-4" />,
      href: "/topics/create",
    },
  ];

  const tableActions = (
    <Button asChild>
      <Link href="/topics/create">
        <Plus className="h-4 w-4 mr-2" />
        Generate Topics
      </Link>
    </Button>
  );

  return (
    <PageLayout
      title="Topic Library"
      description="Browse AI-generated topics and transform them into compelling content. Generate new topics or explore your saved collection."
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
