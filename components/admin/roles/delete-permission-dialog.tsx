"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
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
import { apiClient } from "@/lib/api-client";
import { adminQueries } from "@/lib/query-keys";
import type { PermissionWithRoles } from "@/types/role";

interface DeletePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission: PermissionWithRoles | null;
}

export function DeletePermissionDialog({
  open,
  onOpenChange,
  permission,
}: DeletePermissionDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!permission) throw new Error("No permission selected");
      return await apiClient.roles.deletePermission(permission.id);
    },
    onSuccess: () => {
      toast.success("Permission deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: adminQueries.roles.all() });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          "Failed to delete permission. It may be assigned to roles.",
      );
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (!permission) return null;

  const hasRoles = permission.roles && permission.roles.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Permission
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            permission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Display Name:</span>
                <p className="text-sm text-muted-foreground">
                  {permission.display_name}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Permission Name:</span>
                <p className="text-sm text-muted-foreground font-mono">
                  {permission.name}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Resource:</span>
                <p className="text-sm text-muted-foreground">
                  {permission.resource}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Action:</span>
                <p className="text-sm text-muted-foreground">
                  {permission.action}
                </p>
              </div>
            </div>
          </div>

          {hasRoles ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This permission is assigned to{" "}
                {permission.roles?.length || 0} role(s). Deletion will fail if
                the permission is still in use. You must first remove this
                permission from all roles.
                <div className="mt-2">
                  <strong>Assigned to:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {permission.roles?.map((role) => (
                      <li key={role.id} className="text-sm">
                        {role.display_name}
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This permission is not currently assigned to any roles and can
                be safely deleted.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete Permission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
