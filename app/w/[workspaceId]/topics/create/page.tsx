"use client";

import { use } from "react";
import { PageLayout } from "@/components/page-layout";
import { TopicBuilderWizard } from "@/components/topic-builder/TopicBuilderWizard";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

export default function WorkspaceTopicCreatePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const resolvedParams = use(params);
  const { workspaceId } = resolvedParams;
  const { workspace } = useWorkspace();

  const breadcrumbs = [
    { label: "Workspaces", href: "/workspaces" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceId),
    },
    { label: "Topics", href: workspaceRoutes.topics(workspaceId) },
    { label: "Create" },
  ];

  return (
    <PageLayout
      title="Generate Topics"
      description="Create AI-generated topic clusters for your workspace"
      breadcrumbs={breadcrumbs}
    >
      <TopicBuilderWizard />
    </PageLayout>
  );
}
