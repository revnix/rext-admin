"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type {
  DeclineInvitationRequest,
  DeclineInvitationResponse,
  PendingInvitationsResponse,
} from "@/types/invitation";

interface UsePendingInvitationsReturn {
  invitations: PendingInvitationsResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  acceptInvitation: (token: string) => Promise<void>;
  declineInvitation: (invitationId: string, reason?: string) => Promise<void>;
  isAccepting: boolean;
  isDeclining: boolean;
}

/**
 * Hook to fetch and manage pending invitations for current user
 *
 * Features:
 * - Fetches pending invitations from API
 * - Provides accept/decline mutation functions
 * - Auto-refetches after accept/decline
 * - Only fetches when user is authenticated
 *
 * Usage:
 * ```tsx
 * const { invitations, isLoading, acceptInvitation, declineInvitation } = usePendingInvitations();
 *
 * // Display invitations
 * if (invitations && invitations.count > 0) {
 *   // Render invitation cards
 * }
 *
 * // Accept invitation
 * await acceptInvitation(invitation.token);
 *
 * // Decline invitation
 * await declineInvitation(invitation.id, "Not interested");
 * ```
 */
export function usePendingInvitations(): UsePendingInvitationsReturn {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Fetch pending invitations
  const {
    data: invitationsData,
    isLoading,
    error,
    refetch,
  } = useQuery<PendingInvitationsResponse>({
    queryKey: ["pending-invitations"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/invitations/pending`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            errorData.detail ||
            "Failed to fetch pending invitations",
        );
      }

      const result = await response.json();
      return result.data as PendingInvitationsResponse;
    },
    enabled: !!session?.user?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });

  // Accept invitation mutation
  const { mutateAsync: acceptInvitation, isPending: isAccepting } = useMutation(
    {
      mutationFn: async (token: string) => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/invitations/${token}/accept`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.user?.accessToken}`,
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              errorData.detail ||
              "Failed to accept invitation",
          );
        }

        return response.json();
      },
      onSuccess: () => {
        // Invalidate and refetch pending invitations
        queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
        // Also invalidate workspaces list since user now has a new workspace
        queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      },
    },
  );

  // Decline invitation mutation
  const { mutateAsync: declineInvitation, isPending: isDeclining } =
    useMutation({
      mutationFn: async (params: { invitationId: string; reason?: string }) => {
        const body: DeclineInvitationRequest = params.reason
          ? { reason: params.reason }
          : {};

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/invitations/${params.invitationId}/decline`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.user?.accessToken}`,
            },
            body: JSON.stringify(body),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              errorData.detail ||
              "Failed to decline invitation",
          );
        }

        const result = await response.json();
        return result.data as DeclineInvitationResponse;
      },
      onSuccess: () => {
        // Invalidate and refetch pending invitations
        queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
      },
    });

  // Wrapper functions for cleaner API
  const handleAcceptInvitation = async (token: string) => {
    await acceptInvitation(token);
  };

  const handleDeclineInvitation = async (
    invitationId: string,
    reason?: string,
  ) => {
    await declineInvitation({ invitationId, reason });
  };

  return {
    invitations: invitationsData || null,
    isLoading,
    error: error as Error | null,
    refetch,
    acceptInvitation: handleAcceptInvitation,
    declineInvitation: handleDeclineInvitation,
    isAccepting,
    isDeclining,
  };
}
