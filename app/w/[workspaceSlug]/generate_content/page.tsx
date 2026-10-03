"use client";

import { Loader2 } from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { FreshGenerationView } from "@/components/generate-content/fresh-generation-view";
import { SelectionView } from "@/components/generate-content/selection-view";
import { PageLayout } from "@/components/page-layout";
import { PermissionGuard } from "@/components/permission/permission-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { isActiveGenerationJob } from "@/lib/generate-content/active-generation";
import { announceBackgroundGenerationRemoval } from "@/lib/generate-content/background-generation-sync";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";
import { useBackgroundGenerationStore } from "@/stores/background-generation-store";

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
  const backgroundJobsHydrated = useBackgroundGenerationStore(
    (state) => state.hasHydrated,
  );
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
    } else if (!libraryKeyword) {
      // Cancelling replaces `?thread=...` with the blank generation route.
      // Reset the mounted workflow as well so its loading/editor state cannot
      // remain visible after the URL changes.
      setSelectedLibraryKeyword(undefined);
      setView("selection");
    }
  }, [backgroundThreadId, libraryKeyword]);

  useEffect(() => {
    if (!backgroundJobsHydrated) {
      void useBackgroundGenerationStore.persist.rehydrate();
    }
  }, [backgroundJobsHydrated]);

  // Landing here with a generation already running used to force-redirect into
  // that job, which made the selection view unreachable and limited the user to
  // one generation at a time. Generations are independent LangGraph threads, so
  // there is no reason to block a second one: the dock keeps every running job
  // visible and is the way back into any of them.

  const handleStartFresh = () => {
    setSelectedLibraryKeyword(undefined);
    setView("fresh");
  };

  const handlePickFromLibrary = () => {
    setView("library");
    router.push(`/w/${workspace?.slug}/generate_content/library` as Route);
  };

  const handleBackToSelection = () => {
    const currentJobs = useBackgroundGenerationStore.getState().jobs;
    // Only drop jobs that are genuinely finished. The job being navigated away
    // from keeps running in the background, and a job paused for review reports
    // status "completed" while still needing the user — discarding either of
    // those is what made leaving a generation abandon it.
    const discardedThreadIds = currentJobs
      .filter(
        (job) =>
          job.workspaceSlug === workspace?.slug && !isActiveGenerationJob(job),
      )
      .map((job) => job.threadId);
    if (discardedThreadIds.length > 0) {
      const discarded = new Set(discardedThreadIds);
      useBackgroundGenerationStore
        .getState()
        .replaceJobs(currentJobs.filter((job) => !discarded.has(job.threadId)));
      announceBackgroundGenerationRemoval(discardedThreadIds);
    }

    setView("selection");
    setSelectedLibraryKeyword(undefined);
    if (backgroundThreadId && workspace?.slug) {
      router.replace(workspaceRoutes.generate_content(workspace.slug) as Route);
    }
  };

  // The loader only exists to avoid flashing the selection view before the
  // redirect to `?thread=...` lands. It must never swallow a *mounted* fresh
  // view: registering the job unmounted it mid-submit, and the unmount cleanup
  // aborted the very request that creates the run — leaving a runless thread
  // that polls "Queued for generation" forever and cannot be cancelled.
  // Only waits for persisted jobs to rehydrate. It must not also wait on an
  // active job existing — that was what hid the selection view behind a
  // permanent spinner while anything was still generating.
  const isResolvingActiveGeneration = !backgroundJobsHydrated;

  if (!workspace?.id || isPermLoading || isResolvingActiveGeneration) {
    return (
      <PageLayout title="Generate Content">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-foreground" />
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
                <code className="text-xs bg-muted px-1 rounded-md">
                  {CONTENT_PERMISSIONS.READ}
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
