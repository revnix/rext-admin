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

interface CreatePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePermissionDialog({
  open,
  onOpenChange,
}: CreatePermissionDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    resource: "",
    action: "",
    display_name: "",
    description: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const name = `${formData.resource.toLowerCase()}.${formData.action.toLowerCase()}`;
      return await apiClient.roles.createPermission({
        name,
        display_name: formData.display_name,
        description: formData.description || undefined,
        resource: formData.resource.toLowerCase(),
        action: formData.action.toLowerCase(),
      });
    },
    onSuccess: () => {
      toast.success("Permission created successfully");
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Failed to create permission. Please try again.",
      );
    },
  });

  const handleClose = () => {
    setFormData({
      resource: "",
      action: "",
      display_name: "",
      description: "",
    });
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.resource || !formData.action || !formData.display_name) {
      toast.error("Resource, action, and display name are required");
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

    createMutation.mutate();
  };

  const generatedName =
    formData.resource && formData.action
      ? `${formData.resource.toLowerCase()}.${formData.action.toLowerCase()}`
      : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Permission</DialogTitle>
            <DialogDescription>
              Create a new permission. Format: resource.action (e.g.,
              user.create)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
              <p className="text-xs text-muted-foreground">
                The resource this permission applies to (lowercase, underscores
                only)
              </p>
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
              <p className="text-xs text-muted-foreground">
                The action being performed (lowercase, underscores only)
              </p>
            </div>

            {/* Generated Name Preview */}
            {generatedName && (
              <div className="rounded-lg border p-3 bg-muted/50">
                <span className="text-sm font-medium">Generated Name: </span>
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
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Permission
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
