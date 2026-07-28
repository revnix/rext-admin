"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { SelectionView } from "@/components/generate-content/selection-view";
import { FreshGenerationView } from "@/components/generate-content/fresh-generation-view";
import { useRouter, useSearchParams } from "next/navigation";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Route } from "next";

type PageView = "selection" | "fresh" | "library";

export default function Page() {
  const { workspace, workspaceId } = useWorkspace();
  const router = useRouter();
  const { isLoading: isPermLoading } = useWorkspacePermission(
    CONTENT_PERMISSIONS.READ,
    workspaceId,
  );
  const { hasPermission: canCreate, isLoading: isCreatePermLoading } =
    useWorkspacePermission(CONTENT_PERMISSIONS.CREATE, workspaceId);
  const urlParams = useSearchParams();
  const libraryKeyword = urlParams.get("library");
  const libraryIntent = urlParams.get("intent");
  const backgroundThreadId = urlParams.get("thread");
  const isLibrary = libraryKeyword !== null;
  const [view, setView] = useState<PageView>(() =>
    libraryKeyword || backgroundThreadId ? "fresh" : "selection",
  );
  const [selectedLibraryKeyword, setSelectedLibraryKeyword] = useState<
    string | undefined
  >(libraryKeyword ?? undefined);

  useEffect(() => {
    if (libraryKeyword) {
      setSelectedLibraryKeyword(libraryKeyword);
      setView("fresh");
    }
  }, [libraryKeyword]);

  useEffect(() => {
    if (backgroundThreadId) {
      setView("fresh");
    }
  }, [backgroundThreadId]);

  const handleStartFresh = () => {
    setSelectedLibraryKeyword(undefined);
    setView("fresh");
  };

  const handlePickFromLibrary = () => {
    setView("library");
    router.push(`/w/${workspace?.slug}/generate_content/library` as Route);
  };

  const handleBackToSelection = () => {
    setView("selection");
    setSelectedLibraryKeyword(undefined);
  };

  if (!workspace?.id || isPermLoading) {
    return (
      <PageLayout title="Generate Content">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Generate Content"
      hideTitle={true}
      description={`View, edit, and manage AI-generated content for ${workspace?.name || "this workspace"}.`}
      fullWidth
      className="!py-0"
    >
      <PermissionGuard
        permission={CONTENT_PERMISSIONS.READ}
        showLoading={false}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to generate content in this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  content:create
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <div className="w-full">
          {view === "selection" && (
            <SelectionView
              onStartFresh={handleStartFresh}
              onPickFromLibrary={handlePickFromLibrary}
              canCreate={canCreate}
              isPermLoading={isCreatePermLoading}
            />
          )}
          {view === "fresh" && (
            <FreshGenerationView
              onBack={handleBackToSelection}
              initialKeyword={selectedLibraryKeyword}
              initialIntent={libraryIntent ?? undefined}
              isLibrary={isLibrary}
              backgroundThreadId={backgroundThreadId ?? undefined}
            />
          )}
        </div>
      </PermissionGuard>
    </PageLayout>
  );
}
