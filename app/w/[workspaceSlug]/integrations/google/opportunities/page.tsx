"use client";

import { PageLayout } from "@/components/page-layout";
import { GoogleConnectionGate } from "@/components/integrations/google/google-connection-gate";
import { GoogleSectionTabs } from "@/components/integrations/google/google-section-tabs";
import { OpportunityRankedList } from "@/components/integrations/google/opportunity-ranked-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";

export default function GoogleOpportunitiesPage() {
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
      title="Opportunities"
      description="Published articles ranked by expected traffic growth after optimization."
    >
      <GoogleConnectionGate
        workspaceId={workspace.id}
        workspaceSlug={workspaceSlug}
        canManage={canManage}
      >
        <div className="space-y-6">
          <GoogleSectionTabs workspaceSlug={workspaceSlug} />
          <OpportunityRankedList
            workspaceId={workspace.id}
            workspaceSlug={workspaceSlug}
          />
        </div>
      </GoogleConnectionGate>
    </PageLayout>
  );
}
