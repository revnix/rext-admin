"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Crown,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Shield,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceBulkInviteDialog } from "@/components/workspace/workspace-bulk-invite-dialog";
import { WorkspaceChangeRoleDialog } from "@/components/workspace/workspace-change-role-dialog";
import { WorkspaceInviteDialog } from "@/components/workspace/workspace-invite-dialog";
import { WorkspaceRemoveMemberDialog } from "@/components/workspace/workspace-remove-member-dialog";
import { apiClient } from "@/lib/api-client";
import type { Workspace } from "@/types/workspace";

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
  user: {
    id: string;
    email: string;
    display_name: string;
    is_verified: boolean;
  };
}

function MemberSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-8" />
    </div>
  );
}

function EmptyMembers() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No users yet</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Invite users to collaborate on this workspace
        </p>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Users
        </Button>
      </CardContent>
    </Card>
  );
}

export function WorkspaceMembersPanel({
  workspace,
}: WorkspaceMembersPanelProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showBulkInviteDialog, setShowBulkInviteDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(
    null,
  );
  const [memberToChangeRole, setMemberToChangeRole] =
    useState<WorkspaceMember | null>(null);

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

  // Get initials for avatar
  const getInitials = (name: string) => {
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
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "inactive":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Workspace Users
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {members.length} {members.length === 1 ? "user" : "users"} in this
              workspace
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkInviteDialog(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              Bulk Invite
            </Button>
            <Button size="sm" onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <MemberSkeleton />
            <MemberSkeleton />
            <MemberSkeleton />
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4">Failed to load members</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : members.length === 0 ? (
          <EmptyMembers />
        ) : (
          <div className="space-y-3">
            {members.map((member: WorkspaceMember) => (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(member.user.display_name)}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {member.user.display_name}
                    </p>
                    {member.is_default && (
                      <span title="Workspace Owner">
                        <Crown className="h-4 w-4 text-yellow-600" />
                      </span>
                    )}
                    {member.user.is_verified && (
                      <span title="Verified">
                        <UserCheck className="h-4 w-4 text-green-600" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{member.user.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined {formatDate(member.joined_at)}
                  </p>
                </div>

                {/* Status Badge */}
                <Badge
                  variant={getStatusVariant(member.status)}
                  className="text-xs"
                >
                  {member.status}
                </Badge>

                {/* Actions Menu */}
                {!member.is_default && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setMemberToChangeRole(member)}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setMemberToRemove(member)}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Invite Dialog */}
      <WorkspaceInviteDialog
        workspaceId={workspace.id}
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onInvited={() => refetch()}
      />

      {/* Bulk Invite Dialog */}
      <WorkspaceBulkInviteDialog
        workspaceId={workspace.id}
        open={showBulkInviteDialog}
        onOpenChange={setShowBulkInviteDialog}
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
