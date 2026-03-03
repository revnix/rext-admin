"use client";

import { motion } from "framer-motion";
import { ArrowRight, Building2, Check, Sparkles, User, X } from "lucide-react";
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
    router.push(`/w/${workspace.slug}` as Route);
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
    <Dialog open={open} onOpenChange={handleClose}>
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
        <div className="p-8 space-y-6">
          {/* Header with Celebration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white text-4xl mb-4 shadow-lg">
              🎉
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Welcome to {workspace.name || "Workspace"}!
              </h2>
              <p className="text-muted-foreground text-lg">
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
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              {/* Inviter */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invited by</p>
                  <p className="font-medium">{inviterName}</p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your role</p>
                  <p className="font-medium text-lg">{roleName}</p>
                </div>
              </div>
            </div>

            {/* Permissions */}
            {permissions.length > 0 && (
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6">
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
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shrink-0">
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
                className="flex-1 gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Take a Quick Tour
              </Button>
            </div>

            {/* Don't show again checkbox */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                id="dont-show-again"
                checked={dontShowAgain}
                onCheckedChange={(checked) =>
                  setDontShowAgain(checked === true)
                }
              />
              <label
                htmlFor="dont-show-again"
                className="cursor-pointer select-none"
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

  const confettiPieces = Array.from({ length: CONFETTI_PIECE_COUNT }, (_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${3 + Math.random() * 2}s`,
  }));

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
