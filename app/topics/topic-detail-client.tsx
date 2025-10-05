"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DetailPageWrapper } from "@/components/detail-page-wrapper";
import { OverallScoreCard } from "@/components/topics/detail/OverallScoreCard";
import { TopicActions } from "@/components/topics/detail/TopicActions";
import { TopicInformation } from "@/components/topics/detail/TopicInformation";
import { TopicMetadata } from "@/components/topics/detail/TopicMetadata";
import { TopicTags } from "@/components/topics/detail/TopicTags";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTopicMetadata } from "@/hooks/use-topic-metadata";
import { useTopicScoring } from "@/hooks/use-topic-scoring";
import { useTopicApproveServerAction } from "@/hooks/use-topic-mutations-server-actions";
import { useTopicDeleteMutation } from "@/hooks/useTopicMutations";
import { logger } from "@/lib/logger";
import { useCurrentWorkspace } from "@/stores/workspace-store";
import type { SidebarConfig } from "@/types/detail-page";
import type { GeneratedTopic } from "@/types/topic-builder";

interface TopicDetailClientProps {
  topic: GeneratedTopic;
}

export function TopicDetailClient({ topic }: TopicDetailClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const detailLogger = logger.forComponent("TopicDetailClient");
  const currentWorkspace = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id || "";

  const deleteMutation = useTopicDeleteMutation(workspaceId);
  const approveMutation = useTopicApproveServerAction();

  // The topic data is already in the correct GeneratedTopic format
  const generatedTopic = topic;

  // Update page title and description dynamically
  usePageTitle(
    generatedTopic?.title || "Topic Detail",
    generatedTopic?.description ||
      generatedTopic?.angle ||
      `Topic details and analytics for ${generatedTopic?.title || "selected topic"}`,
  );

  // Use custom hooks for scoring and metadata
  const { overallScore, rating, colorClasses } = useTopicScoring(generatedTopic);
  const metadata = useTopicMetadata(generatedTopic);

  // Handle topic actions
  const handleApproveTopic = async () => {
    if (!generatedTopic) return;
    try {
      await approveMutation.mutateAsync(generatedTopic.id);
      detailLogger.info("Topic approved successfully", {
        topic_id: generatedTopic.id,
        title: generatedTopic.title,
      });
    } catch (error) {
      detailLogger.error("Failed to approve topic", {
        topic_id: generatedTopic.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleUseTopic = () => {
    detailLogger.info("Topic selected for content creation", {
      topic_id: generatedTopic?.id,
      title: generatedTopic?.title,
    });
    // TODO: Navigate to content creation with topic prefilled
  };

  const handleDeleteTopic = async () => {
    if (!generatedTopic) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync([generatedTopic.id]);
      router.push("/topics");
    } catch (error) {
      detailLogger.error("Failed to delete topic", {
        topic_id: generatedTopic.id,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Build breadcrumbs
  const breadcrumbs = [
    { label: "Library", href: "#" },
    { label: "Topics", href: "/topics" },
    { label: generatedTopic?.title || "Topic Detail" },
  ];

  // Build header actions for page header using component
  const headerActions = (
    <TopicActions
      isApproved={generatedTopic?.approved || false}
      onApprove={handleApproveTopic}
      onUse={handleUseTopic}
      onDelete={handleDeleteTopic}
      isApprovePending={approveMutation.isPending}
      isDeleting={isDeleting}
      isDeletePending={deleteMutation.isPending}
    />
  );

  // Build sidebar configuration with score card
  const sidebarConfig: SidebarConfig = {
    cards: [
      {
        type: "custom",
        config: {
          id: "overall-score-card",
          content: generatedTopic ? (
            <OverallScoreCard
              topic={generatedTopic}
              overallScore={overallScore}
              rating={rating}
              colorClasses={colorClasses}
            />
          ) : null,
        },
      },
    ],
    order: ["cards", "quickActions"],
  };

  return (
    <DetailPageWrapper
      title={generatedTopic?.title || "Topic Detail"}
      breadcrumbs={breadcrumbs}
      status={generatedTopic?.approved ? "Approved" : "Pending Approval"}
      statusVariant={generatedTopic?.approved ? "default" : "outline"}
      metadata={[]}
      headerActions={headerActions}
      sidebarConfig={sidebarConfig}
      isLoading={false}
      error={undefined}
    >
      {/* Main Content - Refactored with Components */}
      <div className="space-y-8">
        {/* Topic Details Info Boxes */}
        <TopicMetadata metadata={metadata} />

        {/* Topic Information */}
        {generatedTopic && <TopicInformation topic={generatedTopic} />}

        {/* Keywords & Channel/Audience Fit */}
        {generatedTopic && <TopicTags topic={generatedTopic} />}
      </div>
    </DetailPageWrapper>
  );
}
