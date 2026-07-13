"use client";

import { PageLayout } from "@/components/page-layout";
import { GoogleConnectionGate } from "@/components/integrations/google/google-connection-gate";
import { GoogleSectionTabs } from "@/components/integrations/google/google-section-tabs";
import { GoogleSiteSelector } from "@/components/integrations/google/google-site-selector";
import { OpportunityRankedList } from "@/components/integrations/google/opportunity-ranked-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";
import { useGoogleSiteStore } from "@/stores/google-site-store";

export default function GoogleOpportunitiesPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const { hasPermission: canManage, isLoading: isPermLoading } =
    useWorkspacePermission(WORKSPACE_PERMISSIONS.UPDATE, workspace?.id);
  // Shared with the Dashboard — the site picked there scopes this page too.
  const siteId = useGoogleSiteStore(
    (s) => s.siteByWorkspace[workspace?.id ?? ""],
  );
  const setSite = useGoogleSiteStore((s) => s.setSite);

  if (!workspace?.id || isPermLoading) {
    return (
      <PageLayout title="Loading...">
        <Skeleton className="h-64 w-full" />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Opportunity Score"
      description="Published articles ranked by expected traffic growth after optimization."
    >
      <GoogleConnectionGate
        workspaceId={workspace.id}
        workspaceSlug={workspaceSlug}
        canManage={canManage}
      >
        <div className="space-y-6">
          <GoogleSectionTabs workspaceSlug={workspaceSlug} />
          <GoogleSiteSelector
            workspaceId={workspace.id}
            value={siteId}
            onChange={(id) => setSite(workspace.id, id)}
          />
          {siteId ? (
            <OpportunityRankedList
              workspaceId={workspace.id}
              workspaceSlug={workspaceSlug}
              siteId={siteId}
            />
          ) : (
            <EmptyState
              title="Select a site"
              description="Choose a site above to see its opportunity scores."
            />
          )}
        </div>
      </GoogleConnectionGate>
    </PageLayout>
  );
}
