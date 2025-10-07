"use client";

import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AllKnowledgeList } from "@/components/knowledge/all-knowledge-list";
import { GlobalKnowledgeSearch } from "@/components/knowledge/global-knowledge-search";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditableBrandVoiceCard } from "@/components/workspace/editable-brand-voice-card";
import { WorkspaceAnalyticsDashboard } from "@/components/workspace/workspace-analytics-dashboard";
import { WorkspaceDeleteDialog } from "@/components/workspace/workspace-delete-dialog";
import { WorkspaceDetailSkeleton } from "@/components/workspace/workspace-detail-skeleton";
import { WorkspaceInvitationsPanel } from "@/components/workspace/workspace-invitations-panel";
import { WorkspaceKnowledgeSummaryCard } from "@/components/workspace/workspace-knowledge-summary-card";
import { WorkspaceMembersPanel } from "@/components/workspace/workspace-members-panel";
import { WorkspaceOverviewForm } from "@/components/workspace/workspace-overview-form";
import { WorkspaceSettingsPanel } from "@/components/workspace/workspace-settings-panel";
import { usePageTitle } from "@/hooks/use-page-title";
import { apiClient } from "@/lib/api-client";
import { getWorkspaceDisplayTitle } from "@/lib/workspace";
import {
  useKnowledgeFilterStore,
  useUnifiedKnowledgeStore,
} from "@/stores/knowledge-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceSlug = params.slug as string;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Get current tab from URL parameters, default to 'overview'
  const currentTab = searchParams.get("tab") || "overview";

  // Handle tab changes by updating URL
  const handleTabChange = (tab: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tab);
    router.push(`/workspaces/${workspaceSlug}?${newParams.toString()}`, {
      scroll: false,
    });
  };

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
      { label: "Workspaces", href: "/workspaces" },
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
    { label: "Workspaces", href: "/workspaces" },
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
      description={
        workspace?.description ||
        "Manage knowledge, content, and brand voice for this workspace"
      }
      breadcrumbs={breadcrumbs}
      actions={actions}
    >
      <div className="space-y-6">
        {isLoading ? (
          <WorkspaceDetailSkeleton />
        ) : workspace ? (
          <>
            {/* Main Navigation Tabs */}
            <Tabs
              value={currentTab}
              onValueChange={handleTabChange}
              className="space-y-6"
            >
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
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
              </TabsContent>

              <TabsContent value="knowledge" className="space-y-6">
                {/* Global Search */}
                <GlobalKnowledgeSearch workspaceId={workspace?.id || ""} />

                {/* All Knowledge Combined */}
                <AllKnowledgeList
                  workspaceId={workspace?.id || ""}
                  workspace={workspace}
                />
              </TabsContent>

              <TabsContent value="members" className="space-y-6">
                <WorkspaceMembersPanel workspace={workspace} />
                <WorkspaceInvitationsPanel workspaceId={workspace?.id || ""} />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <WorkspaceSettingsPanel workspace={workspace} />
              </TabsContent>
            </Tabs>
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
            router.push("/workspaces");
          }}
        />
      )}
    </PageLayout>
  );
}
