"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type {
  DeclineInvitationResponse,
  PendingInvitationsResponse,
} from "@/types/invitation";
import { apiClient } from "@/lib/api-client";

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
 * - Fetches pending invitations from API via apiClient
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

  // Fetch pending invitations via apiClient
  const {
    data: invitationsData,
    isLoading,
    error,
    refetch,
  } = useQuery<PendingInvitationsResponse>({
    queryKey: ["pending-invitations"],
    queryFn: () => apiClient.invitations.pending() as Promise<PendingInvitationsResponse>,
    enabled: !!session?.user?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });

  // Accept invitation mutation via apiClient
  const { mutateAsync: acceptInvitation, isPending: isAccepting } = useMutation(
    {
      mutationFn: async (token: string) => {
        return apiClient.invitations.accept(token);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
        queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      },
    },
  );

  // Decline invitation mutation via apiClient
  const { mutateAsync: declineInvitation, isPending: isDeclining } =
    useMutation({
      mutationFn: async (params: { invitationId: string; reason?: string }) => {
        return apiClient.invitations.decline(params.invitationId, params.reason) as Promise<DeclineInvitationResponse>;
      },
      onSuccess: () => {
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