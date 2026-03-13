"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Eye,
  FileText,
  Globe,
  Plus,
  Settings,
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
import { useWorkspaceStore } from "@/stores/workspace";
import type { Column, RowAction, WorkspaceData } from "@/types/data-table";
import type { Workspace, WorkspaceListResponse } from "@/types/workspace";
import type { Route } from "next";

export default function WorkspacePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogWorkspace, setDeleteDialogWorkspace] =
    useState<WorkspaceData | null>(null);
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
    refetch,
  } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => apiClient.workspaces.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transform workspaces to include title field and handle API response structure
  const transformedWorkspaces: WorkspaceData[] = (
    (workspacesResponse?.workspaces as unknown as Workspace[]) || []
  ).map((workspace: Workspace) => ({
    id: workspace.id,
    title: workspace.name || "Untitled Workspace",
    name: workspace.name,
    slug: workspace.slug,
    timezone: workspace.timezone,
    url: workspace.url ?? "",
    created_at: workspace.created_at,
    updated_at: workspace.updated_at,
    knowledge_stats: workspace.knowledge_stats as WorkspaceData["knowledge_stats"],
    // Brand voice might be missing from the schema but present in reality, 
    // or we may need a separate fetch. For now, cast to maintain safety net where possible.
    brand_voice: (workspace as any).brand_voice as WorkspaceData["brand_voice"],
    status: workspace.status || "active",
    owner: workspace.owner as WorkspaceData["owner"],
  }));

  // Define columns for the DataTable
  const columns: Column<WorkspaceData>[] = [
    {
      key: "title",
      header: "Name",
      width: "300px",
      cell: (value: unknown, row: WorkspaceData) => (
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {String(value || "W")
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Link
                href={`/w/${row.slug}/settings` as Route}
                className="font-medium hover:text-primary hover:underline transition-colors cursor-pointer"
                onClick={() => setCurrentWorkspace(row as unknown as Workspace)}
              >
                {String(value || "")}
              </Link>
              {currentWorkspace?.id === row.id && (
                <Badge variant="default" className="text-xs px-1.5 py-0">
                  Current
                </Badge>
              )}
            </div>
            {row.timezone ? (
              <span className="text-xs text-muted-foreground line-clamp-1 mt-1">
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
      width: "200px",
      cell: (value: unknown) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{String(value || "")}</span>
        </div>
      ),
    },
    {
      key: "knowledge_stats",
      header: "Knowledge",
      width: "120px",
      cell: (_value: unknown, row: WorkspaceData) => {
        const stats = row.knowledge_stats as any;
        const total = stats?.total || 0;
        return (
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{String(total)} items</span>
          </div>
        );
      },
    },
    {
      key: "brand_voice",
      header: "Brand Voice",
      width: "100px",
      cell: (_value: unknown, row: WorkspaceData) =>
        row.brand_voice ? (
          <Badge variant="secondary" className="text-xs">
            Active
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      key: "owner",
      header: "Owner",
      width: "150px",
      cell: (_value: unknown, row: WorkspaceData) => {
        const owner = row.owner as any;
        return owner ? (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{String(owner.name || "")}</span>
            <span className="text-xs text-muted-foreground">{String(owner.email || "")}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      cell: (value: unknown) => (
        <Badge
          variant={String(value) === "active" ? "default" : "secondary"}
          className="text-xs"
        >
          {String(value || "active")}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      width: "130px",
      cell: (value: unknown) => (
        <span className="text-sm text-muted-foreground">
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
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => refetch()}>
        <Settings className="h-4 w-4 mr-2" />
        Refresh
      </Button>
      <Button onClick={() => router.push("/w/create" as Route)}>
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
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: WorkspaceData) => {
        setDeleteDialogWorkspace(row);
      },
      variant: "destructive" as const,
      tooltip: "Delete workspace",
    },
  ];

  return (
    <PageLayout
      title="Workspaces"
      description="Manage your workspaces and organize your knowledge base"
    >
      <DataTable<WorkspaceData>
        columns={columns}
        data={transformedWorkspaces}
        emptyTitle="No workspaces yet"
        emptyDescription="Create your first workspace to start organizing your knowledge, content, and brand voice."
        emptyActions={emptyActions}
        emptyIcon={<Users className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search workspaces by name, URL, owner..."
        actions={tableActions}
        rowActions={rowActions}
        pageSize={10}
        searchFields={["title", "url", "timezone", "owner"]}
        isLoading={isLoading}
        searchWidth="md:w-[450px]"
        tableId="workspaces"
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
                  workspaces: (oldData.workspaces as any[]).filter(
                    (ws: any) => ws.id !== deletedWorkspaceId,
                  ),
                  total_count: Math.max(0, (oldData.total_count || 0) - 1),
                };
              },
            );

            // Also invalidate queries to ensure fresh data on next fetch
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
          }}
          onError={(error) => {
            log.error("Failed to delete workspace:", error);
            toast.error("Failed to delete workspace. Please try again.");
          }}
        />
      )}
    </PageLayout>
  );
}
