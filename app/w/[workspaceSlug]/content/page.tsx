"use client";

import { AlertCircle, FileText, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ContentCard } from "@/components/content/content-card";
import { PageLayout } from "@/components/page-layout";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useContent, useDeleteContent } from "@/hooks/use-content";
import { usePageTitle } from "@/hooks/use-page-title";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";
import type { Route } from "next";

/**
 * ✅ Improved version:
 * - Keeps PageLayout always visible (no full-screen loading)
 * - Shows loader / error inline under PageLayout
 * - Handles permission & workspace consistency gracefully
 */
export default function WorkspaceContentPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");

  // Canonical workspace UUID for query keys and mutation payloads — the
  // content editor invalidates ["content", <uuid>]; keying these queries by
  // the URL slug meant the invalidation never matched (finding #10).
  const workspaceId = workspace?.id || "";

  // Workspace permissions
  const { hasPermission: canCreateContent, isLoading: isCreateLoading } =
    useWorkspacePermission(CONTENT_PERMISSIONS.CREATE, workspaceId);
  const { isLoading: isUpdateLoading } = useWorkspacePermission(
    CONTENT_PERMISSIONS.UPDATE,
    workspaceId,
  );
  const { hasPermission: canDeleteContent, isLoading: isDeleteLoading } =
    useWorkspacePermission(CONTENT_PERMISSIONS.DELETE, workspaceId);

  const isPermissionLoading =
    isCreateLoading || isUpdateLoading || isDeleteLoading;

  // Update page title and description
  usePageTitle(
    `Content Library - ${workspace?.name || "Workspace"}`,
    `Manage published and scheduled content for ${
      workspace?.name || "this workspace"
    }.`,
  );

  // Fetch content
  const {
    data: contentResponse,
    isLoading: isContentLoading,
    error,
  } = useContent(workspaceId);

  // Delete content mutation
  const deleteContentMutation = useDeleteContent();

  const handleDelete = async (contentId: string) => {
    await deleteContentMutation.mutateAsync({
      workspaceId,
      contentId,
    });
  };

  // Filter content based on search query
  const filteredContent = (contentResponse?.content || []).filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(searchLower) ||
      item.content_metadata?.content_type
        ?.toLowerCase()
        .includes(searchLower) ||
      item.status.toLowerCase().includes(searchLower) ||
      item.content_metadata?.target_platform
        ?.toLowerCase()
        .includes(searchLower)
    );
  });

  const headerActions = canCreateContent ? (
    <div className="flex w-full sm:w-auto items-center gap-2">
      <Button asChild className="w-full sm:w-auto">
        <Link href={workspaceRoutes.generate_content(workspaceSlug) as Route}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Content
        </Link>
      </Button>
    </div>
  ) : null;

  return (
    <PageLayout
      title="Generated Content"
      description={`View, edit, and manage AI-generated content for ${
        workspace?.name || "this workspace"
      }.`}
      actions={headerActions}
    >
      {/* Inline loader inside PageLayout */}
      {isPermissionLoading || isContentLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load content. Please try again.
          </AlertDescription>
        </Alert>
      ) : (
        <PermissionGuard
          permission={CONTENT_PERMISSIONS.READ}
          fallback={
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Access Denied
                </CardTitle>
                <CardDescription>
                  You don't have permission to view content in this workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Required permission:{" "}
                  <code className="text-xs bg-muted px-1 rounded">
                    content:read
                  </code>
                </p>
              </CardContent>
            </Card>
          }
        >
          <div className="space-y-6">
            {/* Search and Filters - Replicating DataTable search behavior */}
            {(contentResponse?.content || []).length > 0 && (
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search content..."
                    className="w-full pl-9 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            )}

            {filteredContent.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredContent.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    workspaceSlug={workspaceSlug}
                    onDelete={canDeleteContent ? handleDelete : undefined}
                  />
                ))}
              </div>
            ) : (
              /* Replicating DataTable empty state */
              <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg p-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No content available</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-2">
                  Content will be automatically generated and managed through
                  your configured flows.
                </p>
                {canCreateContent && (
                  <Button asChild className="mt-6">
                    <Link
                      href={
                        workspaceRoutes.generate_content(workspaceSlug) as Route
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Content
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </PermissionGuard>
      )}
    </PageLayout>
  );
}
