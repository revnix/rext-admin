"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import {
  WorkspaceInvitationsPanel,
  WorkspaceMembersPanel,
} from "@/components/workspace";
import { SettingsGroup } from "@/components/settings/settings-group";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { MEMBER_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";

/**
 * Workspace settings, Members: the people in the workspace with their roles (invite, change a role,
 * remove), then the invitations still waiting. Each action is gated on the permission its backend
 * route enforces; the invitations list needs member.invite, as its route does.
 */
export default function WorkspaceSettingsMembersPage() {
  const { workspace, workspaceId } = useWorkspace();
  const { hasPermission: canRead, isLoading: isPermissionLoading } =
    useWorkspacePermission(MEMBER_PERMISSIONS.READ, workspaceId);
  const { hasPermission: canInvite } = useWorkspacePermission(
    MEMBER_PERMISSIONS.INVITE,
    workspaceId,
  );
  const { hasPermission: canChangeRole } = useWorkspacePermission(
    MEMBER_PERMISSIONS.UPDATE_ROLE,
    workspaceId,
  );
  const { hasPermission: canRemove } = useWorkspacePermission(
    MEMBER_PERMISSIONS.REMOVE,
    workspaceId,
  );

  if (!workspace?.id || isPermissionLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!canRead) {
    return (
      <Notice title="Members are hidden from your role">
        Ask the workspace's owner if you need to see who works here.
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SettingsGroup
        title="Members"
        description="Everyone who works in this workspace, and what their role lets them do."
      >
        <WorkspaceMembersPanel
          workspace={workspace}
          canInvite={canInvite}
          canChangeRole={canChangeRole}
          canRemove={canRemove}
        />
      </SettingsGroup>
      {canInvite && (
        <SettingsGroup
          title="Invitations"
          description="The invitations sent from this workspace and where each stands; one still waiting can be sent again or revoked."
        >
          <WorkspaceInvitationsPanel
            workspaceId={workspace.id}
            canResend={canInvite}
            canRevoke={canInvite}
          />
        </SettingsGroup>
      )}
    </div>
  );
}
