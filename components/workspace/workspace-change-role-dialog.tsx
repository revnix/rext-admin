"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleApiService, workspaceApiService } from "@/services";

const changeRoleFormSchema = z.object({
  role_id: z.string().min(1, "Please select a role"),
});

type ChangeRoleFormValues = z.infer<typeof changeRoleFormSchema>;

interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  status: string;
  is_default: boolean;
  joined_at: string | null;
  last_activity_at: string | null;
  user: {
    id: string;
    email: string;
    display_name: string;
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

  // Fetch available roles
  const { data: rolesResponse, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => roleApiService.listRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const roles = rolesResponse?.roles || [];

  const form = useForm<ChangeRoleFormValues>({
    resolver: zodResolver(changeRoleFormSchema),
    defaultValues: {
      role_id: currentRoleId || "",
    },
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: (data: ChangeRoleFormValues) => {
      if (!member) throw new Error("Member not found");
      return workspaceApiService.changeMemberRole(
        member.workspace_id,
        member.id,
        data.role_id,
      );
    },
    onSuccess: (data) => {
      toast.success(`Role updated to ${data.role_name}`);
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", member?.workspace_id],
      });
      form.reset();
      onOpenChange(false);
      onRoleChanged?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  const onSubmit = async (data: ChangeRoleFormValues) => {
    if (!member) return;
    await changeRoleMutation.mutateAsync(data);
  };

  if (!member) return null;

  const displayName = member.user.display_name || member.user.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change Member Role
          </DialogTitle>
          <DialogDescription>
            Update the role for{" "}
            <span className="font-semibold">{displayName}</span> (
            {member.user.email}) in this workspace.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Role Selection */}
            <FormField
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={changeRoleMutation.isPending || isLoadingRoles}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles
                        .filter((role) => !role.is_system_role) // Filter out system roles
                        .map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {role.display_name}
                              </span>
                              {role.description && (
                                <span className="text-xs text-muted-foreground">
                                  {role.description}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the new role for this workspace member
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Changing the member's role will
                immediately update their permissions within this workspace. The
                member will be notified of this change.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={changeRoleMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={changeRoleMutation.isPending}>
                {changeRoleMutation.isPending ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
