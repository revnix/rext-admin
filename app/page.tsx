"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { MetricsCards } from "@/components/dashboard/revamp/metrics-cards";
import { RecentContent } from "@/components/dashboard/revamp/recent-content";
import { QuickActions } from "@/components/dashboard/revamp/quick-actions";
import { PageLayout } from "@/components/page-layout";
import { useOnboardingProgress } from "@/hooks/use-onboarding-progress";
import { usePageTitle } from "@/hooks/use-page-title";
import { useWorkspaceAutoSelect } from "@/hooks/use-workspace-auto-select";
import { PageLoader } from "@/components/ui/loading-states";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { APIErrorBoundary } from "@/components/ui/error-boundary";

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

  // Data Fetching: Total Workspaces
  const { data: workspacesResponse } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => apiClient.workspaces.list(),
    staleTime: 5 * 60 * 1000,
    throwOnError: true,
    enabled: !!currentWorkspace, // Only fetch if we have workspaces generally
  });

  // Data Fetching: Dashboard Stats
  const { data: dashboardStats, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ["dashboard-stats", currentWorkspace?.id],
    // biome-ignore lint/style/noNonNullAssertion: guarded by enabled check below
    queryFn: () => apiClient.dashboard.getStats(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id,
    throwOnError: true,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });

  // Total Workspaces Count
  const _totalWorkspaces = workspacesResponse?.total || 0;

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
      <APIErrorBoundary>
      <PageLayout
        title={currentWorkspace?.title || "Dashboard"}
        description={`Welcome to ${currentWorkspace?.title || "your workspace"}. Monitor your progress and manage your workspace.`}
        breadcrumbs={breadcrumbs}
      >
          <div className="flex flex-col gap-8">
            {/* Top Row: Metrics Cards (5 Cards) */}
            <MetricsCards
              dashboardStats={dashboardStats}
              isLoading={isLoadingDashboard}
            />

            {/* Middle Row: Charts (Static Mocks) */}
            {/* <DashboardCharts /> */}

            {/* Bottom Row: Recent Activities & Quick Actions */}
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              {/* Main Content: Recent Activities Table */}
              <div className="space-y-8">
                <RecentContent workspace={currentWorkspace} />
              </div>

              {/* Sidebar: Quick Actions List */}
              <aside className="space-y-8 h-full">
                <QuickActions workspace={currentWorkspace} />
              </aside>
            </div>
          </div>
      </PageLayout>
      </APIErrorBoundary>
    </AuthGuard>
  );
}
