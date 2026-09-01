"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Shield } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { isProtectedRole } from "@/lib/permissions";
import type { Role } from "@/types/role";
import { usePermissionStore } from "@/stores/permission-store";

const NO_REASSIGNMENT = "__none__";

interface DeleteRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  /** All roles, used to populate the reassignment target list */
  roles?: Role[];
}

export function DeleteRoleDialog({
  open,
  onOpenChange,
  role,
  roles = [],
}: DeleteRoleDialogProps) {
  const queryClient = useQueryClient();
  const [reassignTo, setReassignTo] = useState<string>(NO_REASSIGNMENT);

  const invalidateWorkspacePermissions = usePermissionStore(
    (state) => state.invalidateWorkspacePermissions,
  );

  // Reset the selector whenever a different role is opened, so a target
  // picked for one role can't leak into the next deletion.
  useEffect(() => {
    setReassignTo(NO_REASSIGNMENT);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!role) throw new Error("No role selected");
      return await apiClient.roles.delete(
        role.id,
        reassignTo === NO_REASSIGNMENT ? undefined : reassignTo,
      );
    },
    onSuccess: async () => {
      toast.success(
        reassignTo === NO_REASSIGNMENT
          ? "Role deleted successfully"
          : "Role deleted and its users reassigned",
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
        error.message ||
          "Failed to delete role. It may be assigned to users or be protected.",
      );
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (!role) return null;

  const isProtected = isProtectedRole(role);

  // Only roles that can actually receive users: anything but the one being
  // deleted. Protected roles are valid targets — the backend only blocks
  // deleting them, not assigning to them.
  const reassignmentTargets = roles.filter((r) => r.id !== role.id);

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
          {isProtected ? (
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {role.is_system_role
                  ? "This is a system role and cannot be deleted. System roles are essential for the application to function properly."
                  : "This is a standard workspace role and cannot be deleted. It is required for workspace membership to function properly."}
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

              <div className="space-y-2">
                <Label htmlFor="reassign-to">
                  Reassign users to{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Select value={reassignTo} onValueChange={setReassignTo}>
                  <SelectTrigger id="reassign-to">
                    <SelectValue placeholder="Don't reassign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_REASSIGNMENT}>
                      Don&apos;t reassign
                    </SelectItem>
                    {reassignmentTargets.map((target) => (
                      <SelectItem key={target.id} value={target.id}>
                        {target.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> If this role is assigned to any
                  users, the deletion will fail unless you pick a role above to
                  reassign them to.
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
            disabled={deleteMutation.isPending || isProtected}
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
