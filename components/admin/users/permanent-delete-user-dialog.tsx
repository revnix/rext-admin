"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/api-client/users";

interface PermanentDeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const CONFIRM_PHRASE = "DELETE";

export function PermanentDeleteUserDialog({
  open,
  onOpenChange,
  user,
}: PermanentDeleteUserDialogProps) {
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      return apiClient.users.permanentlyDeleteUser(user.id);
    },
    onSuccess: () => {
      toast.success("User permanently deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-users-deleted"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      handleOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to permanently delete user");
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending) return;
    if (!next) setConfirmation("");
    onOpenChange(next);
  };

  const canConfirm =
    confirmation.trim() === CONFIRM_PHRASE && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive text-xl">
            <Trash2 className="h-5 w-5" />
            Permanently Delete User
          </DialogTitle>
          <DialogDescription>
            Permanently delete{" "}
            <span className="font-semibold text-foreground">
              {user?.display_name || user?.full_name || user?.email}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>This cannot be undone</AlertTitle>
            <AlertDescription className="text-xs">
              Every workspace this user owns and its content, knowledge,
              personas and media are permanently deleted. The account's personal
              data is erased and it can never be recovered.
            </AlertDescription>
          </Alert>

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

          <div className="space-y-2">
            <Label htmlFor="permanent-delete-confirmation">
              Type <span className="font-semibold">{CONFIRM_PHRASE}</span> to
              confirm
            </Label>
            <Input
              id="permanent-delete-confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
              disabled={mutation.isPending}
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={!canConfirm}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
