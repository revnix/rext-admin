"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
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

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: Permission[];
}

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
    hierarchy_level: 1,
  });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );
  const invalidateWorkspacePermissions = usePermissionStore(
    (state) => state.invalidateWorkspacePermissions,
  );
  const createMutation = useMutation({
    mutationFn: async () => {
      // Create role first
      const roleResponse = await apiClient.roles.create({
        name: formData.name.toLowerCase().replace(/\s+/g, "_"),
        display_name: formData.display_name,
        description: formData.description || undefined,
        hierarchy_level: formData.hierarchy_level,
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
      hierarchy_level: 1,
    });
    setSelectedPermissionIds([]);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.display_name) {
      toast.error("Name and display name are required");
      return;
    }

    if (formData.hierarchy_level < 0 || formData.hierarchy_level > 100) {
      toast.error("Hierarchy level must be between 0 and 100");
      return;
    }

    createMutation.mutate();
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
                  setFormData({ ...formData, display_name: e.target.value })
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
                  setFormData({ ...formData, name: e.target.value })
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

            {/* Hierarchy Level */}
            <div className="space-y-2">
              <Label htmlFor="hierarchy_level">Hierarchy Level (0-100)</Label>
              <Input
                id="hierarchy_level"
                type="number"
                min="0"
                max="100"
                value={formData.hierarchy_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hierarchy_level: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Higher numbers indicate higher authority. Super admin is 100.
              </p>
            </div>

            {/* Permissions */}
            <div className="space-y-2">
              <Label>Permissions</Label>
              <PermissionMultiSelect
                permissions={permissions}
                selectedPermissionIds={selectedPermissionIds}
                onChange={setSelectedPermissionIds}
              />
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
            <Button type="submit" disabled={createMutation.isPending}>
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
