"use client";

import { PageLayout } from "@/components/page-layout";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { LimitCheckWrapper } from "@/components/subscription/limit-check-wrapper";
import { TopicBuilderWizard } from "@/components/topic-builder/TopicBuilderWizard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function WorkspaceTopicCreatePage() {
  const { workspace } = useWorkspace();

  if (!workspace) {
    return (
      <PageLayout title="Topic Library">
        <TableSkeleton rows={8} />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Generate Topics"
      description="Create AI-generated topic clusters for your workspace"
    >
      <PermissionGuard
        permission={CONTENT_PERMISSIONS.CREATE}
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
      </PermissionGuard>
    </PageLayout>
  );
}
