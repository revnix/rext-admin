"use client";

import { useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { GoogleConnectionGate } from "@/components/integrations/google/google-connection-gate";
import { GoogleKpiCards } from "@/components/integrations/google/google-kpi-cards";
import { GoogleSectionTabs } from "@/components/integrations/google/google-section-tabs";
import { GoogleTrendCharts } from "@/components/integrations/google/google-trend-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoogleDashboard } from "@/hooks/use-google-dashboard";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";

const DEFAULT_WINDOW_DAYS = 28;

function DashboardContent({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId: string;
  workspaceSlug: string;
}) {
  const [days] = useState(DEFAULT_WINDOW_DAYS);
  const { data, isLoading } = useGoogleDashboard(workspaceId, days);

  return (
    <div className="space-y-6">
      <GoogleSectionTabs workspaceSlug={workspaceSlug} />

      {isLoading || !data ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton count
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton count
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <GoogleKpiCards kpis={data.kpis} />
          <GoogleTrendCharts charts={data.charts} />
        </>
      )}
    </div>
  );
}

export default function GoogleDashboardPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const { hasPermission: canManage, isLoading: isPermLoading } =
    useWorkspacePermission(WORKSPACE_PERMISSIONS.UPDATE, workspace?.id);

  if (!workspace?.id || isPermLoading) {
    return (
      <PageLayout title="Loading...">
        <Skeleton className="h-64 w-full" />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Google Search Console & Analytics"
      description="Organic search performance for this workspace's published content."
    >
      <GoogleConnectionGate
        workspaceId={workspace.id}
        workspaceSlug={workspaceSlug}
        canManage={canManage}
        showSiteMapping
      >
        <DashboardContent
          workspaceId={workspace.id}
          workspaceSlug={workspaceSlug}
        />
      </GoogleConnectionGate>
    </PageLayout>
  );
}
