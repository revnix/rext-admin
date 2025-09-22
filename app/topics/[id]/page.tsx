"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import { useTopic } from "@/hooks/use-topics";
import { TopicDetailClient } from "../topic-detail-client";

type TopicDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function TopicDetailPage({ params }: TopicDetailPageProps) {
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

  return <TopicDetailClient topic={topic} />;
}
