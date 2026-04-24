"use client";

import { motion } from "framer-motion";
import { ArrowRight, Building2, Check, User, UserCog, X } from "lucide-react";
import { detectRoleCategory } from "@/lib/role-categories";
import { local } from "@/lib/storage";
import { ONBOARDING_STORAGE_KEYS } from "@/lib/storage-keys";
import { useReducedMotion } from "@/lib/animations";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import type { Workspace } from "@/types/workspace";
import type { Route } from "next";

/** Number of CSS confetti particles to render. Set to 0 for reduced-motion users. */
const CONFETTI_PIECE_COUNT = 50;

interface WorkspaceWelcomeModalProps {
  open: boolean;
  onClose: () => void;
  workspace: Workspace;
  inviterName: string;
  roleName: string;
  rolePermissions?: string[];
  onStartTour?: () => void;
}

/**
 * Welcome modal shown after accepting workspace invitation
 *
 * Features:
 * - Celebration UI with animations
 * - Workspace and role information
 * - Quick permission summary
 * - Options to start exploring or take tour
 * - "Don't show again" checkbox
 *
 * Shown immediately after invitation acceptance, before
 * the invited user onboarding (if enabled).
 */
export function WorkspaceWelcomeModal({
  open,
  onClose,
  workspace,
  inviterName,
  roleName,
  rolePermissions = [],
  onStartTour,
}: WorkspaceWelcomeModalProps) {
  const router = useRouter();
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  // Default permissions based on role if not provided
  const permissions =
    rolePermissions.length > 0
      ? rolePermissions
      : getDefaultPermissions(roleName);

  // Trigger confetti animation on mount
  useEffect(() => {
    if (open && !prefersReducedMotion) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, prefersReducedMotion]);

  const handleClose = () => {
    if (dontShowAgain) {
      // Store preference to not show again for this workspace
      local.setBoolean(
        ONBOARDING_STORAGE_KEYS.welcomeShown(workspace.id),
        true,
      );
    }
    onClose();
  };

  const handleStartExploring = () => {
    handleClose();
    router.push(`/w/${workspace.slug}/generate_content` as Route);
  };

  const handleTakeTour = () => {
    handleClose();
    if (onStartTour) {
      onStartTour();
    } else {
      // Fallback: trigger invited user onboarding if available
      router.push(`/w/${workspace.slug}?tour=true` as Route);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent
        className="!max-w-2xl w-[95vw] p-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Accessible title and description */}
        <VisuallyHidden>
          <DialogTitle>Welcome to {workspace.name || "Workspace"}</DialogTitle>
          <DialogDescription>
            You've successfully joined {workspace.name || "Workspace"} as{" "}
            {roleName}
          </DialogDescription>
        </VisuallyHidden>

        {/* Confetti Background Animation */}
        {isAnimating && <ConfettiEffect />}

        {/* Close button */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-5 sm:space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="text-center space-y-2"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Welcome to {workspace.name || "Workspace"}!
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                You've successfully joined the workspace
              </p>
            </div>
          </motion.div>

          {/* Workspace and Role Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="rounded-lg border border-border/70 bg-muted/40 dark:bg-muted/20 p-5 sm:p-6 space-y-4">
              {/* Inviter */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/20 dark:bg-primary/20 dark:border-primary/30">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invited by</p>
                  <p className="font-medium">{inviterName}</p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/20 dark:bg-primary/20 dark:border-primary/30">
                  <UserCog className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your role</p>
                  <p className="font-medium text-lg">{roleName}</p>
                </div>
              </div>
            </div>

            {/* Permissions */}
            {permissions.length > 0 && (
              <div className="rounded-lg border border-primary/15 bg-primary/5 dark:bg-primary/10 p-5 sm:p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  As {roleName}, you can:
                </h3>
                <ul className="space-y-2">
                  {permissions.map((permission, index) => (
                    <motion.li
                      key={permission}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/25 dark:bg-primary/20 dark:border-primary/30 shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{permission}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleStartExploring}
                size="lg"
                className="flex-1 gap-2"
              >
                Start Exploring
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleTakeTour}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Take a Quick Tour
              </Button>
            </div>

            {/* Don't show again checkbox */}
            <div className="flex items-start justify-start gap-2 text-sm text-muted-foreground pt-1">
              <Checkbox
                id="dont-show-again"
                checked={dontShowAgain}
                onCheckedChange={(checked) =>
                  setDontShowAgain(checked === true)
                }
                className="mt-0.5"
              />
              <label
                htmlFor="dont-show-again"
                className="cursor-pointer select-none leading-relaxed text-left"
              >
                Don't show this again for this workspace
              </label>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Confetti effect using CSS animations
 * Creates floating particles across the screen
 * Renders nothing if the user prefers reduced motion
 */
function ConfettiEffect() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return null;
  }

  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
  ];

  const confettiPieces = Array.from(
    { length: CONFETTI_PIECE_COUNT },
    (_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${3 + Math.random() * 2}s`,
    }),
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className={`absolute w-2 h-2 ${piece.color} rounded-full animate-confetti-fall`}
          style={{
            left: piece.left,
            top: "-10px",
            animationDelay: piece.animationDelay,
            animationDuration: piece.animationDuration,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Get default permissions display based on role name
 */
function getDefaultPermissions(roleName: string): string[] {
  const category = detectRoleCategory(roleName);

  switch (category) {
    case "owner":
      return [
        "Manage all workspace content and settings",
        "Invite and manage team members",
        "Configure workspace billing and subscription",
        "Full administrative control",
      ];
    case "admin":
      return [
        "Create, edit, and delete all content",
        "Manage team members and roles",
        "Configure workspace settings",
        "No billing access (owner only)",
      ];
    case "editor":
      return [
        "Create and edit content",
        "Manage topics and knowledge base",
        "Collaborate with team members",
        "No team management access",
      ];

    default:
      return [
        "View all workspace content",
        "Browse knowledge base",
        "See team member profiles",
        "Read-only access",
      ];
  }
}

/**
 * Check if welcome modal should be shown for this workspace
 */
export function shouldShowWelcomeModal(workspaceId: string): boolean {
  return !local.getBoolean(ONBOARDING_STORAGE_KEYS.welcomeShown(workspaceId));
}

/**
 * Mark welcome modal as shown for a workspace
 */
export function markWelcomeModalShown(workspaceId: string): void {
  local.setBoolean(ONBOARDING_STORAGE_KEYS.welcomeShown(workspaceId), true);
}
