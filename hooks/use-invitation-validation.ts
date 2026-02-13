"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { apiClient } from "@/lib/api-client";

interface InvitationDetails {
  email: string;
  workspace: {
    id: string;
    slug: string;
    title: string;
  };
  role: {
    id: string;
    name: string;
    display_name: string;
  };
  invited_by: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    display_name?: string;
  };
  expires_at: string;
  token: string;
}

interface UseInvitationValidationReturn {
  invitationToken: string | null;
  invitation: InvitationDetails | null;
  isLoading: boolean;
  isValid: boolean;
  error: string | null;
}

/**
 * Hook to validate invitation token from URL
 *
 * Automatically reads `token` or `invitation_token` from URL query params,
 * validates it with the backend via apiClient, and returns invitation details.
 *
 * Usage:
 * ```tsx
 * const { invitationToken, invitation, isValid, isLoading } = useInvitationValidation();
 *
 * if (isValid && invitation) {
 *   // Show invitation banner
 *   // Pre-fill email field
 * }
 * ```
 */
export function useInvitationValidation(): UseInvitationValidationReturn {
  const searchParams = useSearchParams();

  // Check both 'token' and 'invitation_token' params
  const invitationToken =
    searchParams.get("token") || searchParams.get("invitation_token");

  // Validate invitation token with backend via apiClient
  const {
    data: invitationData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invitation-validation", invitationToken],
    queryFn: async () => {
      if (!invitationToken) return null;

      const result = await apiClient.invitations.validate(invitationToken);
      return result.invitation as InvitationDetails;
    },
    enabled: !!invitationToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on failed validation
  });

  // Store token in sessionStorage for persistence across page reloads
  useEffect(() => {
    if (invitationToken) {
      sessionStorage.setItem("pending_invitation_token", invitationToken);
    }
  }, [invitationToken]);

  return {
    invitationToken,
    invitation: invitationData || null,
    isLoading,
    isValid: !!invitationData && !error,
    error: error ? (error as Error).message : null,
  };
}