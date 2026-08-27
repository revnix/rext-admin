"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
}

export function ManageRolePermissionsDialog({
  open,
  onOpenChange,
  role,
  allPermissions,
}: ManageRolePermissionsDialogProps) {
  const queryClient = useQueryClient();
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );

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

      const currentPermissionIds = role.permissions?.map((p) => p.id) || [];
      const toAdd = selectedPermissionIds.filter(
        (id) => !currentPermissionIds.includes(id),
      );
      const toRemove = currentPermissionIds.filter(
        (id) => !selectedPermissionIds.includes(id),
      );

      // Add new permissions
      if (toAdd.length > 0) {
        await apiClient.roles.assignPermissions(role.id, {
          permission_ids: toAdd,
        });
      }

      // Remove permissions
      for (const permissionId of toRemove) {
        await apiClient.roles.revokePermission(role.id, permissionId);
      }

      return { added: toAdd.length, removed: toRemove.length };
    },
    onSuccess: async (data) => {
      toast.success(
        `Permissions updated: ${data.added} added, ${data.removed} removed`,
      );

      invalidateWorkspacePermissions();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["roles"] }),
        queryClient.invalidateQueries({ queryKey: ["permissions"] }),
        queryClient.invalidateQueries({ queryKey: ["workspace-permissions"] }),
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
    updateMutation.mutate();
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Assign or revoke permissions for{" "}
              <strong>{role.display_name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <PermissionMultiSelect
              permissions={allPermissions}
              selectedPermissionIds={selectedPermissionIds}
              onChange={setSelectedPermissionIds}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Permissions
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
