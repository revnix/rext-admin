"use client";

import { useParams } from "next/navigation";
import { DetailPageWrapper } from "@/components/detail-page-wrapper";
import { ContentHealthScorePanel } from "@/components/integrations/google/content-health-score-panel";
import { OpportunityScorePanel } from "@/components/integrations/google/opportunity-score-panel";
import { useContentDetail } from "@/hooks/use-content";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

export default function GoogleContentScoreDetailPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const params = useParams<{ contentId: string }>();
  const contentId = params.contentId;

  const { data, isLoading, error } = useContentDetail(
    workspace?.id ?? "",
    contentId,
  );

  return (
    <DetailPageWrapper
      title={data?.content?.title ?? "Content Scores"}
      status={data?.content?.status}
      backUrl={workspaceRoutes.googleIntegration.contentInventory(
        workspaceSlug,
      )}
      backLabel="Back to Content Inventory"
      isLoading={isLoading || !workspace?.id}
      error={error ?? undefined}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {workspace?.id && (
          <>
            <ContentHealthScorePanel
              workspaceId={workspace.id}
              contentId={contentId}
            />
            <OpportunityScorePanel
              workspaceId={workspace.id}
              contentId={contentId}
            />
          </>
        )}
      </div>
    </DetailPageWrapper>
  );
}
