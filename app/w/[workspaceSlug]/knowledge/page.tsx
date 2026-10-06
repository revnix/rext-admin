"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListPage } from "@/components/layouts";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  WorkspaceCreateKnowledgeBaseDialog,
  WorkspaceDeleteKnowledgeBaseDialog,
  WorkspaceEditKnowledgeBaseDialog,
  WorkspaceKnowledgeBasesTable,
} from "@/components/workspace";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import type { KnowledgeBase } from "@/lib/api-client/knowledge";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";
import type { Route } from "next";

export default function WorkspaceKnowledgePage() {
  const { workspace, workspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const router = useRouter();

  // workspace.update backs knowledge create/edit AND delete on the backend, so
  // the same permission gates the Delete action here.
  const { hasPermission: canCreateKnowledge, isLoading: isPermissionLoading } =
    useWorkspacePermission(WORKSPACE_PERMISSIONS.UPDATE, workspaceId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [kbToEdit, setKbToEdit] = useState<KnowledgeBase | null>(null);
  const [kbToDelete, setKbToDelete] = useState<KnowledgeBase | null>(null);

  const { data: response, isLoading: isKnowledgeLoading } = useQuery({
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

  const handleRowClick = (kb: KnowledgeBase) => {
    if (!workspace?.slug) return;
    router.push(`/w/${workspace.slug}/knowledge/${kb.id}` as Route);
  };

  // Calculate stats
  const totalItems = knowledgeBases.reduce(
    (sum, kb) => sum + kb.items_count,
    0,
  );
  const customBasesCount = knowledgeBases.filter(
    (kb) => kb.type === "custom",
  ).length;

  return (
    <ListPage
      title="Knowledge Bases"
      description="Upload documents, brand guidelines, and target audience profiles to train AI generators."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isKnowledgeLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                isKnowledgeLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
          {canCreateKnowledge && (
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Knowledge Base
            </Button>
          )}
        </div>
      }
    >
      {isPermissionLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="space-y-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-foreground" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : (
        <PermissionGuard
          permission={WORKSPACE_PERMISSIONS.READ}
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
                  <code className="text-xs bg-muted px-1 rounded-md">
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
                  {workspace?.name || "this workspace"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkspaceKnowledgeBasesTable
                  knowledgeBases={knowledgeBases}
                  onView={handleRowClick}
                  onEdit={setKbToEdit}
                  onDelete={canCreateKnowledge ? setKbToDelete : undefined}
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
        </PermissionGuard>
      )}
    </ListPage>
  );
}
