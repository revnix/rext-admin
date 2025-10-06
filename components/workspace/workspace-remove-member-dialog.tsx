"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, UserMinus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiClient } from "@/lib/api-client";

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

interface WorkspaceRemoveMemberDialogProps {
  member: WorkspaceMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoved?: (memberId: string) => void;
}

export function WorkspaceRemoveMemberDialog({
  member,
  open,
  onOpenChange,
  onRemoved,
}: WorkspaceRemoveMemberDialogProps) {
  const queryClient = useQueryClient();
  const [isRemoving, setIsRemoving] = useState(false);

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({
      workspaceId,
      memberId,
    }: {
      workspaceId: string;
      memberId: string;
    }) => apiClient.members.remove(workspaceId, memberId),
    onSuccess: (_, variables) => {
      toast.success("Member removed successfully");
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", variables.workspaceId],
      });
      onOpenChange(false);
      onRemoved?.(variables.memberId);
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove member: ${error.message}`);
    },
  });

  const handleRemove = async () => {
    if (!member) return;

    setIsRemoving(true);
    try {
      await removeMemberMutation.mutateAsync({
        workspaceId: member.workspace_id,
        memberId: member.id,
      });
    } finally {
      setIsRemoving(false);
    }
  };

  if (!member) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {member.user.display_name}
              </span>{" "}
              ({member.user.email}) from this workspace?
            </p>
            <p className="text-sm">This action will:</p>
            <ul className="text-sm list-disc list-inside space-y-1 ml-2">
              <li>Remove their access to this workspace</li>
              <li>Revoke their assigned role and permissions</li>
              <li>They will no longer see this workspace in their list</li>
            </ul>
            <p className="text-sm font-medium">
              This action cannot be undone. You can invite them again later if
              needed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={isRemoving}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isRemoving ? (
              "Removing..."
            ) : (
              <>
                <UserMinus className="h-4 w-4 mr-2" />
                Remove Member
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
