"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export function ImpersonationBanner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { update } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  // Check impersonation status
  const { data: statusData } = useQuery({
    queryKey: ["impersonation", "status"],
    queryFn: async () => {
      try {
        return await apiClient.impersonation.getStatus();
      } catch (_error) {
        return { is_impersonating: false };
      }
    },
    refetchInterval: 5000, // Check every 5 seconds
  });

  const isImpersonating = statusData?.is_impersonating || false;

  useEffect(() => {
    setIsVisible(isImpersonating);
  }, [isImpersonating]);

  // Stop impersonation mutation
  const stopMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.impersonation.stop();
    },
    onSuccess: async (data) => {
      // Store restored tokens in memory
      const { setTokens } = useAuthStore.getState();
      if (data.access_token && data.refresh_token) {
        setTokens(data.access_token, data.refresh_token);

        // Persist to NextAuth session so tokens survive page reload
        await update({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        });
      }

      // Clear all queries to force refresh with new user context
      queryClient.clear();

      toast.success("Impersonation stopped");

      // Redirect to admin customers page
      router.push("/admin/customers");

      // Force page reload to update user context
      setTimeout(() => {
        window.location.reload();
      }, 100);
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to stop impersonation";
      toast.error(errorMessage);
    },
  });

  if (!isVisible) return null;

  return (
    <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950 mb-4 sticky top-0 z-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-orange-900 dark:text-orange-100">
            Impersonating:
          </span>
          <span className="text-orange-800 dark:text-orange-200">
            {statusData?.impersonated_user_name ||
              statusData?.impersonated_user_email}
          </span>
          <span className="text-xs text-orange-700 dark:text-orange-300">
            ({statusData?.impersonated_user_email})
          </span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => stopMutation.mutate()}
          disabled={stopMutation.isPending}
        >
          <UserX className="h-4 w-4 mr-2" />
          {stopMutation.isPending ? "Stopping..." : "Stop Impersonation"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
