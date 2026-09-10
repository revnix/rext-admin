"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw } from "lucide-react";
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
import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/api-client/users";

interface RestoreUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function RestoreUserDialog({
  open,
  onOpenChange,
  user,
}: RestoreUserDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      return apiClient.users.restoreUser(user.id);
    },
    onSuccess: () => {
      toast.success("User restored");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-deleted"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to restore user");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <RotateCcw className="h-5 w-5" />
            Restore User Account
          </DialogTitle>
          <DialogDescription>
            Restore{" "}
            <span className="font-semibold text-foreground">
              {user?.display_name || user?.full_name || user?.email}
            </span>
            ? The account returns to active and the owner can sign in again.
          </DialogDescription>
        </DialogHeader>

        {user?.email && (
          <div className="p-3 bg-muted/50 rounded-md text-xs space-y-1">
            <p>
              <span className="font-semibold">User ID:</span> {user.id}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {user.email}
            </p>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Restore User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
