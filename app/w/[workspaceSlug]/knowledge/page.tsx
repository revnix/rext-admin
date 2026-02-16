"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw } from "lucide-react";
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
import { useWorkspacePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import type { KnowledgeBase } from "@/lib/api-client/knowledge";
import { KNOWLEDGE_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

export default function WorkspaceKnowledgePage() {
  const { workspace, workspaceId, workspaceSlug } = useWorkspace();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { hasPermission: canCreateKnowledge, isLoading: isPermissionLoading } =
    useWorkspacePermission(KNOWLEDGE_PERMISSIONS.CREATE, workspaceId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [kbToEdit, setKbToEdit] = useState<KnowledgeBase | null>(null);
  const [kbToDelete, setKbToDelete] = useState<KnowledgeBase | null>(null);

  const {
    data: response,
    isLoading: isKnowledgeLoading,
  } = useQuery({
    queryKey: ["knowledge-bases", workspace?.id],
    queryFn: () => apiClient.knowledge.listBases(workspace?.id || ""),
    enabled: !!workspace?.id,
    staleTime: 2 * 60 * 1000,
    throwOnError: true,
  });

  const knowledgeBases = response?.knowledge_bases || [];
  const totalCount = response?.total_count || 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["knowledge-bases", workspace?.id],
    });
  };

  const handleCreated = () => handleRefresh();
  const handleEdited = () => handleRefresh();
  const handleDeleted = () => handleRefresh();

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
        disabled={isKnowledgeLoading}
      >
        <RefreshCw
          className={`h-4 w-4 ${isKnowledgeLoading ? "animate-spin" : ""}`}
        />
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
      {/* Loading state inside layout */}
      {!workspace?.id || isPermissionLoading ? (
        <div className={`flex h-screen items-center justify-center`}>
          <div className="space-y-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : (
        <CanAccess
          permission={KNOWLEDGE_PERMISSIONS.READ}
          fallback={
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Access Denied
                </CardTitle>
                <CardDescription>
                  You don’t have permission to view knowledge bases in this
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
            {/* Stats */}
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

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Bases</CardTitle>
                <CardDescription>
                  {totalCount} {totalCount === 1 ? "base" : "bases"} in{" "}
                  {workspace?.title || "this workspace"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkspaceKnowledgeBasesTable
                  knowledgeBases={knowledgeBases}
                  onView={handleView}
                  onEdit={setKbToEdit}
                  onDelete={setKbToDelete}
                  isLoading={isKnowledgeLoading}
                />
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
      )}
    </PageLayout>
  );
}
