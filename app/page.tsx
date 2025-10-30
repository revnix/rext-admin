"use client";

import { AuthGuard } from "@/components/auth-guard";
import { EnhancedDashboardEmptyState } from "@/components/dashboard/enhanced-dashboard-empty-state";
import { PendingInvitationsCard } from "@/components/dashboard/pending-invitations-card";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { WorkspaceInfoCard } from "@/components/dashboard/workspace-info-card";
import { WorkspaceStatsGrid } from "@/components/dashboard/workspace-stats-grid";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnboardingProgress } from "@/hooks/use-onboarding-progress";
import { usePageTitle } from "@/hooks/use-page-title";
import { useWorkspaceAutoSelect } from "@/hooks/use-workspace-auto-select";

export default function DashboardPage() {
  const breadcrumbs = [{ label: "Dashboard" }];

  // Auto-select workspace on load
  const {
    workspace: currentWorkspace,
    isLoading: isLoadingWorkspaces,
    hasWorkspaces,
  } = useWorkspaceAutoSelect();

  // Check if onboarding is complete for current workspace
  const {
    isComplete: isOnboardingComplete,
    isDismissed,
    isLoading,
  } = useOnboardingProgress(currentWorkspace?.id);

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
    return (
      <AuthGuard>
        <PageLayout
          title="Dashboard"
          description="Loading your workspace..."
          breadcrumbs={breadcrumbs}
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <aside className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </aside>
          </div>
        </PageLayout>
      </AuthGuard>
    );
  }

  // Show empty state only if no workspaces exist
  if (!hasWorkspaces) {
    return (
      <AuthGuard>
        <PageLayout
          title="Dashboard"
          description="Welcome to Wrext! Let's get you started."
          breadcrumbs={breadcrumbs}
        >
          <EnhancedDashboardEmptyState />
        </PageLayout>
      </AuthGuard>
    );
  }

  // If user has workspaces, show full dashboard with optional onboarding tracking
  const showOnboardingTracking = !isOnboardingComplete && !isDismissed;

  return (
    <AuthGuard>
      <PageLayout
        title={currentWorkspace?.title || "Dashboard"}
        description={`Welcome to ${currentWorkspace?.title || "your workspace"}. Monitor your progress and manage your workspace.`}
        breadcrumbs={breadcrumbs}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Onboarding Progress - Shows until complete or dismissed */}
            {showOnboardingTracking && (
              <OnboardingProgress workspaceId={currentWorkspace?.id} />
            )}

            {/* Always show workspace stats */}
            <WorkspaceStatsGrid workspace={currentWorkspace} />

            {/* Always show recent activity */}
            <RecentActivityCard workspace={currentWorkspace} />
          </div>

          {/* Sidebar - Always visible */}
          <aside className="space-y-6">
            <PendingInvitationsCard />
            <WorkspaceInfoCard workspace={currentWorkspace} />
            <QuickActionsCard workspace={currentWorkspace} />
          </aside>
        </div>
      </PageLayout>
    </AuthGuard>
  );
}
