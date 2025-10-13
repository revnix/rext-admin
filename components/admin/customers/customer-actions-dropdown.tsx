"use client";

import { useMutation } from "@tanstack/react-query";
import {
  Clock,
  MoreVertical,
  RotateCcw,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";

interface CustomerActionsDropdownProps {
  customerId: string;
  user: any;
  subscription: any;
  onActionComplete: () => void;
}

export function CustomerActionsDropdown({
  customerId,
  user,
  subscription,
  onActionComplete,
}: CustomerActionsDropdownProps) {
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: string | null;
    title: string;
    description: string;
  }>({
    open: false,
    action: null,
    title: "",
    description: "",
  });
  const [reason, setReason] = useState("");
  const [extensionDays, setExtensionDays] = useState(7);

  const performActionMutation = useMutation({
    mutationFn: async (data: {
      action: string;
      reason: string;
      metadata?: any;
    }) => {
      return await apiClient.request(
        `/api/v1/admin/customers/${customerId}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },
    onSuccess: () => {
      toast.success("Action performed successfully");
      setActionDialog({
        open: false,
        action: null,
        title: "",
        description: "",
      });
      setReason("");
      onActionComplete();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to perform action");
    },
  });

  const openActionDialog = (
    action: string,
    title: string,
    description: string,
  ) => {
    setActionDialog({ open: true, action, title, description });
    setReason("");
  };

  const handleConfirmAction = () => {
    if (!actionDialog.action || !reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    const metadata =
      actionDialog.action === "extend_trial" ? { days: extensionDays } : {};

    performActionMutation.mutate({
      action: actionDialog.action,
      reason,
      metadata,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Customer Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Deactivate/Activate */}
          {user.is_active ? (
            <DropdownMenuItem
              onClick={() =>
                openActionDialog(
                  "deactivate",
                  "Deactivate Account",
                  "This will prevent the user from logging in. Are you sure?",
                )
              }
            >
              <UserX className="h-4 w-4 mr-2" />
              Deactivate Account
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() =>
                openActionDialog(
                  "activate",
                  "Activate Account",
                  "This will allow the user to log in again. Are you sure?",
                )
              }
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Activate Account
            </DropdownMenuItem>
          )}

          {/* Reset Usage */}
          {subscription && (
            <DropdownMenuItem
              onClick={() =>
                openActionDialog(
                  "reset_usage",
                  "Reset Usage",
                  "This will reset the user's API call counter to 0. Are you sure?",
                )
              }
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Usage
            </DropdownMenuItem>
          )}

          {/* Extend Trial */}
          {subscription?.status === "trial" && (
            <DropdownMenuItem
              onClick={() =>
                openActionDialog(
                  "extend_trial",
                  "Extend Trial",
                  "Extend the user's trial period by additional days.",
                )
              }
            >
              <Clock className="h-4 w-4 mr-2" />
              Extend Trial
            </DropdownMenuItem>
          )}

          {/* Cancel Subscription */}
          {subscription && subscription.status !== "cancelled" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  openActionDialog(
                    "cancel_subscription",
                    "Cancel Subscription",
                    "This will immediately cancel the user's subscription. Are you sure?",
                  )
                }
                className="text-red-600"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Subscription
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog.title}</DialogTitle>
            <DialogDescription>{actionDialog.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionDialog.action === "extend_trial" && (
              <div className="space-y-2">
                <Label htmlFor="days">Extension Days</Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  max="30"
                  value={extensionDays}
                  onChange={(e) =>
                    setExtensionDays(parseInt(e.target.value, 10) || 7)
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Provide a reason for this action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ ...actionDialog, open: false })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={performActionMutation.isPending || !reason.trim()}
            >
              {performActionMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
