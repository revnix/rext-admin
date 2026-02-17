"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Shield } from "lucide-react";
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
import type { Role } from "@/types/role";

interface DeleteRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
}

export function DeleteRoleDialog({
  open,
  onOpenChange,
  role,
}: DeleteRoleDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!role) throw new Error("No role selected");
      return await apiClient.roles.delete(role.id);
    },
    onSuccess: () => {
      toast.success("Role deleted successfully");
      queryClient.invalidateQueries({ queryKey: adminQueries.roles.all() });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          "Failed to delete role. It may be assigned to users or be a system role.",
      );
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Role
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {role.is_system_role ? (
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This is a system role and cannot be deleted. System roles are
                essential for the application to function properly.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Role Name:</span>
                    <p className="text-sm text-muted-foreground">
                      {role.display_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Internal Name:</span>
                    <p className="text-sm text-muted-foreground font-mono">
                      {role.name}
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> If this role is assigned to any
                  users, the deletion will fail. You must first unassign the
                  role from all users or provide a role to reassign them to.
                </AlertDescription>
              </Alert>
            </>
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
            disabled={deleteMutation.isPending || role.is_system_role}
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
