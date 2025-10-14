"use client";

import { useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/page-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkspaceInvitationsPanel } from "@/components/workspace/workspace-invitations-panel";
import { WorkspaceMembersPanel } from "@/components/workspace/workspace-members-panel";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

export default function WorkspaceUsersPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "users";

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
      description={`Manage users and invitations for ${workspace?.title || "workspace"}`}
      breadcrumbs={breadcrumbs}
    >
      <Tabs defaultValue={currentTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {workspace && <WorkspaceMembersPanel workspace={workspace} />}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          {workspace && (
            <WorkspaceInvitationsPanel workspaceId={workspace.id} />
          )}
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
