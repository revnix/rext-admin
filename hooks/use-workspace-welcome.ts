"use client";

import { useEffect, useState } from "react";
import {
  markWelcomeModalShown,
  shouldShowWelcomeModal,
} from "@/components/workspace";
import type { Workspace } from "@/types/workspace";
import { MODAL_DELAYS } from "@/lib/constants/motion";
interface WelcomeModalState {
  workspace: Workspace;
  inviterName: string;
  roleName: string;
  rolePermissions?: string[];
}

interface UseWorkspaceWelcomeReturn {
  shouldShow: boolean;
  welcomeData: WelcomeModalState | null;
  showWelcome: (data: WelcomeModalState) => void;
  hideWelcome: () => void;
  markAsShown: () => void;
}

/**
 * Hook to manage workspace welcome modal state
 *
 * Used to show a celebration modal when a user accepts
 * a workspace invitation. Can be triggered manually or
 * automatically after invitation acceptance.
 *
 * The modal will only show once per workspace (tracked in localStorage).
 */
export function useWorkspaceWelcome(): UseWorkspaceWelcomeReturn {
  const [shouldShow, setShouldShow] = useState(false);
  const [welcomeData, setWelcomeData] = useState<WelcomeModalState | null>(
    null,
  );

  // Check if welcome modal was already shown for current workspace
  useEffect(() => {
    if (welcomeData?.workspace?.id) {
      const alreadyShown = !shouldShowWelcomeModal(welcomeData.workspace.id);
      if (alreadyShown) {
        setShouldShow(false);
      }
    }
  }, [welcomeData?.workspace?.id]);

  const showWelcome = (data: WelcomeModalState) => {
    setWelcomeData(data);
    setShouldShow(true);
  };

  const hideWelcome = () => {
    setShouldShow(false);
  };

  const markAsShown = () => {
    if (welcomeData?.workspace?.id) {
      markWelcomeModalShown(welcomeData.workspace.id);
    }
    hideWelcome();
    // Clear welcome data after a delay to allow animation to complete
    setTimeout(() => {
      setWelcomeData(null);
    }, MODAL_DELAYS.ANIMATION_CLEANUP);
  };

  return {
    shouldShow,
    welcomeData,
    showWelcome,
    hideWelcome,
    markAsShown,
  };
}

/**
 * Helper function to prepare welcome data after invitation acceptance
 * Extracts necessary fields from invitation acceptance response
 */
export function prepareWelcomeData(params: {
  workspace: Workspace;
  inviterName: string;
  roleName: string;
  rolePermissions?: string[];
}): WelcomeModalState {
  return {
    workspace: params.workspace,
    inviterName: params.inviterName,
    roleName: params.roleName,
    rolePermissions: params.rolePermissions,
  };
}
