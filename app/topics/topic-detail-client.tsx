"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DetailPageWrapper } from "@/components/detail-page-wrapper";
import { TopicActions } from "@/components/topics/detail/TopicActions";
import { TopicInformation } from "@/components/topics/detail/TopicInformation";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTopicDeleteMutation } from "@/hooks/useTopicMutations";
import { logger } from "@/lib/logger";
import { useCurrentWorkspace } from "@/stores/workspace";
import type { GeneratedTopic } from "@/types/topic-builder";
import type { Route } from "next";

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

  // The topic data is already in the correct GeneratedTopic format
  const generatedTopic = topic;

  // Update page title and description dynamically
  usePageTitle(
    generatedTopic?.topic_name || generatedTopic?.title || "Topic Detail",
    generatedTopic?.description ||
      `Topic details for ${generatedTopic?.topic_name || generatedTopic?.title || "selected topic"}`,
  );

  const handleUseTopic = () => {
    detailLogger.info("Topic selected for content creation", {
      topic_id: generatedTopic?.id,
      title: generatedTopic?.topic_name || generatedTopic?.title,
    });

    // Navigate to content creation with topic prefilled
    if (currentWorkspace?.slug && generatedTopic?.id) {
      router.push(
        `/w/${currentWorkspace.slug}/content/create?topicId=${generatedTopic.id}` as Route,
      );
    } else {
      detailLogger.error("Cannot navigate: Missing workspace slug or topic ID");
    }
  };

  const handleDeleteTopic = async () => {
    if (!generatedTopic) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync([generatedTopic.id]);
      // Navigate to workspace-scoped topics page
      if (currentWorkspace?.slug) {
        router.push(`/w/${currentWorkspace.slug}/topics` as Route);
      } else {
        router.push("/" as Route);
      }
    } catch (error) {
      detailLogger.error("Failed to delete topic", {
        topic_id: generatedTopic.id,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Build header actions for page header using component
  const headerActions = (
    <TopicActions
      onUse={handleUseTopic}
      onDelete={handleDeleteTopic}
      isDeleting={isDeleting}
      isDeletePending={deleteMutation.isPending}
    />
  );

  return (
    <DetailPageWrapper
      title={
        generatedTopic?.topic_name || generatedTopic?.title || "Topic Detail"
      }
      metadata={[]}
      headerActions={headerActions}
      isLoading={false}
      error={undefined}
    >
      <div className="space-y-8">
        {/* Topic Information */}
        {generatedTopic && <TopicInformation topic={generatedTopic} />}
      </div>
    </DetailPageWrapper>
  );
}
