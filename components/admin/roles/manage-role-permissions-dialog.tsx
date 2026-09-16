"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isProtectedRole } from "@/lib/permissions";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import type { Permission, RoleWithPermissions } from "@/types/role";
import { PermissionMultiSelect } from "./permission-multi-select";
import { usePermissionStore } from "@/stores/permission-store";

interface ManageRolePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleWithPermissions | null;
  allPermissions: Permission[];
  /** Caller holds role.manage_permissions; without it the dialog is view-only. */
  canManage: boolean;
}

export function ManageRolePermissionsDialog({
  open,
  onOpenChange,
  role,
  allPermissions,
  canManage,
}: ManageRolePermissionsDialogProps) {
  const queryClient = useQueryClient();
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );

  const isProtected = role ? isProtectedRole(role) : false;
  const isReadOnly = isProtected || !canManage;

  const invalidateWorkspacePermissions = usePermissionStore(
    (state) => state.invalidateWorkspacePermissions,
  );

  useEffect(() => {
    if (role?.permissions && allPermissions) {
      const validPermissionIds = new Set(allPermissions.map((p) => p.id));
      const filteredIds = role.permissions
        .filter((p) => validPermissionIds.has(p.id))
        .map((p) => p.id);
      setSelectedPermissionIds(filteredIds);
    } else {
      setSelectedPermissionIds([]);
    }
  }, [role, allPermissions]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!role) throw new Error("No role selected");
      if (isProtectedRole(role)) {
        throw new Error("Protected role permissions cannot be modified");
      }
      if (!canManage) {
        throw new Error("You do not have permission to modify role permissions");
      }

      // Use atomic single-transaction update endpoint
      return await apiClient.roles.updatePermissions(role.id, {
        permission_ids: selectedPermissionIds,
      });
    },
    onSuccess: async () => {
      toast.success("Role permissions updated successfully");

      invalidateWorkspacePermissions();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["roles"] }),
        queryClient.invalidateQueries({ queryKey: ["permissions"] }),
        queryClient.invalidateQueries({ queryKey: ["workspace-permissions"] }),
        queryClient.invalidateQueries({ queryKey: ["audit-logs"] }),
      ]);

      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Failed to update permissions. Please try again.",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      toast.error(
        isProtected
          ? "Protected role permissions cannot be modified"
          : "You do not have permission to modify role permissions",
      );
      return;
    }
    updateMutation.mutate();
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isReadOnly ? "View Role Permissions" : "Manage Permissions"}
            </DialogTitle>
            <DialogDescription>
              {isProtected ? (
                <>
                  Permissions assigned to protected role{" "}
                  <strong>{role.display_name}</strong> (Read-Only)
                </>
              ) : isReadOnly ? (
                <>
                  Permissions assigned to{" "}
                  <strong>{role.display_name}</strong> (Read-Only)
                </>
              ) : (
                <>
                  Assign or revoke permissions for{" "}
                  <strong>{role.display_name}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {isProtected && (
            <div className="my-3 p-3 text-sm rounded-md bg-muted text-muted-foreground flex items-center gap-2 border">
              <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
              <span>
                This is a built-in system role. Assigned permissions are fixed and read-only.
              </span>
            </div>
          )}

          <div className="py-4">
            <PermissionMultiSelect
              permissions={allPermissions}
              selectedPermissionIds={selectedPermissionIds}
              onChange={setSelectedPermissionIds}
              disabled={isReadOnly}
            />
          </div>

          <DialogFooter>
            {isReadOnly ? (
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Permissions
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
