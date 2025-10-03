"use client";

import { PageLayout } from "@/components/page-layout";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

export default function WorkspaceContentCreatePage() {
  const { workspace, workspaceId } = useWorkspace();

  const breadcrumbs = [
    { label: "Workspaces", href: "/workspaces" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceId),
    },
    { label: "Content", href: workspaceRoutes.content(workspaceId) },
    { label: "Create" },
  ];

  return (
    <PageLayout
      title="Create Content"
      description={`Create new content for ${workspace?.title || "workspace"}`}
      breadcrumbs={breadcrumbs}
    >
      <div className="p-8 border rounded-lg">
        <p className="text-muted-foreground">
          Content creation form will be implemented here
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          TODO: Implement content creation wizard
        </p>
      </div>
    </PageLayout>
  );
}
