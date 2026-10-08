"use client";

import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, RefreshCw, Settings2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ListPage } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableRowAction,
  UNKNOWN,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LockedFeatureTooltip } from "@/components/permission/locked-feature-tooltip";
import { useResourceLimit } from "@/components/subscription/usage-limit-warning";
import { WorkspaceDeleteDialog } from "@/components/workspace";
import { usePageTitle } from "@/hooks/use-page-title";
import { apiClient } from "@/lib/api-client";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { log } from "@/lib/logger";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { workspaceQueries } from "@/lib/query-keys";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspaceStore } from "@/stores/workspace";
import type {
  Workspace,
  WorkspaceData,
  WorkspaceListResponse,
} from "@/types/workspace";
import type { Route } from "next";

function WorkspaceName({ row }: { row: WorkspaceData }) {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2">
        <Link
          // Opens the workspace dashboard (`/` renders the current
          // workspace), so the row becomes current before navigating.
          href={workspaceRoutes.root(row.slug) as Route}
          // The user clicks at most one row, so prefetch on hover only.
          prefetch={false}
          className="truncate rounded-sm font-medium text-foreground underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setCurrentWorkspace(row as unknown as Workspace)}
        >
          {row.title}
        </Link>
        {currentWorkspace?.id === row.id && (
          <Badge variant="neutral">Current</Badge>
        )}
      </p>
      {typeof row.timezone === "string" && row.timezone && (
        <p className="truncate text-muted-foreground">{row.timezone}</p>
      )}
    </div>
  );
}

const column = createDataTableColumnHelper<WorkspaceData>();

const columns = column.columns([
  column.accessor("title", {
    header: "Name",
    cell: ({ row }) => <WorkspaceName row={row.original} />,
    sortFn: "text",
    enableHiding: false,
  }),
  column.accessor((ws) => ws.url ?? "", {
    id: "url",
    header: "Website",
    cell: ({ getValue }) => (
      <span className="block truncate text-muted-foreground">
        {getValue() || UNKNOWN}
      </span>
    ),
  }),
  column.accessor((ws) => Date.parse(ws.created_at) || 0, {
    id: "created_at",
    header: "Created",
    meta: { align: "end", numeric: true },
    cell: ({ row }) => dateFormat.short(row.original.created_at) || UNKNOWN,
    sortFn: "basic",
    enableGlobalFilter: false,
  }),
]);

export default function WorkspacePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLimitReached, isLoading: isLimitLoading } =
    useResourceLimit("workspaces");
  const [deleteDialogWorkspace, setDeleteDialogWorkspace] =
    useState<WorkspaceData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );

  // Update page title
  usePageTitle(
    "Workspaces",
    "Manage your workspaces and configure their brand voice for content creation.",
  );

  // Query workspaces from API
  const {
    data: workspacesResponse,
    isLoading,
    isFetching,
  } = useQuery({
    ...workspaceQueries.list(),
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

  const tableActions = (
    <>
      <Button
        data-rec="show"
        variant="outline"
        size="icon"
        className="size-9"
        onClick={handleRefresh}
        disabled={isLoading || isFetching || isRefreshing}
        aria-label="Refresh workspaces"
      >
        <RefreshCw
          className={
            isLoading || isFetching || isRefreshing ? "animate-spin" : undefined
          }
        />
      </Button>
      {isLimitReached ? (
        <LockedFeatureTooltip message="Upgrade your plan to create more workspaces.">
          <Button data-rec="show" size="sm" className="h-9" disabled>
            <Plus />
            Limit reached
          </Button>
        </LockedFeatureTooltip>
      ) : (
        <Button
          data-rec="show"
          size="sm"
          className="h-9"
          onClick={() => router.push("/w/create" as Route)}
          disabled={isLimitLoading}
        >
          <Plus />
          {isLimitLoading ? "Checking plan…" : "New workspace"}
        </Button>
      )}
    </>
  );

  const rowActions = (row: WorkspaceData): DataTableRowAction[] => [
    {
      label: "Make current",
      icon: Check,
      disabled: currentWorkspace?.id === row.id ? "Already current" : false,
      onSelect: () => {
        setCurrentWorkspace(row as unknown as Workspace);
        toast.success(`Switched to ${row.title}`);
      },
    },
    {
      label: "Settings",
      icon: Settings2,
      disabled: canUpdateWorkspace[row.id]
        ? false
        : "You can't change this workspace's settings",
      onSelect: () => {
        setCurrentWorkspace(row as unknown as Workspace);
        router.push(workspaceRoutes.settings.root(row.slug) as Route);
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      destructive: true,
      disabled: canDeleteWorkspace[row.id]
        ? false
        : "You can't delete this workspace",
      onSelect: () => setDeleteDialogWorkspace(row),
    },
  ];

  return (
    <ListPage title="Workspaces" description="Manage your workspaces">
      <DataTable
        caption="Workspaces"
        columns={columns}
        data={transformedWorkspaces}
        getRowId={(ws) => ws.id}
        getRowLabel={(ws) => ws.title}
        isLoading={isLoading}
        search={{ placeholder: "Search by name or website" }}
        actions={tableActions}
        rowActions={rowActions}
        pageSizeOptions={[10, 25, 50]}
        emptyState={
          <EmptyState
            title="No workspaces yet"
            description="Create your first workspace to set up its brand voice and start writing."
            action={{ label: "Create workspace", href: "/w/create" }}
          />
        }
        renderCard={(ws, { actions }) => (
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <WorkspaceName row={ws} />
              <p className="truncate text-muted-foreground">
                {ws.url || UNKNOWN}
              </p>
            </div>
            {actions}
          </div>
        )}
      />

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
    </ListPage>
  );
}
