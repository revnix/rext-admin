"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";

/**
 * Legacy Topics Page - DEPRECATED
 *
 * This page redirects to workspace-scoped topics page.
 * All topics should be accessed via /w/{workspaceSlug}/topics
 */
export default function LegacyTopicsPage() {
  const router = useRouter();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const recentWorkspaces = useWorkspaceStore((state) => state.recentWorkspaces);
  const workspaceList = useWorkspaceStore((state) => state.workspaceList);

  useEffect(() => {
    // If user has a current workspace, redirect to its topics page
    if (currentWorkspace?.slug) {
      router.push(`/w/${currentWorkspace.slug}/topics`);
      return;
    }

    // If user has recent workspaces, redirect to the most recent one's topics page
    if (recentWorkspaces && recentWorkspaces.length > 0) {
      const recentWorkspace = workspaceList.find(
        (ws) => ws.id === recentWorkspaces[0],
      );
      if (recentWorkspace?.slug) {
        router.push(`/w/${recentWorkspace.slug}/topics`);
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
          Redirecting to workspace topics...
        </p>
      </div>
    </div>
  );
}
