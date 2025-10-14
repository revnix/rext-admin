"use client";

import { use } from "react";
import { PageLayout } from "@/components/page-layout";
import { TopicBuilderWizard } from "@/components/topic-builder/TopicBuilderWizard";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

export default function WorkspaceTopicCreatePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const resolvedParams = use(params);
  const { workspaceSlug } = resolvedParams;
  const { workspace } = useWorkspace();

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Topics", href: workspaceRoutes.topics(workspaceSlug) },
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
