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
    onSuccess: (restoredUser) => {
      if (!restoredUser) return;

      toast.success("User restored");

      // Update any cached "admin-users" queries: remove duplicates and
      // prepend the restored user to page 1 so it appears at the top.
      const entries = queryClient.getQueriesData({
        queryKey: ["admin-users"],
      });
      entries.forEach(([key]) => {
        // key is the query key array, e.g. ["admin-users", page, pageSize, ...]
        queryClient.setQueryData(key, (old: any) => {
          if (!old || !old.users) return old;
          const users: any[] = Array.isArray(old.users) ? [...old.users] : [];
          // Remove any existing instance of the restored user
          const filtered = users.filter((u) => u.id !== restoredUser.id);

          // If this is page 1 (or no page present), put restored user at front
          const page =
            Array.isArray(key) && key.length > 1 ? key[1] : undefined;
          if (!page || page === 1) {
            filtered.unshift(restoredUser);
            // If paginated, ensure we don't exceed page size by trimming
            const perPage =
              Array.isArray(key) && key.length > 2 ? key[2] : undefined;
            if (perPage && filtered.length > Number(perPage)) {
              filtered.length = Number(perPage);
            }
          }

          return {
            ...old,
            users: filtered,
            total_count: (old.total_count ?? 0) + 1,
          };
        });
      });

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
