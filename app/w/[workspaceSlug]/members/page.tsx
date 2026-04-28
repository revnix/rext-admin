"use client";

import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { PermissionGuard } from "@/components/permission/permission-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  WorkspaceInvitationsPanel,
  WorkspaceMembersPanel,
} from "@/components/workspace";
import { MEMBER_PERMISSIONS, WORKSPACE_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";
import { useWorkspacePermission } from "@/hooks/use-permission";

export default function WorkspaceUsersPage() {
  const { workspace, workspaceId } = useWorkspace();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "members";

  const { isLoading: isPermissionLoading } = useWorkspacePermission(
    MEMBER_PERMISSIONS.READ,
    workspaceId,
  );
  const { hasPermission: canManage } = useWorkspacePermission(
    WORKSPACE_PERMISSIONS.MANAGE_MEMBERS,
    workspaceId,
  );

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
      description={`Manage members and invitations for ${workspace?.name || "this workspace"}.`}
    >
      <PermissionGuard
        permission={MEMBER_PERMISSIONS.READ}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don’t have permission to view members in this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  member:read
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <Tabs defaultValue={currentTab} className="space-y-8">
          <TabsList>
            <TabsTrigger value="members">Members</TabsTrigger>
            {canManage && (
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
            )}
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            {workspace ? (
              <WorkspaceMembersPanel
                workspace={workspace}
                canManage={canManage}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Workspace data not found.
              </p>
            )}
          </TabsContent>

          {/* Invitations Tab */}
          {canManage && (
            <TabsContent value="invitations" className="space-y-6">
              {workspace ? (
                <WorkspaceInvitationsPanel
                  workspaceId={workspace.id}
                  canManage={canManage}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Workspace data not found.
                </p>
              )}
            </TabsContent>
          )}
        </Tabs>
      </PermissionGuard>
    </PageLayout>
  );
}
