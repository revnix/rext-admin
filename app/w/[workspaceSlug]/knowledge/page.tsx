"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { WorkspaceCreateKnowledgeBaseDialog } from "@/components/workspace/workspace-create-knowledge-base-dialog";
import { WorkspaceDeleteKnowledgeBaseDialog } from "@/components/workspace/workspace-delete-knowledge-base-dialog";
import { WorkspaceEditKnowledgeBaseDialog } from "@/components/workspace/workspace-edit-knowledge-base-dialog";
import { WorkspaceKnowledgeBasesTable } from "@/components/workspace/workspace-knowledge-bases-table";
import { usePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import type { KnowledgeBase } from "@/lib/api-client/knowledge";
import { KNOWLEDGE_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

/**
 * Workspace Knowledge Page
 *
 * Displays and manages workspace knowledge bases.
 * Each knowledge base groups related knowledge items (web, file, text).
 *
 * Features:
 * - List all knowledge bases with items count
 * - Create new knowledge bases
 * - Edit knowledge base details
 * - Delete custom knowledge bases (default protected)
 * - View knowledge base items
 */
export default function WorkspaceKnowledgePage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Check permission for creating knowledge bases
  const canCreateKnowledge = usePermission(KNOWLEDGE_PERMISSIONS.CREATE);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [kbToEdit, setKbToEdit] = useState<KnowledgeBase | null>(null);
  const [kbToDelete, setKbToDelete] = useState<KnowledgeBase | null>(null);

  // Fetch knowledge bases
  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["knowledge-bases", workspace?.id],
    queryFn: () => apiClient.knowledge.listBases(workspace?.id || ""),
    enabled: !!workspace?.id,
    staleTime: 2 * 60 * 1000,
  });

  const knowledgeBases = response?.knowledge_bases || [];
  const totalCount = response?.total_count || 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["knowledge-bases", workspace?.id],
    });
  };

  const handleCreated = () => {
    handleRefresh();
  };

  const handleEdited = () => {
    handleRefresh();
  };

  const handleDeleted = () => {
    handleRefresh();
  };

  const handleView = (kb: KnowledgeBase) => {
    // Navigate to knowledge base items page
    // For now, just show a toast - you can implement a detail page later
    router.push(`/w/${workspace?.slug}/knowledge/${kb.id}`);
  };

  // Calculate stats
  const totalItems = knowledgeBases.reduce(
    (sum, kb) => sum + kb.items_count,
    0,
  );
  const customBasesCount = knowledgeBases.filter(
    (kb) => kb.type === "custom",
  ).length;

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Knowledge" },
  ];

  const headerActions = (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      </Button>
      {canCreateKnowledge && (
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Knowledge Base
        </Button>
      )}
    </>
  );

  return (
    <PageLayout
      title="Knowledge"
      description="Organize and manage your workspace knowledge bases"
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      <CanAccess
        permission={KNOWLEDGE_PERMISSIONS.READ}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view knowledge bases in this
                workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  knowledge:read
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Knowledge Bases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {customBasesCount} custom, {totalCount - customBasesCount}{" "}
                  default
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Knowledge Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItems}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all knowledge bases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Items per Base
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalCount > 0 ? Math.round(totalItems / totalCount) : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average knowledge items
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Knowledge Bases Table */}
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Bases</CardTitle>
              <CardDescription>
                {totalCount} {totalCount === 1 ? "base" : "bases"} in{" "}
                {workspace?.title || "this workspace"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg border-destructive/50">
                  <BookOpen className="h-12 w-12 text-destructive mb-4" />
                  <p className="text-lg font-medium mb-2 text-destructive">
                    Failed to load knowledge bases
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    There was an error loading the knowledge bases list
                  </p>
                  <Button variant="outline" onClick={handleRefresh}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <WorkspaceKnowledgeBasesTable
                  knowledgeBases={knowledgeBases}
                  onView={handleView}
                  onEdit={setKbToEdit}
                  onDelete={setKbToDelete}
                  isLoading={isLoading}
                />
              )}
            </CardContent>
          </Card>

          {/* Dialogs */}
          <WorkspaceCreateKnowledgeBaseDialog
            workspaceId={workspace?.id || ""}
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onCreated={handleCreated}
          />

          <WorkspaceEditKnowledgeBaseDialog
            workspaceId={workspace?.id || ""}
            knowledgeBase={kbToEdit}
            open={!!kbToEdit}
            onOpenChange={(open) => !open && setKbToEdit(null)}
            onEdited={handleEdited}
          />

          <WorkspaceDeleteKnowledgeBaseDialog
            workspaceId={workspace?.id || ""}
            knowledgeBase={kbToDelete}
            open={!!kbToDelete}
            onOpenChange={(open) => !open && setKbToDelete(null)}
            onDeleted={handleDeleted}
          />
        </div>
      </CanAccess>
    </PageLayout>
  );
}
