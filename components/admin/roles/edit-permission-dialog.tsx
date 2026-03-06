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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import type { Permission } from "@/types/role";
import { usePermissionStore } from "@/stores/permission-store";

interface EditPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission: Permission | null;
}

export function EditPermissionDialog({
  open,
  onOpenChange,
  permission,
}: EditPermissionDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    display_name: "",
    description: "",
    resource: "",
    action: "",
  });
  const invalidateWorkspacePermissions = usePermissionStore(
    (state) => state.invalidateWorkspacePermissions,
  );
  useEffect(() => {
    if (permission) {
      setFormData({
        display_name: permission.display_name,
        description: permission.description || "",
        resource: permission.resource,
        action: permission.action,
      });
    }
  }, [permission]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!permission) throw new Error("No permission selected");

      return await apiClient.roles.updatePermission(permission.id, {
        display_name: formData.display_name,
        description: formData.description || undefined,
        resource: formData.resource.toLowerCase(),
        action: formData.action.toLowerCase(),
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
      toast.error(
        error.message || "Failed to update permission. Please try again.",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.display_name || !formData.resource || !formData.action) {
      toast.error("Display name, resource, and action are required");
      return;
    }

    // Validate format
    if (!/^[a-z_]+$/.test(formData.resource.toLowerCase())) {
      toast.error(
        "Resource must contain only lowercase letters and underscores",
      );
      return;
    }

    if (!/^[a-z_]+$/.test(formData.action.toLowerCase())) {
      toast.error("Action must contain only lowercase letters and underscores");
      return;
    }

    updateMutation.mutate();
  };

  if (!permission) return null;

  const generatedName = `${formData.resource.toLowerCase()}.${formData.action.toLowerCase()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>
              Update permission details. Changing resource or action will update
              the permission name.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Name */}
            <div className="rounded-lg border p-3 bg-muted/50">
              <span className="text-sm font-medium">Current Name: </span>
              <code className="text-sm font-mono">{permission.name}</code>
            </div>

            {/* Resource */}
            <div className="space-y-2">
              <Label htmlFor="resource">
                Resource <span className="text-destructive">*</span>
              </Label>
              <Input
                id="resource"
                placeholder="e.g., content"
                value={formData.resource}
                onChange={(e) =>
                  setFormData({ ...formData, resource: e.target.value })
                }
                required
              />
            </div>

            {/* Action */}
            <div className="space-y-2">
              <Label htmlFor="action">
                Action <span className="text-destructive">*</span>
              </Label>
              <Input
                id="action"
                placeholder="e.g., create, read, update, delete"
                value={formData.action}
                onChange={(e) =>
                  setFormData({ ...formData, action: e.target.value })
                }
                required
              />
            </div>

            {/* New Name Preview */}
            {generatedName !== permission.name && (
              <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                <span className="text-sm font-medium">New Name: </span>
                <code className="text-sm font-mono">{generatedName}</code>
              </div>
            )}

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="display_name"
                placeholder="e.g., Create Content"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this permission allows..."
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
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Permission
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
