"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import type { Permission } from "@/types/role";
import { PermissionMultiSelect } from "./permission-multi-select";
import { usePermissionStore } from "@/stores/permission-store";
import { isWorkspaceAssignablePermission } from "@/lib/permissions";

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: Permission[];
}

// Hierarchy level is no longer author-editable; new roles sit at the bottom of
// the hierarchy, which the backend's escalation guard allows any role creator
// to grant.
const NEW_ROLE_HIERARCHY_LEVEL = 1;

export function CreateRoleDialog({
  open,
  onOpenChange,
  permissions,
}: CreateRoleDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    description: "",
  });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );
  const invalidateWorkspacePermissions = usePermissionStore(
    (state) => state.invalidateWorkspacePermissions,
  );
  // Roles created here are always workspace roles, so platform-scoped
  // resources are not offerable.
  const workspacePermissions = useMemo(
    () => permissions.filter(isWorkspaceAssignablePermission),
    [permissions],
  );
  const createMutation = useMutation({
    mutationFn: async () => {
      // Create role first
      const roleResponse = await apiClient.roles.create({
        name: formData.name.toLowerCase().replace(/\s+/g, "_"),
        display_name: formData.display_name,
        description: formData.description || undefined,
        hierarchy_level: NEW_ROLE_HIERARCHY_LEVEL,
        is_workspace_role: true,
      });

      // Assign permissions if any selected
      if (selectedPermissionIds.length > 0) {
        await apiClient.roles.assignPermissions(roleResponse.id, {
          permission_ids: selectedPermissionIds,
        });
      }

      return roleResponse;
    },
    onSuccess: async () => {
      toast.success("Role created successfully");
      handleClose();
      invalidateWorkspacePermissions();
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["roles"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["permissions"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["workspace-permissions"],
          refetchType: "all",
        }),
        // Invalidate workspace role selectors (invite / change-role dialogs)
        queryClient.invalidateQueries({
          queryKey: ["workspace-available-roles"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["audit-logs"],
          refetchType: "all",
        }),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create role. Please try again.");
    },
  });

  const handleClose = () => {
    setFormData({
      name: "",
      display_name: "",
      description: "",
    });
    setSelectedPermissionIds([]);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.display_name.trim()) {
      toast.error("Name and display name are required");
      return;
    }

    if (
      !isValidRoleName(formData.name) ||
      !isValidRoleName(formData.display_name)
    ) {
      toast.error(
        "Role name can only contain letters, spaces, and underscores.",
      );
      return;
    }

    // A custom role with no permissions grants nothing and only clutters the
    // role list — it must not be created.
    if (selectedPermissionIds.length === 0) {
      toast.error("Select at least one permission for the role");
      return;
    }

    createMutation.mutate();
  };

  const isValidRoleName = (name: string) => {
    return /^[a-zA-Z_ ]+$/.test(name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role and assign permissions. The name will be
              automatically formatted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="display_name"
                placeholder="e.g., Content Editor"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    display_name: e.target.value.replace(/[0-9]/g, ""),
                  })
                }
                required
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name (Internal) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., content_editor"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value.replace(/[0-9]/g, ""),
                  })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Used internally. Will be converted to lowercase with
                underscores.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the role's purpose and responsibilities..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Permissions */}
            <div className="space-y-2">
              <Label>
                Permissions <span className="text-destructive">*</span>
              </Label>
              <PermissionMultiSelect
                permissions={workspacePermissions}
                selectedPermissionIds={selectedPermissionIds}
                onChange={setSelectedPermissionIds}
              />
              <p className="text-xs text-muted-foreground">
                At least one permission is required — a role without permissions
                cannot be created.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending || selectedPermissionIds.length === 0
              }
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
