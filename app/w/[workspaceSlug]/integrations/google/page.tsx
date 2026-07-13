"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { GoogleConnectionGate } from "@/components/integrations/google/google-connection-gate";
import { GoogleKpiCards } from "@/components/integrations/google/google-kpi-cards";
import { GoogleSectionTabs } from "@/components/integrations/google/google-section-tabs";
import { GoogleSiteGa4Cards } from "@/components/integrations/google/google-site-ga4-cards";
import { GoogleSiteSelector } from "@/components/integrations/google/google-site-selector";
import { GoogleTrendCharts } from "@/components/integrations/google/google-trend-charts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoogleDashboard } from "@/hooks/use-google-dashboard";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";
import { useGoogleSiteStore } from "@/stores/google-site-store";

const DEFAULT_WINDOW_DAYS = 28;

function DashboardContent({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId: string;
  workspaceSlug: string;
}) {
  // Shared with the Content Inventory / Health / Opportunity tabs — picking
  // a site here scopes all four pages.
  const siteId = useGoogleSiteStore((s) => s.siteByWorkspace[workspaceId]);
  const setSite = useGoogleSiteStore((s) => s.setSite);

  return (
    <div className="space-y-6">
      <GoogleSectionTabs workspaceSlug={workspaceSlug} />

      <GoogleSiteSelector
        workspaceId={workspaceId}
        value={siteId}
        onChange={(id) => setSite(workspaceId, id)}
      />

      {siteId ? (
        <SiteDashboard workspaceId={workspaceId} siteId={siteId} />
      ) : (
        <EmptyState
          title="Select a site"
          description="Choose a site above to see its Search Console and Analytics data."
        />
      )}
    </div>
  );
}

function SiteDashboard({
  workspaceId,
  siteId,
}: {
  workspaceId: string;
  siteId: string;
}) {
  const [days] = useState(DEFAULT_WINDOW_DAYS);
  const { data, isLoading } = useGoogleDashboard(workspaceId, days, siteId);

  return (
    <>
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
          {data.traffic_data_source === "content_sum" && (
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Showing totals summed from your published articles. Site-wide
                data will appear automatically after the first site-level sync
                completes.
              </AlertDescription>
            </Alert>
          )}
          <GoogleKpiCards kpis={data.kpis} />
          {data.site_ga4 && <GoogleSiteGa4Cards ga4={data.site_ga4} />}
          <GoogleTrendCharts charts={data.charts} />
        </>
      )}
    </>
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
