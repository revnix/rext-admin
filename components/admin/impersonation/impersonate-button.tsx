"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface ImpersonateButtonProps {
  userId: string;
  userName: string;
  userEmail: string;
}

export function ImpersonateButton({
  userId,
  userName,
  userEmail,
}: ImpersonateButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const impersonateMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.impersonation.start(userId);
    },
    onSuccess: (data) => {
      // Update tokens
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }

      // Clear all queries to force refresh with new user context
      queryClient.clear();

      toast.success(`Now impersonating ${userName}`);
      setConfirmOpen(false);

      // Redirect to main dashboard
      router.push("/");

      // Force page reload to update user context
      setTimeout(() => {
        window.location.reload();
      }, 100);
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to start impersonation";
      toast.error(errorMessage);
    },
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        className="gap-2"
      >
        <UserCog className="h-4 w-4" />
        Impersonate
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impersonate User</DialogTitle>
            <DialogDescription>
              You are about to impersonate this user. All actions will be
              performed as them.
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-orange-500 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-sm text-orange-900">
              <strong className="font-semibold">Warning:</strong> While
              impersonating, you will have the same permissions as the user. All
              actions will be logged in the audit trail.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">User Name:</span>
              <span className="font-medium">{userName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{userEmail}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">User ID:</span>
              <span className="font-mono text-xs">{userId.slice(0, 8)}...</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={impersonateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => impersonateMutation.mutate()}
              disabled={impersonateMutation.isPending}
            >
              {impersonateMutation.isPending
                ? "Starting..."
                : "Start Impersonation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
