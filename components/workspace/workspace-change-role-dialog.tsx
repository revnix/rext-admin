"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FieldController } from "@/components/forms/field-controller";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Notice } from "@/components/ui/notice";
import { apiClient } from "@/lib/api-client";
import {
  type ChangeMemberRoleValues,
  changeMemberRoleSchema,
} from "@/schemas/workspace-schemas";
import { usePermissionStore } from "@/stores/permission-store";

interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  status: string;
  is_default: boolean;
  joined_at: string | null;
  last_activity_at: string | null;
  role?: {
    id?: string;
    name?: string;
    display_name: string;
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
    display_name: string | null;
    is_verified: boolean;
  };
}

interface WorkspaceChangeRoleDialogProps {
  member: WorkspaceMember | null;
  currentRoleId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleChanged?: () => void;
}

export function WorkspaceChangeRoleDialog({
  member,
  currentRoleId,
  open,
  onOpenChange,
  onRoleChanged,
}: WorkspaceChangeRoleDialogProps) {
  const queryClient = useQueryClient();

  // Fetch available roles for workspace member assignments
  const { data: rolesResponse, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["workspace-available-roles"],
    queryFn: () => apiClient.workspaces.getAvailableRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const roles = (rolesResponse?.roles || []).filter(
    (r) => r.name.toLowerCase() !== "workspace_owner",
  );
  const invalidateWorkspacePermissions = usePermissionStore(
    (state) => state.invalidateWorkspacePermissions,
  );

  // The current role isn't a new role to pick, so the choice starts empty.
  const form = useZodForm(changeMemberRoleSchema, {
    defaultValues: { role_id: "" },
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: (data: ChangeMemberRoleValues) => {
      if (!member) throw new Error("Member not found");
      return apiClient.members.changeRole(
        member.workspace_id,
        member.id,
        data.role_id,
      );
    },
    onSuccess: async () => {
      toast.success("Role changed");

      const workspaceId = member?.workspace_id;
      if (workspaceId) {
        invalidateWorkspacePermissions(workspaceId);
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["workspace-members", workspaceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["workspace-permissions", workspaceId],
        }),
      ]);

      form.reset();
      onOpenChange(false);
      onRoleChanged?.();
    },
    onError: (error: Error) => {
      toast.error(`The role wasn't changed: ${error.message}`);
    },
  });

  const onSubmit = async (data: ChangeMemberRoleValues) => {
    if (!member) return;
    await changeRoleMutation.mutateAsync(data).catch(() => undefined);
  };
  const submitting = form.formState.isSubmitting;

  if (!member) return null;

  const displayName =
    member.user.display_name || member.user.name || member.user.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            The role of <span className="font-medium">{displayName}</span> (
            {member.user.email}) in this workspace.
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <FieldController
            control={form.control}
            name="role_id"
            label="New role"
            required
          >
            {(field) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={submitting || isLoadingRoles}
              >
                <SelectTrigger
                  id={field.id}
                  aria-invalid={field["aria-invalid"]}
                  aria-describedby={field["aria-describedby"]}
                  onBlur={field.onBlur}
                  ref={field.ref}
                >
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter(
                      (role) =>
                        !role.is_system_role && // Filter out system roles
                        role.id !== currentRoleId, // The member's current role is not a valid "new" role
                    )
                    .map((role) => (
                      <SelectItem
                        key={role.id}
                        value={role.id}
                        // Description moves to a tooltip: rendering it as a
                        // second line made every item tall enough that the
                        // open dropdown overflowed the dialog's box.
                        title={role.description || role.display_name}
                      >
                        <span className="font-medium">{role.display_name}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </FieldController>

          <Notice tone="info">
            The new role's permissions apply at once, and the member is told.
          </Notice>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" aria-hidden />}
              Change role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
