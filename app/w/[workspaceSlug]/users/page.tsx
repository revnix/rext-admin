"use client";

import { useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/page-layout";
import { CanAccess } from "@/components/permissions/can-access";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkspaceInvitationsPanel } from "@/components/workspace/workspace-invitations-panel";
import { WorkspaceMembersPanel } from "@/components/workspace/workspace-members-panel";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

export default function WorkspaceUsersPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "users";

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Members" },
  ];

  return (
    <PageLayout
      title="Members"
      description={`Manage members and invitations for ${workspace?.title || "workspace"}`}
      breadcrumbs={breadcrumbs}
    >
      <CanAccess
        permission={WORKSPACE_PERMISSIONS.MANAGE_MEMBERS}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to manage members in this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  workspace:manage_members
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <Tabs defaultValue={currentTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Members</TabsTrigger>
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
      </CanAccess>
    </PageLayout>
  );
}
