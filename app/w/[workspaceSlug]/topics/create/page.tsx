"use client";

import { use } from "react";
import { PageLayout } from "@/components/page-layout";
import { CanAccess } from "@/components/permissions/can-access";
import { LimitCheckWrapper } from "@/components/subscription/limit-check-wrapper";
import { TopicBuilderWizard } from "@/components/topic-builder/TopicBuilderWizard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TOPIC_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function WorkspaceTopicCreatePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const resolvedParams = use(params);
  const { workspaceSlug } = resolvedParams;
  const { workspace } = useWorkspace();

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Topics", href: workspaceRoutes.topics(workspaceSlug) },
    { label: "Create" },
  ];

  if (!workspace) {
    return (
      <PageLayout title="Topic Library" breadcrumbs={breadcrumbs}>
        <TableSkeleton rows={8} />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Generate Topics"
      description="Create AI-generated topic clusters for your workspace"
      breadcrumbs={breadcrumbs}
    >
      <CanAccess
        permission={TOPIC_PERMISSIONS.CREATE}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to create topics in this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  topic.create
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <LimitCheckWrapper resource="topics" actionName="create topics">
          <TopicBuilderWizard />
        </LimitCheckWrapper>
      </CanAccess>
    </PageLayout>
  );
}
