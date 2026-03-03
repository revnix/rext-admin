"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { safeJsonParse } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace";
import type { Workspace } from "@/types/workspace";

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
  const invitationToken =
    typeof window !== "undefined"
      ? localStorage.getItem("recent_invitation_acceptance")
      : null;

  // Parse invitation context from localStorage.
  // staleTime: Infinity — this data is set once during invitation acceptance and
  // does not change server-side. It should never trigger a background refetch.
  // gcTime: Infinity — prevent garbage collection if the user navigates away
  // from onboarding components temporarily. The data should remain cached for
  // the entire session since it's only cleared on explicit completion.
  // Note: This is a localStorage parse, not a network request. The queryFn
  // returns null if the token is missing or unparseable.
  const { data: invitationData, isLoading: isLoadingInvitation } = useQuery({
    queryKey: ["invitation-context", invitationToken],
    queryFn: async () => {
      if (!invitationToken) return null;

      // Parse the stored invitation context
      return safeJsonParse<InvitationContext>(invitationToken);
    },
    enabled: !!invitationToken && status === "authenticated",
    staleTime: Infinity,
    gcTime: Infinity,
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
    if (typeof window !== "undefined") {
      localStorage.removeItem("recent_invitation_acceptance");
    }
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
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "recent_invitation_acceptance",
      JSON.stringify(context),
    );
  }
}

/**
 * Helper function to check if user recently accepted an invitation
 * Can be used to determine onboarding flow
 */
export function hasRecentInvitationAcceptance(): boolean {
  if (typeof window !== "undefined") {
    return !!localStorage.getItem("recent_invitation_acceptance");
  }
  return false;
}
