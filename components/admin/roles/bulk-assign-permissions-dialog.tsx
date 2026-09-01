"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import type { Permission, Role } from "@/types/role";
import { PermissionMultiSelect } from "./permission-multi-select";
import { usePermissionStore } from "@/stores/permission-store";

interface BulkAssignPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  allPermissions: Permission[];
}

export function BulkAssignPermissionsDialog({
  open,
  onOpenChange,
  roles,
  allPermissions,
}: BulkAssignPermissionsDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );
  const [operation, setOperation] = useState<"add" | "remove">("add");
  const invalidateWorkspacePermissions = usePermissionStore(
    (state) => state.invalidateWorkspacePermissions,
  );
  const bulkMutation = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled(
        selectedRoleIds.map(async (roleId) => {
          if (operation === "add") {
            return await apiClient.roles.assignPermissions(roleId, {
              permission_ids: selectedPermissionIds,
            });
          } else {
            // Remove permissions
            return await Promise.all(
              selectedPermissionIds.map((permId) =>
                apiClient.roles.revokePermission(roleId, permId),
              ),
            );
          }
        }),
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed, total: results.length };
    },
    onSuccess: async (data) => {
      const { successful, failed, total } = data;

      if (failed === 0) {
        toast.success(
          `All ${total} role(s) updated successfully — ${operation === "add" ? "permissions assigned" : "permissions removed"}.`,
        );
      } else if (successful === 0) {
        toast.error(
          `All ${total} role operations failed. No changes were applied.`,
        );
      } else {
        toast.warning(
          `Partial success: ${successful} of ${total} role(s) updated, ${failed} failed.`,
        );
      }

      invalidateWorkspacePermissions();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["roles"] }),
        queryClient.invalidateQueries({ queryKey: ["permissions"] }),
        queryClient.invalidateQueries({ queryKey: ["workspace-permissions"] }),
      ]);
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Failed to perform bulk operation. Please try again.",
      );
    },
  });

  const handleClose = () => {
    setSelectedRoleIds([]);
    setSelectedPermissionIds([]);
    setOperation("add");
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRoleIds.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    if (selectedPermissionIds.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    bulkMutation.mutate();
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const toggleAllRoles = () => {
    if (selectedRoleIds.length === roles.length) {
      setSelectedRoleIds([]);
    } else {
      setSelectedRoleIds(roles.map((r) => r.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bulk Permission Assignment
            </DialogTitle>
            <DialogDescription>
              Assign or remove permissions to/from multiple roles at once
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Operation Type */}
            <div className="space-y-2">
              <Label htmlFor="operation">Operation</Label>
              <Select
                value={operation}
                onValueChange={(value: "add" | "remove") => setOperation(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Permissions to Roles</SelectItem>
                  <SelectItem value="remove">
                    Remove Permissions from Roles
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Roles ({selectedRoleIds.length} selected)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleAllRoles}
                >
                  {selectedRoleIds.length === roles.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
              <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="h-4 w-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.display_name}</span>
                        {role.is_system_role && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {role.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Level {role.hierarchy_level}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>

            {/* Permission Selection */}
            <div className="space-y-2">
              <Label>
                Select Permissions ({selectedPermissionIds.length} selected)
              </Label>
              <PermissionMultiSelect
                permissions={allPermissions}
                selectedPermissionIds={selectedPermissionIds}
                onChange={setSelectedPermissionIds}
              />
            </div>

            {/* Summary */}
            {selectedRoleIds.length > 0 && selectedPermissionIds.length > 0 && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Summary:</p>
                <p className="text-sm text-muted-foreground">
                  {operation === "add" ? "Adding" : "Removing"}{" "}
                  <strong>{selectedPermissionIds.length}</strong> permission(s){" "}
                  {operation === "add" ? "to" : "from"}{" "}
                  <strong>{selectedRoleIds.length}</strong> role(s)
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={bulkMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={bulkMutation.isPending}>
              {bulkMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {operation === "add" ? "Assign" : "Remove"} Permissions
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
