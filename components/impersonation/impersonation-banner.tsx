"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { impersonationQueries } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { log } from "@/lib/logger";
import type { Route } from "next";
import {
  AUTH_SESSION_TOKEN_SWAP_ACTION,
  clearAuthHeadersCache,
} from "@/lib/auth-utils";

/**
 * Impersonation Banner Component
 *
 * Displays at the top of the page when an admin is impersonating another user.
 * Shows who is being impersonated and provides a button to stop impersonation.
 */
export function ImpersonationBanner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { update } = useSession();

  const { clearTokens } = useAuthStore();
  const [isPendingRoute, startTransition] = useTransition();

  // Check impersonation status
  const {
    data: status,
    isLoading,
    isError,
  } = useQuery({
    ...impersonationQueries.status(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Consider stale after 20 seconds
    retry: false, // Don't retry if endpoint doesn't exist (404)
    // Gracefully handle errors (endpoint not implemented yet)
    throwOnError: false,
  });

  // Stop impersonation mutation
  const stopImpersonationMutation = useMutation({
    mutationFn: () => apiClient.impersonation.stop(),
    onSuccess: async (data) => {
      // Update NextAuth session with restored tokens
      await update({
        authAction: AUTH_SESSION_TOKEN_SWAP_ACTION,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      // The Zustand store is only an impersonation override. Keeping the
      // restored token there would bypass future NextAuth refreshes forever.
      clearTokens();
      // Purge the auth headers cache so getAuthHeaders() doesn't return the
      // now-invalidated impersonation token on the next API call.
      clearAuthHeadersCache();

      // Fetch and update original user profile
      try {
        const profile = await apiClient.profile.get();
        await update({
          user: {
            id: profile.id,
            email: profile.email,
            name: profile.full_name || profile.display_name,
            image: profile.avatar_url,
          },
        });
      } catch (error) {
        log.error(
          "Failed to fetch original profile during impersonation stop",
          error,
        );
      }

      // setTokens() above only exists to bridge the moment between this
      // mutation resolving and the update() calls landing in React state —
      // the NextAuth session is authoritative again now and must own the
      // refresh lifecycle from here on. getAuthHeaders() (lib/auth-utils.ts)
      // prefers this store over the session UNCONDITIONALLY whenever it's
      // populated, with no expiry check of its own — leaving it populated
      // after stopping impersonation would silently shadow the session with
      // a token pair that never refreshes again. The next time that frozen
      // access token expired, every request would 401, the retry would keep
      // reading the same stale store token instead of the freshly-refreshed
      // session one, and the (non-retryable) second 401 would force a full
      // logout — even though the real session was still perfectly valid.
      clearTokens();

      toast.success("Impersonation stopped", {
        description: "You have returned to your original account",
      });

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();

      startTransition(() => {
        router.push("/admin/users" as Route);
        // Refresh the page to update UI
        router.refresh();
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to stop impersonation: ${error.message}`);
    },
  });

  const handleStopImpersonation = () => {
    stopImpersonationMutation.mutate();
  };

  // Don't show anything if loading, error (endpoint not implemented), or not impersonating
  if (isLoading || isError || !status?.is_impersonating) {
    return null;
  }

  return (
    <div className="w-full border-b border-amber-600 dark:border-amber-500 bg-amber-200 dark:bg-amber-950/20 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6 min-w-0">
            <span className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 shrink-0">
              Impersonating User
            </span>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <User className="h-4 w-4 text-yellow-700 dark:text-yellow-300 shrink-0" />
                <span className="font-medium text-yellow-900 dark:text-yellow-100 truncate">
                  {status.impersonated_user_name ||
                    status.impersonated_user_email}
                </span>
                {status.impersonated_user_name && (
                  <span className="text-yellow-700 dark:text-yellow-300 truncate">
                    ({status.impersonated_user_email})
                  </span>
                )}
              </div>

              {status.started_at && (
                <span className="text-yellow-700 dark:text-yellow-300 shrink-0">
                  Since {new Date(status.started_at).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleStopImpersonation}
          disabled={stopImpersonationMutation.isPending || isPendingRoute}
          className="w-full sm:w-auto shrink-0 border-yellow-600 bg-yellow-100 hover:bg-yellow-100 dark:border-yellow-500 dark:hover:bg-yellow-900/30"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {stopImpersonationMutation.isPending || isPendingRoute
            ? "Stopping..."
            : "Stop Impersonation"}
        </Button>
      </div>
    </div>
  );
}
