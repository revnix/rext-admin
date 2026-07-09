"use client";

import { useParams } from "next/navigation";
import { DetailPageWrapper } from "@/components/detail-page-wrapper";
import { ContentHealthScorePanel } from "@/components/integrations/google/content-health-score-panel";
import { useContentDetail } from "@/hooks/use-content";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

export default function ContentHealthDetailPage() {
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
      title={content?.title ?? "Content Health"}
      status={content?.status}
      backUrl={workspaceRoutes.googleIntegration.contentHealth(workspaceSlug)}
      backLabel="Back to Content Health"
      isLoading={isLoading || !workspace?.id}
      error={error ?? undefined}
    >
      {workspace?.id && (
        <ContentHealthScorePanel
          workspaceId={workspace.id}
          contentId={contentId}
        />
      )}
    </DetailPageWrapper>
  );
}
