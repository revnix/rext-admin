"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";

interface InvitationDetails {
  email: string;
  workspace: {
    id: string;
    slug: string;
    name: string;
  };
  role: {
    id: string;
    name: string;
    display_name: string;
  };
  invited_by: {
    id: string;
    full_name: string;
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
      const raw = (result.invitation ?? result) as Record<string, unknown>;
      const asRecord = (value: unknown): Record<string, unknown> =>
        typeof value === "object" && value !== null
          ? (value as Record<string, unknown>)
          : {};
      const asString = (value: unknown, fallback = "") =>
        typeof value === "string" ? value : fallback;

      // Normalize: some backend builds return flat fields
      // (workspace_name, role_name, invited_by_name) rather than the nested
      // objects the UI expects. Coalesce so consumers can rely on the shape.
      const workspace = asRecord(raw.workspace);
      const role = asRecord(raw.role);
      const invitedBy = asRecord(raw.invited_by);
      const normalized: InvitationDetails = {
        email: asString(raw.email),
        token: asString(raw.token, invitationToken),
        expires_at: asString(raw.expires_at),
        workspace: raw.workspace ? {
          id: asString(workspace.id),
          slug: asString(workspace.slug),
          name: asString(workspace.name),
        } : {
          id: asString(raw.workspace_id),
          slug: asString(raw.workspace_slug),
          name: asString(raw.workspace_name),
        },
        role: raw.role ? {
          id: asString(role.id),
          name: asString(role.name),
          display_name: asString(role.display_name),
        } : {
          id: asString(raw.role_id),
          name: asString(raw.role_name),
          display_name: asString(raw.role_display_name, asString(raw.role_name)),
        },
        invited_by: raw.invited_by && typeof raw.invited_by === "object" ? {
          id: asString(invitedBy.id),
          full_name: asString(invitedBy.full_name),
          display_name: asString(invitedBy.display_name) || undefined,
        } : {
          id: asString(raw.invited_by_id),
          full_name: asString(raw.invited_by, asString(raw.invited_by_name)),
          display_name: asString(raw.invited_by_name) || undefined,
        },
      };

      return normalized;
    },
    enabled: !!invitationToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on failed validation
  });

  return {
    invitationToken,
    invitation: invitationData || null,
    isLoading,
    isValid: !!invitationData && !error,
    error: error ? (error as Error).message : null,
  };
}
