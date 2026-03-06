"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import type { RoleWithPermissions } from "@/types/role";
import { usePermissionStore } from "@/stores/permission-store";

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleWithPermissions | null;
}

export function EditRoleDialog({
  open,
  onOpenChange,
  role,
}: EditRoleDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    display_name: "",
    description: "",
    hierarchy_level: 1,
  });
  const invalidateWorkspacePermissions = usePermissionStore(
    (state) => state.invalidateWorkspacePermissions,
  );
  useEffect(() => {
    if (role) {
      setFormData({
        display_name: role.display_name,
        description: role.description || "",
        hierarchy_level: role.hierarchy_level,
      });
    }
  }, [role]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!role) throw new Error("No role selected");

      return await apiClient.roles.update(role.id, {
        display_name: formData.display_name,
        description: formData.description || undefined,
        hierarchy_level: formData.hierarchy_level,
      });
    },
    onSuccess: async () => {
      toast.success("Role updated successfully");
      invalidateWorkspacePermissions();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["roles"] }),
        queryClient.invalidateQueries({ queryKey: ["permissions"] }),
        queryClient.invalidateQueries({ queryKey: ["workspace-permissions"] }),
      ]);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update role. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.display_name) {
      toast.error("Display name is required");
      return;
    }

    if (formData.hierarchy_level < 0 || formData.hierarchy_level > 100) {
      toast.error("Hierarchy level must be between 0 and 100");
      return;
    }

    updateMutation.mutate();
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details. The internal name cannot be changed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {role.is_system_role && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  This is a system role. Some restrictions apply to maintain
                  system integrity.
                </AlertDescription>
              </Alert>
            )}

            {/* Name (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="name">Name (Internal)</Label>
              <Input
                id="name"
                value={role.name}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Internal name cannot be changed
              </p>
            </div>

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
                disabled={role.is_system_role}
              />
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
                disabled={role.is_system_role}
              />
              <p className="text-xs text-muted-foreground">
                Higher numbers indicate higher authority
              </p>
            </div>
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
            <Button
              type="submit"
              disabled={updateMutation.isPending || role.is_system_role}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
