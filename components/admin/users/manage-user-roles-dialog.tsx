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
import { Switch } from "@/components/ui/switch";
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
}

/**
 * Roles still offerable as a platform-wide assignment, highest authority first.
 *
 * Only *global* assignments disqualify a role: holding a role inside a
 * workspace is a separate assignment row, so the same role can still be
 * needed platform-wide.
 */
export function assignableRoles<T extends AssignableRole>(
  allRoles: T[],
  assigned: UserRoleAssignment[],
): T[] {
  const assignedGlobally = new Set(
    assigned.filter((r) => !r.workspace_id).map((r) => r.role_id),
  );
  return allRoles
    .filter((role) => !assignedGlobally.has(role.id))
    .sort((a, b) => b.hierarchy_level - a.hierarchy_level);
}

/**
 * Admin dialog for viewing and changing a user's platform roles.
 *
 * Backs onto GET/POST /api/v1/user/{id}/roles and
 * DELETE /api/v1/user/{id}/roles/{roleId}, all of which require
 * `user.manage_roles`.
 *
 * Assignment from this screen is platform-wide (workspace_id = null).
 * Workspace-scoped roles are assigned from the workspace's own Members
 * screen, because the backend rejects a workspace assignment unless the user
 * is already a member and there is no endpoint that lists another user's
 * workspaces. Existing workspace-scoped assignments are still listed and can
 * be revoked here, with their scope passed through correctly.
 */
export function ManageUserRolesDialog({
  open,
  onOpenChange,
  user,
}: ManageUserRolesDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedRoleId("");
      setIsPrimary(false);
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

  const assigned: UserRoleAssignment[] = useMemo(
    () => userRoles?.roles ?? [],
    [userRoles],
  );

  const availableRoles = useMemo(
    () => assignableRoles(allRoles?.roles ?? [], assigned),
    [allRoles, assigned],
  );

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["user-roles", user?.id] }),
      // display_role in the users table is derived from role assignments.
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    ]);
  };

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user selected");
      if (!selectedRoleId) throw new Error("No role selected");
      return apiClient.users.assignRole(user.id, {
        role_id: selectedRoleId,
        workspace_id: null,
        is_primary: isPrimary,
      });
    },
    onSuccess: async (data) => {
      toast.success(`${data.role_display_name} assigned`);
      setSelectedRoleId("");
      setIsPrimary(false);
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
            Platform roles for <strong>{displayName}</strong> ({user.email})
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
                            ? (assignment.workspace_name ?? "Workspace")
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
                      disabled={busy}
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
            <Label htmlFor="role">Assign a platform role</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={selectedRoleId}
                onValueChange={setSelectedRoleId}
                disabled={allRolesLoading || busy}
              >
                <SelectTrigger id="role" className="flex-1">
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
                disabled={!selectedRoleId || busy}
                className="sm:w-auto"
              >
                {assignMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Assign
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="min-w-0">
                <Label htmlFor="is-primary" className="text-sm">
                  Set as primary role
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The primary role is the one shown next to the user's name.
                </p>
              </div>
              <Switch
                id="is-primary"
                checked={isPrimary}
                onCheckedChange={setIsPrimary}
                disabled={busy}
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Roles assigned here apply platform-wide. To give someone a role
                inside a single workspace, use that workspace's Members screen —
                the backend only accepts a workspace-scoped role for an existing
                member of that workspace.
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
