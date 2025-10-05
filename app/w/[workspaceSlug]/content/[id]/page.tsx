"use client";

import { use } from "react";
import { PageLayout } from "@/components/page-layout";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

type WorkspaceContentDetailPageProps = {
  params: Promise<{
    workspaceSlug: string;
    id: string;
  }>;
};

export default function WorkspaceContentDetailPage({
  params,
}: WorkspaceContentDetailPageProps) {
  const { workspaceSlug, id } = use(params);
  const { workspace } = useWorkspace();

  const breadcrumbs = [
    { label: "Workspaces", href: "/workspaces" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Content", href: workspaceRoutes.content(workspaceSlug) },
    { label: "Detail" },
  ];

  return (
    <PageLayout
      title="Content Detail"
      description={`Content detail for ${workspace?.title || "workspace"}`}
      breadcrumbs={breadcrumbs}
    >
      <div className="p-8 border rounded-lg">
        <p className="text-muted-foreground">
          Content detail page for ID: {id}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          TODO: Implement content detail view
        </p>
      </div>
    </PageLayout>
  );
}
