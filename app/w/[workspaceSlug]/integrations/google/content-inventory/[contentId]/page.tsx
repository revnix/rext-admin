"use client";

import { useParams } from "next/navigation";
import { DetailPageWrapper } from "@/components/detail-page-wrapper";
import { ContentAiInsightsPanel } from "@/components/integrations/google/content-ai-insights-panel";
import { ContentHealthScorePanel } from "@/components/integrations/google/content-health-score-panel";
import { ContentKeywordAnalyticsPanel } from "@/components/integrations/google/content-keyword-analytics-panel";
import { ContentOverviewPanel } from "@/components/integrations/google/content-overview-panel";
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

  const content = data?.content;

  return (
    <DetailPageWrapper
      title={content?.title ?? "Content Performance"}
      status={content?.status}
      backUrl={workspaceRoutes.googleIntegration.contentInventory(
        workspaceSlug,
      )}
      backLabel="Back to Content Inventory"
      isLoading={isLoading || !workspace?.id}
      error={error ?? undefined}
    >
      <div className="space-y-6">
        {workspace?.id && (
          <>
            <ContentOverviewPanel
              workspaceId={workspace.id}
              contentId={contentId}
              lastUpdated={content?.updated_at}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <ContentHealthScorePanel
                workspaceId={workspace.id}
                contentId={contentId}
              />
              <OpportunityScorePanel
                workspaceId={workspace.id}
                contentId={contentId}
              />
            </div>

            <ContentKeywordAnalyticsPanel
              workspaceId={workspace.id}
              contentId={contentId}
              primaryKeyword={content?.seo_data?.focus_keyphrase}
              supportingKeywords={content?.seo_data?.secondary_keywords}
            />

            <ContentAiInsightsPanel
              workspaceId={workspace.id}
              contentId={contentId}
            />
          </>
        )}
      </div>
    </DetailPageWrapper>
  );
}
