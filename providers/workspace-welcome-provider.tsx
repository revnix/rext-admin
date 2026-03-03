"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { WorkspaceWelcomeModal } from "@/components/workspace";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useWorkspaceStore } from "@/stores/workspace";
import { safeJsonParse } from "@/lib/utils";
import { MODAL_DELAYS } from "@/lib/constants/motion";
interface WorkspaceWelcomeProviderProps {
  children: React.ReactNode;
}

interface WelcomeData {
  workspace: {
    id: string;
    title: string;
    name: string;
    slug: string;
    url: string;
    created_at: string;
  };
  inviterName: string;
  roleName: string;
  rolePermissions?: string[];
}

/**
 * Provider for workspace welcome modal
 *
 * Shows a celebration modal when user first visits a workspace
 * after accepting an invitation.  This appears BEFORE the invited
 * user onboarding, providing immediate positive feedback.
 *
 * The welcome data is stored in sessionStorage by the invitation
 * acceptance flow and consumed here.
 */
export function WorkspaceWelcomeProvider({
  children,
}: WorkspaceWelcomeProviderProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const [isOpen, setIsOpen] = useState(false);
  const [welcomeData, setWelcomeData] = useState<WelcomeData | null>(null);

  useEffect(() => {
    // Only check for welcome data when authenticated
    if (status !== "authenticated") {
      return undefined;
    }

    // Check if we're on a workspace page
    const isWorkspacePage = pathname?.startsWith("/w/");
    if (!isWorkspacePage || !currentWorkspace) {
      return undefined;
    }

    // Check for welcome modal data in sessionStorage
    const welcomeKey = `workspace_welcome_${currentWorkspace.id}`;
    const storedData = sessionStorage.getItem(welcomeKey);

    if (storedData) {
      const data = safeJsonParse<WelcomeData>(storedData);
      if (data) {
        setWelcomeData(data);

        // Small delay to let the page load
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, MODAL_DELAYS.INVITED_USER);

        // Clear from sessionStorage so it only shows once
        sessionStorage.removeItem(welcomeKey);

        return () => clearTimeout(timer);
      } else {
        // Invalid data, ignore
        sessionStorage.removeItem(welcomeKey);
      }
    }
    return undefined;
  }, [status, pathname, currentWorkspace]);

  const handleClose = () => {
    setIsOpen(false);
    setWelcomeData(null);
  };

  const handleStartTour = () => {
    handleClose();
    // The invited user onboarding provider will pick this up
    // No additional action needed as it's already set to show
  };

  if (!welcomeData) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <ErrorBoundary
        resetKeys={[
          isOpen ? "open" : "closed",
          welcomeData.workspace.id,
          welcomeData.roleName,
        ]}
      >
        <WorkspaceWelcomeModal
          open={isOpen}
          onClose={handleClose}
          workspace={welcomeData.workspace}
          inviterName={welcomeData.inviterName}
          roleName={welcomeData.roleName}
          rolePermissions={welcomeData.rolePermissions}
          onStartTour={handleStartTour}
        />
      </ErrorBoundary>
    </>
  );
}

/**
 * Helper function to store welcome data for display
 * Should be called after successful invitation acceptance
 */
export function storeWelcomeData(data: {
  workspace: {
    id: string;
    title?: string;
    name?: string;
    slug: string;
  };
  inviterName: string;
  roleName: string;
  rolePermissions?: string[];
}): void {
  if (typeof window !== "undefined") {
    const welcomeKey = `workspace_welcome_${data.workspace.id}`;
    sessionStorage.setItem(welcomeKey, JSON.stringify(data));
  }
}
