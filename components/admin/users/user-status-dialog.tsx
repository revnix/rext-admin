"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, Loader2, PauseCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Notice } from "@/components/ui/notice";
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
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import type { User, UserStatusAction } from "@/lib/api-client/users";

interface UserStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  action: UserStatusAction | null;
}

/** Backend caps `reason` at 500 characters (UserStatusRequest). */
const REASON_MAX = 500;

const COPY: Record<
  UserStatusAction,
  {
    title: string;
    description: string;
    submit: string;
    icon: typeof Ban;
    destructive: boolean;
    reasonRequired: boolean;
    reasonPlaceholder: string;
    reasonHint: string;
    warning?: string;
  }
> = {
  suspend: {
    title: "Suspend user",
    description:
      "Temporary. Signs the user out of every device immediately and blocks sign-in until an admin reactivates them. The account and its data are kept.",
    submit: "Suspend user",
    icon: PauseCircle,
    destructive: true,
    reasonRequired: true,
    reasonPlaceholder: "e.g. Repeated abuse reports from workspace owners",
    reasonHint: "Recorded in the audit log against your account.",
  },
  ban: {
    title: "Ban user",
    description:
      "Permanent. Signs the user out of every device immediately and blocks sign-in for good. Only use it where a suspension would not be enough.",
    submit: "Ban user",
    icon: Ban,
    destructive: true,
    reasonRequired: true,
    reasonPlaceholder:
      "e.g. Confirmed fraud — payment disputes on three orders",
    reasonHint: "Recorded in the audit log against your account.",
    warning:
      "Banning does not delete the account, its workspaces, or its subscriptions.",
  },
  activate: {
    title: "Activate user",
    description:
      "Restores sign-in access. Use this to lift a suspension or a ban.",
    submit: "Activate user",
    icon: CheckCircle2,
    destructive: false,
    reasonRequired: false,
    reasonPlaceholder: "e.g. Suspension lifted — abuse reports were unfounded",
    reasonHint: "Optional. Recorded in the audit log if provided.",
  },
};

/**
 * Admin dialog for suspend / activate / ban.
 *
 * Backs onto POST /api/v1/user/{id}/{action}, which requires `user.update`
 * and writes an audit entry with the old status, new status and reason.
 */
export function UserStatusDialog({
  open,
  onOpenChange,
  user,
  action,
}: UserStatusDialogProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  // Clear the reason whenever a new action is opened, so it can't carry over
  // from a previous user.
  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const statusMutation = useMutation({
    mutationFn: async () => {
      if (!user || !action) throw new Error("No user selected");
      return apiClient.users.setStatus(user.id, action, reason);
    },
    onSuccess: async (data) => {
      toast.success(
        `${data.email} is now ${data.new_status}`,
        data.old_status !== data.new_status
          ? { description: `Changed from ${data.old_status}.` }
          : undefined,
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not change the user's status.");
    },
  });

  if (!user || !action) return null;

  const copy = COPY[action];
  const Icon = copy.icon;
  const displayName = user.display_name || user.full_name || user.email;
  const reasonMissing = copy.reasonRequired && !reason.trim();
  const reasonTooLong = reason.length > REASON_MAX;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reasonMissing) {
      toast.error("Add a reason so the audit log explains this change.");
      return;
    }
    if (reasonTooLong) {
      toast.error(`Keep the reason under ${REASON_MAX} characters.`);
      return;
    }
    statusMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon
                className={`h-5 w-5 ${copy.destructive ? "text-destructive" : "text-success-600"}`}
              />
              {copy.title}
            </DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-md border p-3 bg-muted/50">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Current status:{" "}
                <code className="text-xs bg-background px-1 rounded-md">
                  {user.status}
                </code>
              </p>
            </div>

            {copy.warning && <Notice tone="warning">{copy.warning}</Notice>}

            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason
                {copy.reasonRequired && (
                  <span className="text-destructive"> *</span>
                )}
              </Label>
              <Textarea
                id="reason"
                placeholder={copy.reasonPlaceholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={REASON_MAX}
                required={copy.reasonRequired}
              />
              <div className="flex justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {copy.reasonHint}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {reason.length}/{REASON_MAX}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={statusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={copy.destructive ? "destructive" : "default"}
              disabled={statusMutation.isPending || reasonMissing}
            >
              {statusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
