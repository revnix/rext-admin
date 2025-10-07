"use client";

import { BarChart3 } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

export default function WorkspaceAnalyticsPage() {
  const { workspace, workspaceSlug } = useWorkspace();

  const breadcrumbs = [
    { label: "Workspaces", href: "/workspaces" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Analytics" },
  ];

  return (
    <PageLayout
      title="Analytics"
      description={`View analytics and insights for ${workspace?.title || "workspace"}`}
      breadcrumbs={breadcrumbs}
    >
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">
          Analytics dashboard for workspace
        </p>
        <p className="text-sm text-muted-foreground">
          TODO: Implement analytics dashboard
        </p>
      </div>
    </PageLayout>
  );
}
