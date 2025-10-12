"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, UserPlus, Users as UsersIcon } from "lucide-react";
import { useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorkspaceChangeRoleDialog } from "@/components/workspace/workspace-change-role-dialog";
import { WorkspaceInviteDialog } from "@/components/workspace/workspace-invite-dialog";
import {
  type WorkspaceMember,
  WorkspaceMembersTable,
} from "@/components/workspace/workspace-members-table";
import { WorkspaceRemoveMemberDialog } from "@/components/workspace/workspace-remove-member-dialog";
import { apiClient } from "@/lib/api-client";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

/**
 * Workspace Members Page
 *
 * Displays and manages workspace members, roles, and permissions.
 * Shows team members table with ability to invite, change roles, and remove members.
 *
 * Features:
 * - Members table with avatars and details
 * - Invite new members
 * - Change member roles
 * - Remove members
 * - Real-time member list updates
 */
export default function WorkspaceMembersPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const queryClient = useQueryClient();

  // Dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [memberToChangeRole, setMemberToChangeRole] =
    useState<WorkspaceMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(
    null,
  );

  // Fetch workspace members
  const {
    data: membersResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workspace-members", workspace?.id],
    queryFn: () => apiClient.members.list(workspace?.id || ""),
    enabled: !!workspace?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const members = membersResponse?.members || [];
  const totalCount = membersResponse?.total_count || 0;

  const handleInviteSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["workspace-members", workspace?.id],
    });
  };

  const handleRoleChanged = () => {
    queryClient.invalidateQueries({
      queryKey: ["workspace-members", workspace?.id],
    });
  };

  const handleMemberRemoved = () => {
    queryClient.invalidateQueries({
      queryKey: ["workspace-members", workspace?.id],
    });
  };

  const breadcrumbs = [
    { label: "Workspaces", href: "/workspaces" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    { label: "Members" },
  ];

  const headerActions = (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => refetch()}
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      </Button>
      <Button onClick={() => setShowInviteDialog(true)}>
        <UserPlus className="h-4 w-4 mr-2" />
        Invite Member
      </Button>
    </>
  );

  return (
    <PageLayout
      title="Members"
      description="Manage workspace members and their permissions"
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {totalCount} {totalCount === 1 ? "member" : "members"} in{" "}
            {workspace?.title || "this workspace"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg border-destructive/50">
              <UsersIcon className="h-12 w-12 text-destructive mb-4" />
              <p className="text-lg font-medium mb-2 text-destructive">
                Failed to load members
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                There was an error loading the member list
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : (
            <WorkspaceMembersTable
              members={members}
              onChangeRole={(member) => setMemberToChangeRole(member)}
              onRemoveMember={(member) => setMemberToRemove(member)}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <WorkspaceInviteDialog
        workspaceId={workspace?.id || ""}
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onInvited={handleInviteSuccess}
      />

      {/* Change Role Dialog */}
      <WorkspaceChangeRoleDialog
        member={memberToChangeRole}
        open={!!memberToChangeRole}
        onOpenChange={(open) => !open && setMemberToChangeRole(null)}
        onRoleChanged={handleRoleChanged}
      />

      {/* Remove Member Dialog */}
      <WorkspaceRemoveMemberDialog
        member={memberToRemove}
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        onRemoved={handleMemberRemoved}
      />
    </PageLayout>
  );
}
