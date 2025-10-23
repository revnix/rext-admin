"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { InvitedUserOnboardingModal } from "@/components/onboarding/invited-user-onboarding-modal";
import { useInvitedUserOnboarding } from "@/hooks/use-invited-user-onboarding";

interface InvitedUserOnboardingProviderProps {
  children: React.ReactNode;
}

/**
 * Provider for invited user onboarding flow
 *
 * Shows specialized onboarding when:
 * - User recently accepted an invitation
 * - User is authenticated
 * - User hasn't completed onboarding yet
 * - Not on excluded pages (login, signup, etc.)
 *
 * This provider is separate from the regular onboarding provider
 * and takes precedence when a user joins via invitation.
 */
export function InvitedUserOnboardingProvider({
  children,
}: InvitedUserOnboardingProviderProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const { shouldShow, isLoading, invitationContext, markAsCompleted } =
    useInvitedUserOnboarding();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show onboarding on certain pages
  const isExcludedPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password") ||
    pathname?.startsWith("/verify-email") ||
    pathname?.startsWith("/invitations/accept") ||
    pathname?.startsWith("/onboarding");

  useEffect(() => {
    // Only show onboarding for authenticated users
    if (status !== "authenticated") {
      setIsOpen(false);
      return undefined;
    }

    // Don't show on excluded pages
    if (isExcludedPage) {
      setIsOpen(false);
      return undefined;
    }

    // Don't show while loading
    if (isLoading) {
      return undefined;
    }

    // Show invited user onboarding if conditions met
    if (shouldShow && invitationContext) {
      // Add a small delay to avoid jarring experience on page load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000); // Slightly longer delay for invited users to see the workspace first

      return () => clearTimeout(timer);
    }

    setIsOpen(false);
    return undefined;
  }, [status, shouldShow, isLoading, isExcludedPage, invitationContext]);

  const handleClose = () => {
    setIsOpen(false);
    markAsCompleted();
  };

  // Don't render anything if no invitation context
  if (!invitationContext) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {!isLoading && (
        <InvitedUserOnboardingModal
          open={isOpen}
          onClose={handleClose}
          workspace={invitationContext.workspace}
          inviterName={invitationContext.inviterName}
          roleName={invitationContext.roleName}
          roleDescription={invitationContext.roleDescription}
        />
      )}
    </>
  );
}
