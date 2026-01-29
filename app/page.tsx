"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { MetricsCards } from "@/components/dashboard/revamp/metrics-cards";
import { ContentPipeline } from "@/components/dashboard/revamp/content-pipeline";
import { RecentContent } from "@/components/dashboard/revamp/recent-content";
import { WorkspaceStats } from "@/components/dashboard/revamp/workspace-stats";
import { QuickActions } from "@/components/dashboard/revamp/quick-actions";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnboardingProgress } from "@/hooks/use-onboarding-progress";
import { usePageTitle } from "@/hooks/use-page-title";
import { useWorkspaceAutoSelect } from "@/hooks/use-workspace-auto-select";
import { PageLoader } from "@/components/ui/loading-states";

export default function DashboardPage() {
  const breadcrumbs = [{ label: "Dashboard" }];
  // Auto-select workspace on load
  const {
    workspace: currentWorkspace,
    isLoading: isLoadingWorkspaces,
    hasWorkspaces,
  } = useWorkspaceAutoSelect();
  const router = useRouter();

  // Redirect to workspace creation if no workspaces exist
  useEffect(() => {
    if (!isLoadingWorkspaces && !hasWorkspaces) {
      router.push("/w/create");
    }
  }, [isLoadingWorkspaces, hasWorkspaces, router]);

  // Check if onboarding is complete for current workspace
  const { isLoading } = useOnboardingProgress(currentWorkspace?.id);

  // Update page title and description
  usePageTitle(
    currentWorkspace?.title
      ? `${currentWorkspace.title} - Dashboard`
      : "Dashboard",
    currentWorkspace
      ? `Welcome to ${currentWorkspace.title}. Monitor your progress and manage your workspace.`
      : "Overview of your content performance, automation flows, and key metrics. Monitor your AI-powered content strategy at a glance.",
  );

  // Show loading state while fetching workspaces
  if (isLoadingWorkspaces || isLoading) {
    return <PageLoader message="Loading your workspace..." />;
  }

  // Show empty state only if no workspaces exist
  // We return null if we're about to redirect to prevent flicker
  if (!hasWorkspaces) {
    return null;
  }

  return (
    <AuthGuard>
      <PageLayout
        title={currentWorkspace?.title || "Dashboard"}
        description={`Welcome to ${currentWorkspace?.title || "your workspace"}. Monitor your progress and manage your workspace.`}
        breadcrumbs={breadcrumbs}
      >
        <div className="flex flex-col gap-8">
          {/* Top Section: Metrics Cards */}
          <MetricsCards workspace={currentWorkspace} />

          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            {/* Main Content */}
            <div className="space-y-8">
              {/* Content Pipeline */}
              <ContentPipeline />

              {/* Recent Content */}
              <RecentContent workspace={currentWorkspace} />
            </div>

            {/* Sidebar - Always visible */}
            <aside className="space-y-8">
              <QuickActions workspace={currentWorkspace} />
              <WorkspaceStats workspace={currentWorkspace} />
            </aside>
          </div>
        </div>
      </PageLayout>
    </AuthGuard>
  );
}
