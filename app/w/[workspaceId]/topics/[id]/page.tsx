"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import { TopicDetailClient } from "@/app/topics/topic-detail-client";
import { useTopic } from "@/hooks/use-topics";

type WorkspaceTopicDetailPageProps = {
  params: Promise<{
    workspaceId: string;
    id: string;
  }>;
};

export default function WorkspaceTopicDetailPage({
  params,
}: WorkspaceTopicDetailPageProps) {
  const { id } = use(params);
  const { data: topic, isLoading, error } = useTopic(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    throw error;
  }

  if (!topic) {
    notFound();
  }

  // Workspace context is available via useWorkspace hook in child components
  return <TopicDetailClient topic={topic} />;
}
