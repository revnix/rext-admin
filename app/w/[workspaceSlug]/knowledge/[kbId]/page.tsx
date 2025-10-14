"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Plus, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CanAccess } from "@/components/permissions/can-access";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorkspaceAddKnowledgeDialog } from "@/components/workspace/workspace-add-knowledge-dialog";
import { WorkspaceDeleteKnowledgeDialog } from "@/components/workspace/workspace-delete-knowledge-dialog";
import { WorkspaceEditKnowledgeDialog } from "@/components/workspace/workspace-edit-knowledge-dialog";
import {
  convertToKnowledgeItems,
  type KnowledgeItem,
  WorkspaceKnowledgeTable,
} from "@/components/workspace/workspace-knowledge-table";
import { apiClient } from "@/lib/api-client";
import { KNOWLEDGE_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";

/**
 * Knowledge Base Detail Page
 *
 * Displays all knowledge items (web, file, text) within a specific knowledge base.
 *
 * Features:
 * - Show KB name and description
 * - List all items in the KB
 * - Add new items to the KB
 * - Edit/delete items
 * - Back navigation to KB list
 */
export default function KnowledgeBaseDetailPage() {
  const { workspace } = useWorkspace();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const kbId = params.kbId as string;

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<KnowledgeItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);

  // Fetch knowledge base details
  const {
    data: kbResponse,
    isLoading: isLoadingKb,
    error: kbError,
  } = useQuery({
    queryKey: ["knowledge-base", workspace?.id, kbId],
    queryFn: () => apiClient.knowledge.getBase(workspace?.id || "", kbId, true),
    enabled: !!workspace?.id && !!kbId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch knowledge items (web, file, text) - filtered by KB on backend
  const { data: webKnowledge = [], isLoading: isLoadingWeb } = useQuery({
    queryKey: ["web-knowledge", workspace?.id],
    queryFn: () => apiClient.knowledge.listWeb(workspace?.id || ""),
    enabled: !!workspace?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: fileKnowledge = [], isLoading: isLoadingFiles } = useQuery({
    queryKey: ["file-knowledge", workspace?.id],
    queryFn: () => apiClient.knowledge.listFiles(workspace?.id || ""),
    enabled: !!workspace?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: textKnowledge = [], isLoading: isLoadingText } = useQuery({
    queryKey: ["text-knowledge", workspace?.id],
    queryFn: () => apiClient.knowledge.listText(workspace?.id || ""),
    enabled: !!workspace?.id,
    staleTime: 2 * 60 * 1000,
  });

  const kb = kbResponse?.knowledge_base;
  const isLoading =
    isLoadingKb || isLoadingWeb || isLoadingFiles || isLoadingText;

  // Filter items by knowledge_base_id
  const filteredWeb = webKnowledge.filter(
    (item) => item.knowledge_base_id === kbId,
  );
  const filteredFiles = fileKnowledge.filter(
    (item) => item.knowledge_base_id === kbId,
  );
  const filteredText = textKnowledge.filter(
    (item) => item.knowledge_base_id === kbId,
  );

  // Convert to unified format
  const knowledgeItems = convertToKnowledgeItems(
    filteredWeb,
    filteredFiles,
    filteredText,
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["knowledge-base", workspace?.id, kbId],
    });
    queryClient.invalidateQueries({
      queryKey: ["web-knowledge", workspace?.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["file-knowledge", workspace?.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["text-knowledge", workspace?.id],
    });
  };

  const handleBack = () => {
    router.push(`/w/${workspace?.slug}/knowledge`);
  };

  const handleAdded = () => {
    handleRefresh();
  };

  const handleEdited = () => {
    handleRefresh();
  };

  const handleDeleted = () => {
    handleRefresh();
  };

  if (kbError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg border-destructive/50">
              <BookOpen className="h-12 w-12 text-destructive mb-4" />
              <p className="text-lg font-medium mb-2 text-destructive">
                Knowledge Base Not Found
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                The requested knowledge base could not be loaded
              </p>
              <Button variant="outline" onClick={handleBack}>
                Back to Knowledge Bases
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <CanAccess
      permission={KNOWLEDGE_PERMISSIONS.READ}
      fallback={
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this knowledge base.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Required permission:{" "}
              <code className="text-xs bg-muted px-1 rounded">
                knowledge.read
              </code>
            </p>
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {kb?.name || "Loading..."}
              </h1>
              {kb?.description && (
                <p className="text-muted-foreground mt-2">{kb.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Knowledge
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{knowledgeItems.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                In this knowledge base
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Websites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredWeb.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Web pages scraped
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Files & Text
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredFiles.length + filteredText.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredFiles.length} files, {filteredText.length} text entries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Knowledge Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Items</CardTitle>
            <CardDescription>
              {knowledgeItems.length}{" "}
              {knowledgeItems.length === 1 ? "item" : "items"} in{" "}
              {kb?.name || "this knowledge base"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkspaceKnowledgeTable
              items={knowledgeItems}
              onEdit={setItemToEdit}
              onDelete={setItemToDelete}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Dialogs */}
        <WorkspaceAddKnowledgeDialog
          workspaceId={workspace?.id || ""}
          knowledgeBaseId={kbId}
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAdded={handleAdded}
        />

        <WorkspaceEditKnowledgeDialog
          workspaceId={workspace?.id || ""}
          item={itemToEdit}
          open={!!itemToEdit}
          onOpenChange={(open) => !open && setItemToEdit(null)}
          onEdited={handleEdited}
        />

        <WorkspaceDeleteKnowledgeDialog
          workspaceId={workspace?.id || ""}
          item={itemToDelete}
          open={!!itemToDelete}
          onOpenChange={(open) => !open && setItemToDelete(null)}
          onDeleted={handleDeleted}
        />
      </div>
    </CanAccess>
  );
}
