"use client";

import { PageLayout } from "@/components/page-layout";
import { ContentInventoryTable } from "@/components/integrations/google/content-inventory-table";
import { GoogleConnectionGate } from "@/components/integrations/google/google-connection-gate";
import { GoogleSectionTabs } from "@/components/integrations/google/google-section-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";

export default function ContentInventoryPage() {
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
      title="Content Inventory"
      description="Every published article as an individual asset, with search performance and scores."
    >
      <GoogleConnectionGate
        workspaceId={workspace.id}
        workspaceSlug={workspaceSlug}
        canManage={canManage}
      >
        <div className="space-y-6">
          <GoogleSectionTabs workspaceSlug={workspaceSlug} />
          <ContentInventoryTable
            workspaceId={workspace.id}
            workspaceSlug={workspaceSlug}
          />
        </div>
      </GoogleConnectionGate>
    </PageLayout>
  );
}
