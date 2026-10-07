"use client";

import { useQuery } from "@tanstack/react-query";
import { Crown, RefreshCw, Shield, UserMinus, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableRowAction,
  UNKNOWN,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import {
  WorkspaceChangeRoleDialog,
  WorkspaceInviteMembersDialog,
  WorkspaceRemoveMemberDialog,
} from "@/components/workspace";
import { useAuthSession } from "@/hooks/use-auth-session";
import { apiClient } from "@/lib/api-client";
import { dateFormat } from "@/lib/formatters/date-formatters";
import { MEMBER_PERMISSIONS } from "@/lib/permissions";
import type { Workspace } from "@/types/workspace";
import { initials } from "@/lib/initials";

interface WorkspaceMembersPanelProps {
  workspace: Workspace;
  canInvite?: boolean;
  canChangeRole?: boolean;
  canRemove?: boolean;
}

interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  status: string;
  is_default: boolean;
  is_owner?: boolean;
  joined_at: string | null;
  last_activity_at: string | null;
  role?: {
    id?: string;
    name?: string;
    display_name: string;
  } | null;
  roles?: Array<{
    id?: string;
    name?: string;
    display_name: string;
  }>;
  user: {
    id: string;
    name: string;
    email: string;
    display_name: string | null;
    is_verified: boolean;
    avatar?: string | null;
  };
}

/** A member as the table shows it. */
interface MemberRow {
  member: WorkspaceMember;
  name: string;
  email: string;
  roles: Array<{ id?: string; display_name: string }>;
  isOwner: boolean;
}

const STATUS_LABELS: Readonly<Record<string, string>> = {
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
};

function MemberCell({ row }: { row: MemberRow }) {
  const avatar = row.member.user.avatar;
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-8">
        {avatar ? (
          // The API resolves avatars to absolute URLs (or null): resolve_avatar_url on the backend.
          <img src={avatar} alt="" className="size-full object-cover" />
        ) : (
          <AvatarFallback>{initials(row.name)}</AvatarFallback>
        )}
      </Avatar>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-medium text-foreground">
          <span className="truncate">{row.name}</span>
          {row.isOwner && (
            <>
              <Crown className="size-3.5 shrink-0" aria-hidden />
              <span className="sr-only">(owner)</span>
            </>
          )}
        </p>
        <p className="truncate text-muted-foreground">{row.email}</p>
      </div>
    </div>
  );
}

function RoleBadges({ row }: { row: MemberRow }) {
  if (row.roles.length === 0) {
    return <span className="text-muted-foreground">No role</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {row.roles.map((role) => (
        <Badge key={role.id ?? role.display_name} variant="neutral">
          {role.display_name}
        </Badge>
      ))}
    </div>
  );
}

const column = createDataTableColumnHelper<MemberRow>();

const columns = column.columns([
  // The search reads the name and the email; the cell shows both.
  column.accessor((row) => `${row.name} ${row.email}`, {
    id: "member",
    header: "Member",
    cell: ({ row }) => <MemberCell row={row.original} />,
    sortFn: "text",
    enableHiding: false,
  }),
  column.accessor(
    (row) => row.roles.map((role) => role.display_name).join(", "),
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => <RoleBadges row={row.original} />,
    },
  ),
  column.accessor((row) => row.member.status, {
    id: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={getValue() === "pending" ? "warning" : "neutral"}>
        {STATUS_LABELS[getValue()] ?? getValue()}
      </Badge>
    ),
    enableGlobalFilter: false,
  }),
  column.accessor((row) => Date.parse(row.member.joined_at ?? "") || 0, {
    id: "joined",
    header: "Joined",
    meta: { align: "end", numeric: true },
    cell: ({ row }) =>
      dateFormat.short(row.original.member.joined_at) || UNKNOWN,
    sortFn: "basic",
    enableGlobalFilter: false,
  }),
]);

const NO_MEMBERS: WorkspaceMember[] = [];

export function WorkspaceMembersPanel({
  workspace,
  canInvite = false,
  canChangeRole = false,
  canRemove = false,
}: WorkspaceMembersPanelProps) {
  const { user } = useAuthSession();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(
    null,
  );
  const [memberToChangeRole, setMemberToChangeRole] =
    useState<WorkspaceMember | null>(null);

  // The backend returns every member at once, so the table searches and sorts them here.
  const {
    data: membersResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workspace-members", workspace.id],
    queryFn: () => apiClient.members.list(workspace.id),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  const members: WorkspaceMember[] = membersResponse?.members ?? NO_MEMBERS;

  const rows = useMemo<MemberRow[]>(
    () =>
      members.map((member) => ({
        member,
        name: member.user.display_name || member.user.name,
        email: member.user.email,
        roles:
          member.roles && member.roles.length > 0
            ? member.roles
            : member.role
              ? [member.role]
              : [],
        isOwner: Boolean(
          member.is_owner ||
            workspace.user_id === member.user_id ||
            workspace.owner_id === member.user_id,
        ),
      })),
    [members, workspace.user_id, workspace.owner_id],
  );

  // Each action is gated on the permission its backend route enforces
  // (PATCH .../role -> member.update_role, DELETE member -> member.remove).
  const rowActions = (row: MemberRow): DataTableRowAction[] => [
    ...(canChangeRole
      ? [
          {
            label: "Change role",
            icon: Shield,
            onSelect: () => setMemberToChangeRole(row.member),
            disabled: row.isOwner ? "The owner's role can't change" : false,
          },
        ]
      : []),
    ...(canRemove
      ? [
          {
            label: "Remove from workspace",
            icon: UserMinus,
            destructive: true,
            onSelect: () => setMemberToRemove(row.member),
            disabled: row.isOwner
              ? "The owner can't be removed"
              : row.member.user_id === user?.id
                ? "You can't remove yourself"
                : false,
          },
        ]
      : []),
  ];

  const inviteButton = (
    <PermissionGuard
      permission={MEMBER_PERMISSIONS.INVITE}
      showTooltip
      tooltipMessage="Only workspace admins can invite members"
    >
      <Button
        size="sm"
        className="h-9"
        onClick={() => setShowInviteDialog(true)}
      >
        <UserPlus />
        Invite members
      </Button>
    </PermissionGuard>
  );

  return (
    <>
      <DataTable
        caption="Members"
        columns={columns}
        data={rows}
        getRowId={(row) => row.member.id}
        getRowLabel={(row) => row.name}
        isLoading={isLoading}
        error={
          error ? (
            <Notice tone="danger" title="Members didn't load">
              Refresh the list to try again.
            </Notice>
          ) : undefined
        }
        emptyState={
          <EmptyState
            title="No members yet"
            description="Invite people to work in this workspace with you."
            action={
              canInvite
                ? {
                    label: "Invite members",
                    onClick: () => setShowInviteDialog(true),
                  }
                : undefined
            }
          />
        }
        search={{ placeholder: "Search by name or email" }}
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              aria-label="Refresh members"
            >
              <RefreshCw className={isFetching ? "animate-spin" : undefined} />
            </Button>
            {inviteButton}
          </>
        }
        rowActions={rowActions}
        pageSizeOptions={[10, 25, 50]}
        // A settings section, beside the list of sections from 768 px: cards while it's too narrow
        // for the table, at any sidebar width.
        cardsWhen="narrow"
        renderCard={(row, { actions }) => (
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <MemberCell row={row} />
              <RoleBadges row={row} />
            </div>
            {actions}
          </div>
        )}
      />

      {/* Unified Invite Dialog */}
      <WorkspaceInviteMembersDialog
        workspaceId={workspace.id}
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onInvited={() => refetch()}
      />

      {/* Change Role Dialog */}
      <WorkspaceChangeRoleDialog
        member={memberToChangeRole}
        // The member's current role must not appear as a "new role" option
        // in the dropdown — without this the dialog's role.id !== currentRoleId
        // filter compares against undefined and lets it through.
        currentRoleId={
          memberToChangeRole?.role?.id || memberToChangeRole?.roles?.[0]?.id
        }
        open={!!memberToChangeRole}
        onOpenChange={(open) => !open && setMemberToChangeRole(null)}
        onRoleChanged={() => refetch()}
      />

      {/* Remove Member Dialog */}
      <WorkspaceRemoveMemberDialog
        member={memberToRemove}
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        onRemoved={() => refetch()}
      />
    </>
  );
}
