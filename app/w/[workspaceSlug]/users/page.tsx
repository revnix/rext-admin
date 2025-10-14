"use client";

import { Users as UsersIcon } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

export default function WorkspaceUsersPage() {
  const { workspace, workspaceSlug } = useWorkspace();

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Users" },
  ];

  return (
    <PageLayout
      title="Users"
      description={`Manage users and permissions for ${workspace?.title || "workspace"}`}
      breadcrumbs={breadcrumbs}
    >
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg">
        <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">
          User management for workspace
        </p>
        <p className="text-sm text-muted-foreground">
          TODO: Implement user management UI
        </p>
      </div>
    </PageLayout>
  );
}
