"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { apiClient } from "@/lib/api-client";
import type { Permission, Role } from "@/types/role";
import { isProtectedRole } from "@/lib/permissions";
import { orderPermissionsForRevocation } from "@/lib/permission-dependencies";
import { PermissionMultiSelect } from "./permission-multi-select";
import { usePermissionStore } from "@/stores/permission-store";

interface BulkAssignPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  allPermissions: Permission[];
}

export function BulkAssignPermissionsDialog({
  open,
  onOpenChange,
  roles,
  allPermissions,
}: BulkAssignPermissionsDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );
  const [operation, setOperation] = useState<"add" | "remove">("add");
  const invalidateWorkspacePermissions = usePermissionStore(
    (state) => state.invalidateWorkspacePermissions,
  );

  const assignableRoles = roles.filter((r) => !isProtectedRole(r));

  useEffect(() => {
    if (selectedRoleIds.length === 0) {
      setSelectedPermissionIds([]);
      return;
    }

    const assignedPermissionIds = new Set<string>();
    for (const roleId of selectedRoleIds) {
      const selectedRole = roles.find((role) => role.id === roleId) as
        | (Role & { permissions?: Array<{ id: string }> })
        | undefined;

      for (const permission of selectedRole?.permissions ?? []) {
        assignedPermissionIds.add(permission.id);
      }
    }

    setSelectedPermissionIds(Array.from(assignedPermissionIds));
  }, [roles, selectedRoleIds]);

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const validRoleIds = selectedRoleIds.filter((id) => {
        const role = roles.find((r) => r.id === id);
        return role && !isProtectedRole(role);
      });

      if (validRoleIds.length === 0) {
        throw new Error("No custom or editable roles selected");
      }

      // Revoke dependents before their prerequisites, one call at a time. The
      // backend cascades each revoke to dependents (and never to shared
      // prerequisites), so parallel or out-of-order calls would 404 on
      // permissions an earlier revoke already cascaded away.
      const idByName = new Map(allPermissions.map((p) => [p.name, p.id]));
      const revokeOrder = orderPermissionsForRevocation(
        selectedPermissionIds
          .map((id) => allPermissions.find((p) => p.id === id)?.name)
          .filter((name): name is string => Boolean(name)),
      )
        .map((name) => idByName.get(name))
        .filter((id): id is string => Boolean(id));

      const results = await Promise.allSettled(
        validRoleIds.map(async (roleId) => {
          if (operation === "add") {
            // Backend adds technical prerequisites server-side.
            return await apiClient.roles.assignPermissions(roleId, {
              permission_ids: selectedPermissionIds,
            });
          }
          for (const permId of revokeOrder) {
            await apiClient.roles.revokePermission(roleId, permId);
          }
          return { role_id: roleId, revoked: true };
        }),
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed, total: results.length };
    },
    onSuccess: async (data) => {
      const { successful, failed, total } = data;

      if (failed === 0) {
        toast.success(
          `All ${total} role(s) updated successfully — ${operation === "add" ? "permissions assigned" : "permissions removed"}.`,
        );
      } else if (successful === 0) {
        toast.error(
          `All ${total} role operations failed. No changes were applied.`,
        );
      } else {
        toast.warning(
          `Partial success: ${successful} of ${total} role(s) updated, ${failed} failed.`,
        );
      }

      invalidateWorkspacePermissions();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["roles"] }),
        queryClient.invalidateQueries({ queryKey: ["permissions"] }),
        queryClient.invalidateQueries({ queryKey: ["workspace-permissions"] }),
        queryClient.invalidateQueries({ queryKey: ["audit-logs"] }),
      ]);
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Failed to perform bulk operation. Please try again.",
      );
    },
  });

  const handleClose = () => {
    setSelectedRoleIds([]);
    setSelectedPermissionIds([]);
    setOperation("add");
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRoleIds.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    if (selectedPermissionIds.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    bulkMutation.mutate();
  };

  const toggleRole = (role: Role) => {
    if (isProtectedRole(role)) return;
    setSelectedRoleIds((prev) =>
      prev.includes(role.id)
        ? prev.filter((id) => id !== role.id)
        : [...prev, role.id],
    );
  };

  const toggleAllRoles = () => {
    if (selectedRoleIds.length === assignableRoles.length) {
      setSelectedRoleIds([]);
    } else {
      setSelectedRoleIds(assignableRoles.map((r) => r.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bulk Permission Assignment
            </DialogTitle>
            <DialogDescription>
              Update permissions across custom roles in one pass.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="operation">Operation</Label>
              <Select
                value={operation}
                onValueChange={(value: "add" | "remove") => {
                  setOperation(value);
                  setSelectedPermissionIds([]);
                }}
              >
                <SelectTrigger id="operation">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add permissions</SelectItem>
                  <SelectItem value="remove">Remove permissions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
              <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-medium">
                    Roles ({selectedRoleIds.length})
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleAllRoles}
                    disabled={assignableRoles.length === 0}
                  >
                    {selectedRoleIds.length === assignableRoles.length &&
                    assignableRoles.length > 0
                      ? "Clear"
                      : "Select all"}
                  </Button>
                </div>
                <div className="max-h-[260px] overflow-y-auto space-y-2 rounded-md border bg-background/50 p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {roles.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">
                      No roles available.
                    </p>
                  ) : (
                    roles.map((role) => {
                      const isProtected = isProtectedRole(role);
                      return (
                        <label
                          key={role.id}
                          className={`flex items-center gap-3 rounded-md p-2 text-sm ${
                            isProtected
                              ? "cursor-not-allowed opacity-50 bg-muted/40"
                              : "cursor-pointer hover:bg-muted/80"
                          }`}
                          title={
                            isProtected
                              ? "Protected role permissions cannot be modified"
                              : undefined
                          }
                        >
                          <input
                            type="checkbox"
                            checked={selectedRoleIds.includes(role.id)}
                            onChange={() => toggleRole(role)}
                            disabled={isProtected}
                            className="h-4 w-4 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-medium">
                                {role.display_name}
                              </span>
                              {role.is_system_role && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  System
                                </Badge>
                              )}
                              {isProtected && (
                                <Badge
                                  variant="outline"
                                  className="border-amber-500/50 text-[10px] text-amber-500"
                                >
                                  Protected
                                </Badge>
                              )}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {role.name}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                <Label className="text-sm font-medium">
                  Permissions ({selectedPermissionIds.length})
                </Label>
                <PermissionMultiSelect
                  permissions={allPermissions}
                  selectedPermissionIds={selectedPermissionIds}
                  onChange={setSelectedPermissionIds}
                  applyDependencies={operation === "add"}
                />
              </div>
            </div>

            {selectedRoleIds.length > 0 && selectedPermissionIds.length > 0 && (
              <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
                {operation === "add" ? "Adding" : "Removing"}{" "}
                <span className="font-semibold text-foreground">
                  {selectedPermissionIds.length}
                </span>{" "}
                permission(s) {operation === "add" ? "to" : "from"}{" "}
                <span className="font-semibold text-foreground">
                  {selectedRoleIds.length}
                </span>{" "}
                role(s)
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={bulkMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={bulkMutation.isPending}>
              {bulkMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {operation === "add" ? "Assign" : "Remove"} Permissions
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
