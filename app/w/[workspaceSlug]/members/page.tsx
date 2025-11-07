"use client";

import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

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
import { useWorkspacePermission } from "@/hooks/use-permission";

export default function WorkspaceUsersPage() {
  const { workspace, workspaceId, workspaceSlug } = useWorkspace();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "members";

  // ✅ Load permission safely with loading state
  const { isLoading: isPermissionLoading } =
    useWorkspacePermission(WORKSPACE_PERMISSIONS.MANAGE_MEMBERS, workspaceId);

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Members" },
  ];

  // ✅ Show loader while permissions or workspace data are loading
  if (!workspace?.id || isPermissionLoading) {
    return (
      <PageLayout title="Loading Permissions...">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Members"
      description={`Manage members and invitations for ${workspace?.title || "this workspace"}.`}
      breadcrumbs={breadcrumbs}
    >
      <CanAccess
        permission={WORKSPACE_PERMISSIONS.MANAGE_MEMBERS}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don’t have permission to manage members in this workspace.
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
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            {workspace ? (
              <WorkspaceMembersPanel workspace={workspace} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Workspace data not found.
              </p>
            )}
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-6">
            {workspace ? (
              <WorkspaceInvitationsPanel workspaceId={workspace.id} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Workspace data not found.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CanAccess>
    </PageLayout>
  );
}
