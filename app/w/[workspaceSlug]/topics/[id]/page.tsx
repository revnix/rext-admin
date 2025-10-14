"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import { TopicDetailClient } from "@/app/topics/topic-detail-client";
import { CanAccess } from "@/components/permissions/can-access";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTopic } from "@/hooks/use-topics";
import { TOPIC_PERMISSIONS } from "@/lib/permissions";

type WorkspaceTopicDetailPageProps = {
  params: Promise<{
    workspaceSlug: string;
    id: string;
  }>;
};

export default function WorkspaceTopicDetailPage({
  params,
}: WorkspaceTopicDetailPageProps) {
  const { id, workspaceSlug } = use(params);
  const { data: topic, isLoading, error } = useTopic(id, workspaceSlug);

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
  return (
    <CanAccess
      permission={TOPIC_PERMISSIONS.READ}
      fallback={
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this topic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Required permission:{" "}
              <code className="text-xs bg-muted px-1 rounded">topic.read</code>
            </p>
          </CardContent>
        </Card>
      }
    >
      <TopicDetailClient topic={topic} />
    </CanAccess>
  );
}
