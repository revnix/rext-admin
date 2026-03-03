"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { local } from "@/lib/storage";
import { ONBOARDING_STORAGE_KEYS } from "@/lib/storage-keys";
import { useWorkspaceStore } from "@/stores/workspace";
import type { Workspace } from "@/types/workspace";
import { safeJsonParse } from "@/lib/utils";

interface InvitationContext {
  workspace: Workspace;
  inviterName: string;
  roleName: string;
  roleDescription?: string;
  acceptedAt: string;
}

interface UseInvitedUserOnboardingReturn {
  shouldShow: boolean;
  isLoading: boolean;
  invitationContext: InvitationContext | null;
  markAsCompleted: () => void;
}

/**
 * Hook to manage invited user onboarding flow
 *
 * Detects if user joined via invitation and shows specialized onboarding
 * Tracks if they've completed the onboarding to avoid showing it again
 */
export function useInvitedUserOnboarding(): UseInvitedUserOnboardingReturn {
  const { status } = useSession();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check if user was invited (via localStorage flag set during invitation acceptance)
  const invitationToken = local.getString(
    ONBOARDING_STORAGE_KEYS.recentInvitationAcceptance,
  );

  // Fetch workspace invitations to get context
  const { data: invitationData, isLoading: isLoadingInvitation } = useQuery({
    queryKey: ["invitation-context", invitationToken],
    queryFn: async () => {
      if (!invitationToken) return null;

      // Parse the stored invitation context
      return safeJsonParse<InvitationContext>(invitationToken);
    },
    enabled: !!invitationToken && status === "authenticated",
    staleTime: Infinity, // Context doesn't change
  });

  // Check if regular onboarding is already completed
  // Only needed when an invitation context exists — avoids unnecessary requests
  // for users with no active invitation flow
  const { data: onboardingStatus, isLoading: isLoadingOnboarding } = useQuery({
    queryKey: ["onboarding", "status"],
    queryFn: () => apiClient.onboarding.getStatus(),
    enabled: !!invitationToken && status === "authenticated",
    staleTime: 1000 * 60 * 5,
  });

  // Determine if we should show invited user onboarding
  const shouldShow =
    !!invitationData &&
    !hasCompletedOnboarding &&
    !onboardingStatus?.completed &&
    !!currentWorkspace &&
    currentWorkspace.id === invitationData.workspace.id;

  const markAsCompleted = useCallback(() => {
    setHasCompletedOnboarding(true);
    // Clear the invitation flag from localStorage
    local.remove(ONBOARDING_STORAGE_KEYS.recentInvitationAcceptance);
  }, []);

  // Auto-clear if user navigates away from the workspace they were invited to
  useEffect(() => {
    if (
      invitationData &&
      currentWorkspace &&
      currentWorkspace.id !== invitationData.workspace.id
    ) {
      markAsCompleted();
    }
  }, [currentWorkspace, invitationData, markAsCompleted]);

  return {
    shouldShow,
    isLoading: isLoadingInvitation || isLoadingOnboarding,
    invitationContext: invitationData || null,
    markAsCompleted,
  };
}

/**
 * Helper function to store invitation context after acceptance
 * Should be called after successful invitation acceptance
 */
export function storeInvitationContext(context: InvitationContext): void {
  local.setJSON(ONBOARDING_STORAGE_KEYS.recentInvitationAcceptance, context);
}

/**
 * Helper function to check if user recently accepted an invitation
 * Can be used to determine onboarding flow
 */
export function hasRecentInvitationAcceptance(): boolean {
  return (
    local.getString(ONBOARDING_STORAGE_KEYS.recentInvitationAcceptance) !== null
  );
}
