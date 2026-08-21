"use client";

import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Eye,
  FileText,
  Globe,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkspaceDeleteDialog } from "@/components/workspace";
import { usePageTitle } from "@/hooks/use-page-title";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { workspaceQueries } from "@/lib/query-keys";
import { useWorkspaceStore } from "@/stores/workspace";
import type { Column, RowAction, WorkspaceData } from "@/types/data-table";
import type { Workspace, WorkspaceListResponse } from "@/types/workspace";
import type { Route } from "next";

export default function WorkspacePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogWorkspace, setDeleteDialogWorkspace] =
    useState<WorkspaceData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );
  const _deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace);

  // Update page title
  usePageTitle(
    "Workspaces",
    "Manage your workspaces, organize knowledge, and configure brand voice settings for AI-powered content creation.",
  );

  // Query workspaces from API
  const {
    data: workspacesResponse,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => apiClient.workspaces.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transform workspaces to include title field and handle API response structure
  const transformedWorkspaces: WorkspaceData[] = (
    workspacesResponse?.workspaces || []
  ).map((workspace: Workspace) => ({
    id: workspace.id,
    title: workspace.name || "Untitled Workspace",
    name: workspace.name, // Keep both for safety
    slug: workspace.slug, // Include slug for URL navigation
    timezone: workspace.timezone,
    url: workspace.url,
    created_at: workspace.created_at,
    updated_at: workspace.updated_at,
    knowledge_stats: workspace.knowledge_stats,
    brand_voice: workspace.brand_voice,
    status: "active", // Default status
    // Flatten some fields for easier global search
    owner_name: workspace.name, // Assuming the workspace name reflects the owner context in this view if no explicit owner
  }));

  // Fetch per-workspace delete permission so the Delete action can be hidden
  // for members (e.g. viewers) who aren't allowed to delete a workspace.
  const workspaceIds = transformedWorkspaces.map((w) => w.id);
  const permissionQueries = useQueries({
    queries: workspaceIds.map((workspaceId) => ({
      queryKey: ["workspace-permissions", workspaceId],
      queryFn: () => apiClient.workspaces.getPermissions(workspaceId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const canDeleteWorkspace: Record<string, boolean> = {};
  const canUpdateWorkspace: Record<string, boolean> = {};
  workspaceIds.forEach((workspaceId, index) => {
    const query = permissionQueries[index];
    // Default to allowed while permissions are still loading to avoid
    // flashing the action away; the backend still enforces the real check.
    canDeleteWorkspace[workspaceId] = query.data
      ? query.data.permissions.includes(WORKSPACE_PERMISSIONS.DELETE)
      : true;
    canUpdateWorkspace[workspaceId] = query.data
      ? query.data.permissions.includes(WORKSPACE_PERMISSIONS.UPDATE)
      : true;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: workspaceQueries.all(),
        refetchType: "none",
      });
      await queryClient.refetchQueries({
        queryKey: workspaceQueries.all(),
        type: "all",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Define columns for the DataTable
  const columns: Column<WorkspaceData>[] = [
    {
      key: "title",
      header: "Name",
      width: "200px",
      searchable: true,
      cell: (value: unknown, row: WorkspaceData) => (
        <div className="flex items-start gap-2 min-w-[150px]">
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {String(value || "W")
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/w/${row.slug}/settings` as Route}
                className="font-medium hover:text-primary hover:underline transition-colors cursor-pointer truncate"
                onClick={() => setCurrentWorkspace(row as unknown as Workspace)}
              >
                {String(value || "")}
              </Link>
              {currentWorkspace?.id === row.id && (
                <Badge variant="default" className="text-[10px] px-1 py-0 h-4">
                  Current
                </Badge>
              )}
            </div>
            {row.timezone ? (
              <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                {String(row.timezone)}
              </span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "url",
      header: "Website",
      width: "150px",
      searchable: true,
      cell: (value: unknown) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[120px]">
          <Globe className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{String(value || "")}</span>
        </div>
      ),
    },
    // {
    //   key: "knowledge_stats",
    //   header: "Knowledge",
    //   width: "100px",
    //   cell: (_value: unknown, row: WorkspaceData) => {
    //     const stats = row.knowledge_stats;
    //     const total = stats?.total || 0;
    //     return (
    //       <div className="flex items-center gap-1 text-sm whitespace-nowrap">
    //         <FileText className="h-4 w-4 text-muted-foreground" />
    //         <span>{total} items</span>
    //       </div>
    //     );
    //   },
    // },
    {
      key: "status",
      header: "Status",
      width: "80px",
      searchable: true,
      cell: (value: unknown) => (
        <Badge
          variant={String(value) === "active" ? "default" : "secondary"}
          className="text-[10px] px-1.5 py-0"
        >
          {String(value || "active")}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      width: "100px",
      cell: (value: unknown) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(String(value)).toLocaleDateString()}
        </span>
      ),
    },
  ];

  // Define empty state actions
  const emptyActions = [
    {
      label: "Create Workspace",
      icon: <Plus className="h-4 w-4" />,
      href: "/w/create",
    },
  ];

  // Define table actions
  const tableActions = (
    <div className="flex items-center gap-2 w-full">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        className="!w-[39%] sm:w-4"
        disabled={isLoading || isFetching || isRefreshing}
      >
        <RefreshCw
          className={`h-4 w-4 mr-2 ${isLoading || isFetching || isRefreshing ? "animate-spin" : ""}`}
        />
        Refresh
      </Button>
      <Button
        size="sm"
        className="!w-[59%] sm:w-4"
        onClick={() => router.push("/w/create" as Route)}
      >
        <Plus className="h-4 w-4 mr-2" />
        New Workspace
      </Button>
    </div>
  );

  // Define row actions
  const rowActions: RowAction<WorkspaceData>[] = [
    {
      label: "Select",
      icon: <Check className="h-4 w-4" />,
      onClick: (row: WorkspaceData) => {
        setCurrentWorkspace(row as unknown as Workspace);
        toast.success(`Switched to ${row.title}`);
      },
      tooltip: "Set as current workspace",
      primary: true,
      // Hide select button if workspace is already current
      disabled: (row: WorkspaceData) => currentWorkspace?.id === row.id,
    },
    {
      label: "View",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: WorkspaceData) => {
        setCurrentWorkspace(row as unknown as Workspace);
        router.push(`/w/${row.slug}/settings` as Route);
      },
      tooltip: "View workspace details",
      disabled: (row: WorkspaceData) => !canUpdateWorkspace[row.id],
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: WorkspaceData) => {
        setDeleteDialogWorkspace(row);
      },
      variant: "destructive" as const,
      tooltip: "Delete workspace",
      disabled: (row: WorkspaceData) => !canDeleteWorkspace[row.id],
    },
  ];

  return (
    <PageLayout
      title="Workspaces"
      description="Manage your workspaces and organize your knowledge base"
    >
      <div className="w-full lg:w-[68vw] xl:w-auto overflow-x-auto xl:overflow-hidden">
        <DataTable<WorkspaceData>
          columns={columns}
          data={transformedWorkspaces}
          emptyTitle="No workspaces yet"
          emptyDescription="Create your first workspace to start organizing your knowledge, content, and brand voice."
          emptyActions={emptyActions}
          emptyIcon={<Users className="h-8 w-8 text-muted-foreground" />}
          searchPlaceholder="Search workspaces by name, URL ..."
          actions={tableActions}
          rowActions={rowActions}
          pageSize={10}
          searchFields={["title", "url", "timezone", "status"]}
          isLoading={isLoading}
          searchWidth="md:w-[450px]"
          tableId="workspaces"
        />
      </div>

      {/* Delete Dialog */}
      {deleteDialogWorkspace && (
        <WorkspaceDeleteDialog
          workspace={deleteDialogWorkspace}
          open={!!deleteDialogWorkspace}
          onOpenChange={(open) => !open && setDeleteDialogWorkspace(null)}
          onDeleted={(deletedWorkspaceId) => {
            setDeleteDialogWorkspace(null);

            // Optimistically update the query cache to remove the deleted workspace immediately
            queryClient.setQueryData(
              ["workspaces"],
              (oldData: WorkspaceListResponse | undefined) => {
                if (!oldData?.workspaces) return oldData;
                return {
                  ...oldData,
                  workspaces: oldData.workspaces.filter(
                    (ws: Workspace) => ws.id !== deletedWorkspaceId,
                  ),
                  total: Math.max(0, (oldData.total || 0) - 1),
                };
              },
            );

            // Also invalidate queries to ensure fresh data on next fetch
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
          }}
          onRestored={() => {
            // Refetch so the restored workspace reappears in the list
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
          }}
          onError={(error) => {
            log.error("Failed to delete workspace:", error);
          }}
        />
      )}
    </PageLayout>
  );
}
