"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTransition } from "react";
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
import { AUTH_SESSION_TOKEN_SWAP_ACTION } from "@/lib/auth-utils";
import { useAuthStore } from "@/stores/auth-store";
import type { Route } from "next";

interface User {
  id: string;
  email: string;
  full_name?: string;
  display_name?: string;
}

interface ImpersonationStartDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStarted?: () => void;
}

/**
 * Impersonation Start Dialog Component
 *
 * Confirmation dialog for admins to start impersonating a user.
 * Warns about audit logging and provides clear information about the action.
 */
export function ImpersonationStartDialog({
  user,
  open,
  onOpenChange,
  onStarted,
}: ImpersonationStartDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setTokens } = useAuthStore();
  const { update } = useSession();
  const [, startTransition] = useTransition();

  // Start impersonation mutation
  const startImpersonationMutation = useMutation({
    mutationFn: (userId: string) => apiClient.impersonation.start(userId),
    onSuccess: async (data) => {
      // Bridge the moment until update() lands in React state (same pattern
      // as the stop flow) — getAuthHeaders() prefers this store when set.
      setTokens(data.access_token, data.refresh_token);

      // Swap the impersonation tokens into the NextAuth session too, so the
      // session (and middleware) agree with the API tokens instead of staying
      // split-brained on the admin's credentials.
      await update({
        authAction: AUTH_SESSION_TOKEN_SWAP_ACTION,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });

      toast.success(`Now impersonating ${data.impersonated_user_name}`, {
        description: "All actions will be performed as this user",
      });

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();

      // Close dialog
      onOpenChange(false);
      onStarted?.();

      // Leave the admin area: the impersonated user cannot access admin
      // pages, so staying here would just render a wall of 403s. The
      // dashboard renders PageLayout, which shows the impersonation banner
      // (with the "Stop Impersonation" button).
      startTransition(() => {
        router.push("/" as Route);
        router.refresh();
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to start impersonation: ${error.message}`);
    },
  });

  const handleStartImpersonation = () => {
    if (!user) return;
    startImpersonationMutation.mutate(user.id);
  };

  if (!user) return null;

  const displayName = user.display_name || user.full_name || user.email;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Start User Impersonation</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <User2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">
                  {displayName}
                </span>
                <span className="text-sm">{user.email}</span>
              </div>
            </div>

            <p className="text-sm">
              You are about to impersonate this user. While impersonating:
            </p>

            <ul className="text-sm list-disc list-inside space-y-1 ml-2">
              <li>You will see and access everything as this user</li>
              <li>All actions will be performed as this user</li>
              <li>Your session will be logged for audit purposes</li>
              <li>You can stop impersonation at any time</li>
            </ul>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                ⚠️ This action is logged and monitored
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Impersonation sessions are recorded in audit logs for security
                and compliance purposes.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={startImpersonationMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleStartImpersonation}
            disabled={startImpersonationMutation.isPending}
          >
            {startImpersonationMutation.isPending
              ? "Starting..."
              : "Start Impersonation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
