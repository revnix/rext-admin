"use client";

import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditableBrandVoiceCard } from "@/components/workspace/editable-brand-voice-card";
import { WorkspaceAnalyticsDashboard } from "@/components/workspace/workspace-analytics-dashboard";
import { WorkspaceDeleteDialog } from "@/components/workspace/workspace-delete-dialog";
import { WorkspaceDetailSkeleton } from "@/components/workspace/workspace-detail-skeleton";
import { WorkspaceKnowledgeSummaryCard } from "@/components/workspace/workspace-knowledge-summary-card";
import { WorkspaceOverviewForm } from "@/components/workspace/workspace-overview-form";
import { usePageTitle } from "@/hooks/use-page-title";
import { apiClient } from "@/lib/api-client";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { getWorkspaceDisplayTitle } from "@/lib/workspace";
import {
  useKnowledgeFilterStore,
  useUnifiedKnowledgeStore,
} from "@/stores/knowledge-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface WorkspaceDetailProps {
  workspaceSlug: string;
}

export function WorkspaceDetail({ workspaceSlug }: WorkspaceDetailProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );
  const setCurrentWorkspaceId = useUnifiedKnowledgeStore(
    (state) => state.setCurrentWorkspace,
  );
  const resetKnowledgeFilters = useKnowledgeFilterStore(
    (state) => state.resetFilters,
  );

  // Query workspace data by slug
  const {
    data: workspaceResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workspace", workspaceSlug],
    queryFn: () => apiClient.workspaces.getBySlug(workspaceSlug),
    enabled: !!workspaceSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const workspace = workspaceResponse?.workspace;
  const workspaceTitle = getWorkspaceDisplayTitle(workspace);

  // Update stores when workspace data changes
  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace);
      setCurrentWorkspaceId(workspace.id);
      resetKnowledgeFilters();
    }
  }, [
    workspace,
    setCurrentWorkspace,
    setCurrentWorkspaceId,
    resetKnowledgeFilters,
  ]);

  // Update page title
  usePageTitle(
    workspace ? `${workspaceTitle} - Workspace` : "Workspace",
    workspace
      ? `Manage knowledge, content, and brand voice for ${workspaceTitle}`
      : "Loading workspace details...",
  );

  if (error) {
    const breadcrumbs = [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Unknown" },
    ];

    return (
      <PageLayout
        title="Workspace Not Found"
        description="The requested workspace could not be found"
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        }
      >
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-4">Failed to load workspace</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: workspace ? workspaceTitle : "Loading..." },
  ];

  const actions = workspace && (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => refetch()}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <PageLayout
      title={workspace ? workspaceTitle : "Loading..."}
      description="Manage knowledge, content, and brand voice for this workspace"
      breadcrumbs={breadcrumbs}
      actions={actions}
    >
      <CanAccess
        permission={WORKSPACE_PERMISSIONS.READ}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  workspace.read
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <div className="space-y-6">
          {isLoading ? (
            <WorkspaceDetailSkeleton />
          ) : workspace ? (
            <>
              {/* Workspace Details & Knowledge Summary */}
              <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <WorkspaceOverviewForm
                  workspace={workspace}
                  onSuccess={() => refetch()}
                />
                <WorkspaceKnowledgeSummaryCard workspace={workspace} />
              </div>

              {/* Analytics Dashboard */}
              <WorkspaceAnalyticsDashboard workspace={workspace} />

              {/* Brand Voice */}
              <EditableBrandVoiceCard workspace={workspace} />
            </>
          ) : null}
        </div>

        {/* Delete Dialog - Outside PageLayout to avoid conflicts */}
        {workspace && (
          <WorkspaceDeleteDialog
            workspace={workspace}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            trigger={<span />}
            onDeleted={() => {
              setShowDeleteDialog(false);
              router.push("/dashboard");
            }}
          />
        )}
      </CanAccess>
    </PageLayout>
  );
}
