"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import type { AccountRecoveryRequest } from "@/lib/api-client/account-recovery";

export type RecoveryReviewAction = "approve" | "reject";

interface RecoveryReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AccountRecoveryRequest | null;
  action: RecoveryReviewAction | null;
}

export function RecoveryReviewDialog({
  open,
  onOpenChange,
  request,
  action,
}: RecoveryReviewDialogProps) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!request || !action) return;
      return action === "approve"
        ? apiClient.accountRecovery.approve(request.id, note)
        : apiClient.accountRecovery.reject(request.id, note);
    },
    onSuccess: () => {
      toast.success(
        action === "approve"
          ? "Recovery request approved and account restored"
          : "Recovery request rejected",
      );
      queryClient.invalidateQueries({ queryKey: ["admin-account-recovery"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-deleted"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      handleOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update recovery request");
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending) return;
    if (!next) setNote("");
    onOpenChange(next);
  };

  const isApprove = action === "approve";
  const subject =
    request?.user?.display_name ||
    request?.user?.full_name ||
    request?.email ||
    "this user";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isApprove ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            {isApprove ? "Approve Recovery Request" : "Reject Recovery Request"}
          </DialogTitle>
          <DialogDescription>
            {isApprove ? (
              <>
                Approving restores{" "}
                <span className="font-semibold text-foreground">{subject}</span>
                &apos;s account and emails them that they can sign in again.
              </>
            ) : (
              <>
                Rejecting leaves{" "}
                <span className="font-semibold text-foreground">{subject}</span>
                &apos;s account deleted and emails them the outcome.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="recovery-review-note">
            Note {isApprove ? "(optional)" : "— shared with the user"}
          </Label>
          <Textarea
            id="recovery-review-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              isApprove
                ? "Add context for the audit log or the user…"
                : "Explain why the request was rejected…"
            }
            rows={3}
            disabled={mutation.isPending}
          />
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
            variant={isApprove ? "default" : "destructive"}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isApprove ? "Approve & Restore" : "Reject Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
