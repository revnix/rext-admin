"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, Loader2, Plus, Shield, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import type { User, UserRoleAssignment } from "@/lib/api-client/users";

interface ManageUserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

interface AssignableRole {
  id: string;
  name: string;
  display_name: string;
  hierarchy_level: number;
  is_workspace_role?: boolean;
}

/** Sentinel for the platform-wide (workspace_id = null) scope in the picker. */
export const PLATFORM_SCOPE = "platform";

/**
 * Roles still offerable in the chosen scope, highest authority first.
 *
 * Only assignments in the *same* scope disqualify a role: holding a role
 * platform-wide and inside a workspace are separate assignment rows, so the
 * same role can still be needed in the other scope.
 */
/**
 * The platform-wide `user` role every account keeps.
 *
 * It carries AuthService.DEFAULT_PERMISSIONS — the permissions that mean
 * something without a workspace (own profile, billing, workspace.create) — so
 * revoking it leaves an account that cannot read itself. RoleService.revoke_role
 * refuses it server-side; this only stops the UI offering a button that fails.
 * Other platform roles (admin, support) stay revocable so admins can be demoted.
 */
export function isPlatformFloor(assignment: {
  role_name: string;
  workspace_id: string | null;
}): boolean {
  return assignment.workspace_id === null && assignment.role_name === "user";
}

/**
 * Rows role management never touches: the platform floor and the workspace
 * owner (ownership lives on the workspace and only moves via transfer).
 */
function immutableReason(assignment: {
  role_name: string;
  workspace_id: string | null;
}): string | undefined {
  if (isPlatformFloor(assignment))
    return "Every account keeps the platform-wide User role";
  if (assignment.role_name === "workspace_owner")
    return "Transfer workspace ownership instead";
  return undefined;
}

export function assignableRoles<T extends AssignableRole>(
  allRoles: T[],
  assigned: UserRoleAssignment[],
  workspaceId: string | null = null,
): T[] {
  const takenInScope = new Set(
    assigned
      .filter((r) => (r.workspace_id ?? null) === workspaceId)
      .map((r) => r.role_id),
  );
  return allRoles
    .filter(
      (role) => !takenInScope.has(role.id) && role.name !== "workspace_owner",
    )
    .sort((a, b) => b.hierarchy_level - a.hierarchy_level);
}

/**
 * Admin dialog for viewing and changing a user's roles.
 *
 * Backs onto GET/POST /api/v1/user/{id}/roles and
 * DELETE /api/v1/user/{id}/roles/{roleId}, all of which require
 * `user.manage_roles`.
 *
 * Assignment is scoped: platform-wide (workspace_id = null) or to one of the
 * workspaces the user belongs to, listed by GET /user/{id}/workspaces. The two
 * scopes are separate rows and separate permission paths — a platform role
 * grants nothing inside a workspace and never appears on a workspace's Members
 * screen, which is why picking the scope here matters.
 */
export function ManageUserRolesDialog({
  open,
  onOpenChange,
  user,
}: ManageUserRolesDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedScope, setSelectedScope] = useState<string>(PLATFORM_SCOPE);

  useEffect(() => {
    if (open) {
      setSelectedRoleId("");
      setSelectedScope(PLATFORM_SCOPE);
    }
  }, [open]);

  const {
    data: userRoles,
    isLoading: rolesLoading,
    error: rolesError,
  } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: () => apiClient.users.listRoles(user?.id ?? ""),
    enabled: open && Boolean(user?.id),
  });

  // Assignable roles. Fetched without permissions to avoid the per-role
  // lookup the include_permissions path triggers server-side.
  const { data: allRoles, isLoading: allRolesLoading } = useQuery({
    queryKey: ["roles", "assignable"],
    queryFn: () => apiClient.roles.list(false),
    enabled: open,
  });

  // Workspaces this user belongs to — the valid scopes for an assignment.
  // The backend rejects a workspace-scoped role for a non-member, so the
  // picker only ever offers workspaces they are actually in.
  const { data: userWorkspaces, isLoading: workspacesLoading } = useQuery({
    queryKey: ["user-workspaces", user?.id],
    queryFn: () => apiClient.users.listWorkspaces(user?.id ?? ""),
    enabled: open && Boolean(user?.id),
  });

  const assigned: UserRoleAssignment[] = useMemo(
    () => userRoles?.roles ?? [],
    [userRoles],
  );

  const scopeWorkspaceId =
    selectedScope === PLATFORM_SCOPE ? null : selectedScope;

  const availableRoles = useMemo(
    () => assignableRoles(allRoles?.roles ?? [], assigned, scopeWorkspaceId),
    [allRoles, assigned, scopeWorkspaceId],
  );

  // One role per workspace: assigning here replaces whatever is held.
  const heldInWorkspace = scopeWorkspaceId
    ? assigned.find((r) => r.workspace_id === scopeWorkspaceId)
    : undefined;

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["user-roles", user?.id] }),
      queryClient.invalidateQueries({
        queryKey: ["user-workspaces", user?.id],
      }),
      // display_role in the users table is derived from role assignments.
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
      // A workspace-scoped assignment changes what the workspace's Members
      // screen shows. Prefix key — every cached workspace is refreshed, since
      // this dialog does not know which one is currently on screen.
      queryClient.invalidateQueries({ queryKey: ["workspace-members"] }),
    ]);
  };

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user selected");
      if (!selectedRoleId) throw new Error("No role selected");
      return apiClient.users.assignRole(user.id, {
        role_id: selectedRoleId,
        workspace_id: scopeWorkspaceId,
        // A platform-wide role only grants anything when is_primary is true:
        // the global permission lookup filters on
        // `workspace_id IS NULL AND is_primary IS TRUE` (AuthService). Sending
        // false wrote a row that granted nothing. The workspace path does not
        // filter on it at all, so true is correct for both scopes.
        is_primary: true,
      });
    },
    onSuccess: async (data) => {
      toast.success(
        data.workspace_name
          ? heldInWorkspace
            ? `${heldInWorkspace.role_display_name} replaced with ${data.role_display_name} in ${data.workspace_name}`
            : `${data.role_display_name} assigned in ${data.workspace_name}`
          : `${data.role_display_name} assigned platform-wide`,
      );
      setSelectedRoleId("");
      await invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not assign the role.");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (assignment: UserRoleAssignment) => {
      if (!user) throw new Error("No user selected");
      await apiClient.users.revokeRole(
        user.id,
        assignment.role_id,
        assignment.workspace_id,
      );
      return assignment;
    },
    onSuccess: async (assignment) => {
      toast.success(`${assignment.role_display_name} revoked`);
      await invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not revoke the role.");
    },
  });

  if (!user) return null;

  const displayName = user.display_name || user.full_name || user.email;
  const busy = assignMutation.isPending || revokeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage roles
          </DialogTitle>
          <DialogDescription>
            Roles for <strong>{displayName}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Current roles */}
          <div className="space-y-2">
            <Label>Current roles</Label>

            {rolesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : rolesError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {rolesError instanceof Error
                    ? rolesError.message
                    : "Could not load this user's roles."}
                </AlertDescription>
              </Alert>
            ) : assigned.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No roles assigned
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This user only has the permissions their default role grants.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border divide-y">
                {assigned.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-3 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {assignment.role_display_name}
                        </span>
                        {assignment.is_primary && (
                          <Badge variant="default" className="text-[10px] h-5">
                            <Star className="h-2.5 w-2.5 mr-1" />
                            Primary
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] h-5">
                          {assignment.workspace_id
                            ? `Workspace: ${assignment.workspace_name ?? "Unknown"}`
                            : "Platform-wide"}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 font-mono"
                        >
                          L{assignment.hierarchy_level}
                        </Badge>
                      </div>
                      <code className="text-[11px] text-muted-foreground">
                        {assignment.role_name}
                      </code>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive flex-shrink-0"
                      disabled={busy || Boolean(immutableReason(assignment))}
                      title={immutableReason(assignment)}
                      onClick={() => revokeMutation.mutate(assignment)}
                    >
                      {revokeMutation.isPending &&
                      revokeMutation.variables?.id === assignment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        Revoke {assignment.role_display_name}
                      </span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign a role */}
          <div className="space-y-3">
            <Label htmlFor="scope">Scope</Label>
            <Select
              value={selectedScope}
              onValueChange={(value) => {
                setSelectedScope(value);
                // A role valid in one scope may already be taken in the other.
                setSelectedRoleId("");
              }}
              disabled={workspacesLoading || busy}
            >
              <SelectTrigger id="scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PLATFORM_SCOPE}>
                  Platform-wide (all workspaces)
                </SelectItem>
                {(userWorkspaces?.workspaces ?? []).map((ws) => (
                  <SelectItem key={ws.workspace_id} value={ws.workspace_id}>
                    <span className="flex items-center gap-2">
                      {/* Labelled "Workspace:" because a workspace can be named
                          after a person. Unlabelled, "Hasnat Hassan currently
                          Workspace Owner" reads as a person holding the role
                          rather than the workspace the role sits in. */}
                      <span className="text-muted-foreground">Workspace:</span>
                      {ws.workspace_name}
                      <span className="text-xs text-muted-foreground">
                        {ws.current_role_display_name
                          ? `currently ${ws.current_role_display_name}`
                          : "no role yet"}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label htmlFor="role">
              {selectedScope === PLATFORM_SCOPE
                ? "Assign a platform role"
                : "Assign a role in this workspace"}
            </Label>
            {heldInWorkspace && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This user already has the {heldInWorkspace.role_display_name}{" "}
                  role in this workspace. Assigning a new role will replace it.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={selectedRoleId}
                onValueChange={setSelectedRoleId}
                disabled={
                  allRolesLoading || busy || availableRoles.length === 0
                }
              >
                <SelectTrigger id="role" className="flex-1 min-w-0">
                  <SelectValue
                    placeholder={
                      allRolesLoading
                        ? "Loading roles..."
                        : availableRoles.length === 0
                          ? "Every role is already assigned"
                          : "Select a role"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <span className="flex items-center gap-2">
                        {role.display_name}
                        <span className="text-xs text-muted-foreground font-mono">
                          {role.name}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={() => assignMutation.mutate()}
                disabled={
                  !selectedRoleId || busy || availableRoles.length === 0
                }
                className="shrink-0 sm:w-auto h-9"
              >
                {assignMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {heldInWorkspace ? "Replace" : "Assign"}
              </Button>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {selectedScope === PLATFORM_SCOPE
                  ? "A platform-wide role applies everywhere but does not appear on any workspace's Members screen, and grants no workspace-level permissions. Pick a workspace above to do that."
                  : "This role applies only inside the selected workspace and will show on its Members screen. It does not grant platform-level permissions."}
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
