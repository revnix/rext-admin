"use client";

import { Settings2 } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

export default function WorkspaceSettingsPage() {
  const { workspace, workspaceId } = useWorkspace();

  const breadcrumbs = [
    { label: "Workspaces", href: "/workspaces" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceId),
    },
    { label: "Settings" },
  ];

  return (
    <PageLayout
      title="Settings"
      description={`Configure settings for ${workspace?.title || "workspace"}`}
      breadcrumbs={breadcrumbs}
    >
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg">
        <Settings2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">
          Workspace settings and configuration
        </p>
        <p className="text-sm text-muted-foreground">
          TODO: Implement settings UI
        </p>
      </div>
    </PageLayout>
  );
}
