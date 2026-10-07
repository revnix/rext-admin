"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Notice } from "@/components/ui/notice";
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
import { isProtectedRole } from "@/lib/permissions";
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
  });
  const invalidateWorkspacePermissions = usePermissionStore(
    (state) => state.invalidateWorkspacePermissions,
  );
  useEffect(() => {
    if (role) {
      setFormData({
        display_name: role.display_name,
        description: role.description || "",
      });
    }
  }, [role]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!role) throw new Error("No role selected");

      return await apiClient.roles.update(role.id, {
        display_name: formData.display_name,
        description: formData.description || undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Role updated successfully");
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

    updateMutation.mutate();
  };

  if (!role) return null;

  const isProtected = isProtectedRole(role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details. The internal name cannot be changed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isProtected && (
              <Notice>
                {role.is_system_role
                  ? "This is a system role and cannot be modified. System roles are essential for the application to function properly."
                  : "This is a standard workspace role and cannot be modified. It is required for workspace membership to function properly."}
              </Notice>
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
                disabled={isProtected}
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
              disabled={updateMutation.isPending || isProtected}
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
