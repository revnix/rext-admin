"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";

/**
 * Legacy Content Create Page - DEPRECATED
 *
 * This page redirects to workspace-scoped content creation page.
 * All content creation should be done via /w/{workspaceSlug}/content/create
 */
export default function LegacyContentCreatePage() {
  const router = useRouter();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const recentWorkspaces = useWorkspaceStore((state) => state.recentWorkspaces);
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);

  useEffect(() => {
    // If user has a current workspace, redirect to its content creation page
    if (currentWorkspace?.slug) {
      router.push(`/w/${currentWorkspace.slug}/content/create`);
      return;
    }

    // If user has recent workspaces, redirect to the most recent one's content creation page
    if (recentWorkspaces && recentWorkspaces.length > 0) {
      const recentWorkspace = workspaceList.find(
        (ws) => ws.id === recentWorkspaces[0],
      );
      if (recentWorkspace?.slug) {
        router.push(`/w/${recentWorkspace.slug}/content/create`);
        return;
      }
    }

    // If no workspace context, redirect to workspaces selection page
    router.push("/workspaces");
  }, [currentWorkspace, recentWorkspaces, workspaceList, router]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">
          Redirecting to workspace content creation...
        </p>
      </div>
    </div>
  );
}
