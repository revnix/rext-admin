"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Crown,
  Mail,
  RefreshCw,
  Shield,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  WorkspaceChangeRoleDialog,
  WorkspaceInviteMembersDialog,
  WorkspaceRemoveMemberDialog,
} from "@/components/workspace";
import { usePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api-client";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { MEMBER_PERMISSIONS } from "@/lib/permissions";
import type { Column, RowAction } from "@/types/data-table";
import type { Workspace } from "@/types/workspace";
import Image from "next/image";

interface WorkspaceMembersPanelProps {
  workspace: Workspace;
}

interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  status: string;
  is_default: boolean;
  joined_at: string | null;
  last_activity_at: string | null;
  role?: {
    display_name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    display_name: string | null;
    is_verified: boolean;
    avatar: string | null;
  };
}

interface MemberData extends Record<string, unknown> {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  roleName: string;
  status: string;
  is_default: boolean;
  is_verified: boolean;
  joined_at: string;
  initials: string;
  avatar: string | null;
}

export function WorkspaceMembersPanel({
  workspace,
}: WorkspaceMembersPanelProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(
    null,
  );
  const [memberToChangeRole, setMemberToChangeRole] =
    useState<WorkspaceMember | null>(null);

  // Use permission gates (kept), but ensure we don't fall back to default Edit/View/Delete
  const canInviteMember = usePermission(MEMBER_PERMISSIONS.INVITE);

  // Fetch workspace members
  const {
    data: membersResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workspace-members", workspace.id],
    queryFn: () => apiClient.members.list(workspace.id),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const members = membersResponse?.members || [];

  const baseUrl = resolveApiBaseUrl();
  // Get initials for avatar
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "outline" | "destructive"
    > = {
      active: "default",
      pending: "secondary",
      inactive: "outline",
    };
    return variants[status.toLowerCase()] || "secondary";
  };

  // Transform data for DataTable
  const tableData: MemberData[] = members.map((member: WorkspaceMember) => ({
    id: member.id,
    user_id: member.user_id,
    display_name: member.user.display_name || member.user.name,
    email: member.user.email,
    status: member.status,
    roleName: member.role?.display_name ?? "",
    is_default: member.is_default,
    is_verified: member.user.is_verified,
    joined_at: formatDate(member.joined_at),
    initials: getInitials(member.user.display_name || member.user.name),
    avatar: member.user?.avatar ?? null,
  }));

  // Define columns
  const columns: Column<MemberData>[] = [
    {
      key: "display_name",
      header: "Member",
      width: "300px",
      cell: (value, row) => (
        <div className="flex items-center gap-3">
          {/* <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {row.initials}
            </AvatarFallback>
          </Avatar> */}
          <Avatar className="h-8 w-8 rounded-lg overflow-hidden relative">
            {row.avatar ? (
              <Image
                src={
                  row.avatar.startsWith("http://") ||
                  row.avatar.startsWith("https://")
                    ? row.avatar
                    : `${baseUrl}${row.avatar}`
                }
                alt="User avatar"
                fill
                className="object-cover"
                sizes="32px"
              />
            ) : (
              <AvatarFallback className="rounded-lg">
                {row.initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{value as string}</p>
              {row.is_default && (
                <span title="Workspace Owner">
                  <Crown className="h-4 w-4 text-yellow-600" />
                </span>
              )}
              {row.is_verified && (
                <span title="Email Verified">
                  <UserCheck className="h-4 w-4 text-green-600" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{row.email}</span>
            </div>
          </div>
        </div>
      ),
      searchable: true,
    },
    {
      key: "email",
      header: "Email",
      width: "250px",
      cell: () => null, // Email shown in User column
      searchable: true,
    },
    {
      key: "roleName",
      header: "Role",
      width: "250px",
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      cell: (value) => (
        <Badge variant={getStatusVariant(value as string)} className="text-xs">
          {value as string}
        </Badge>
      ),
    },
    {
      key: "joined_at",
      header: "Joined",
      width: "150px",
      cell: (value) => (
        <span className="text-sm text-muted-foreground">{value as string}</span>
      ),
    },
  ];

  // Define row actions (filtered by permissions)
  const rowActions: RowAction<MemberData>[] = [
    {
      label: "Change Role",
      icon: <Shield className="h-4 w-4" />,
      onClick: (row: MemberData) => {
        const member = members.find((m: WorkspaceMember) => m.id === row.id);
        if (member) setMemberToChangeRole(member);
      },
      disabled: (row: MemberData) => row.is_default as boolean,
    },
    {
      label: "Remove Member",
      icon: <UserMinus className="h-4 w-4" />,
      onClick: (row: MemberData) => {
        const member = members.find((m: WorkspaceMember) => m.id === row.id);
        if (member) setMemberToRemove(member);
      },
      variant: "destructive",
      disabled: (row: MemberData) => row.is_default as boolean,
    },
  ];

  const headerActions = (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={() => refetch()}
        disabled={isLoading}
        className="shrink-0"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      </Button>
      <PermissionGuard
        permission={MEMBER_PERMISSIONS.INVITE}
        showTooltip
        tooltipMessage="Only workspace admins can invite members"
      >
        <Button
          size="sm"
          onClick={() => setShowInviteDialog(true)}
          className="w-full sm:w-auto min-w-0"
        >
          <UserPlus className="h-4 w-4 mr-2 shrink-0" />
          <span className="truncate">Invite Members</span>
        </Button>
      </PermissionGuard>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Workspace Members
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns.filter((col) => col.key !== "email")} // Hide email column since it's in Member column
          data={tableData}
          isLoading={isLoading}
          rowActions={rowActions}
          emptyTitle="No members yet"
          emptyDescription="Invite members to collaborate on this workspace"
          emptyIcon={<Users className="h-12 w-12" />}
          emptyActions={
            canInviteMember
              ? [
                  {
                    label: "Invite Members",
                    icon: <UserPlus className="h-4 w-4" />,
                    onClick: () => setShowInviteDialog(true),
                  },
                ]
              : []
          }
          searchPlaceholder="Search by name or email..."
          searchFields={["display_name", "email"]}
          actions={headerActions}
          pageSize={10}
          pageSizeOptions={[10, 25, 50]}
          tableId="workspace-members"
        />

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-md text-sm text-destructive">
            Failed to load members. Please try again.
          </div>
        )}
      </CardContent>

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
    </Card>
  );
}
