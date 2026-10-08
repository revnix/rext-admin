"use client";

import { motion } from "motion/react";
import { ArrowRight, Building2, Check, User, UserCog, X } from "lucide-react";
import { detectRoleCategory } from "@/lib/role-categories";
import { local } from "@/lib/storage";
import { ONBOARDING_STORAGE_KEYS } from "@/lib/storage-keys";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { workspaceRoutes } from "@/lib/routes";

interface WorkspaceWelcomeModalProps {
  open: boolean;
  onClose: () => void;
  workspace: Workspace;
  inviterName: string;
  roleName: string;
  rolePermissions?: string[];
}

/**
 * Welcome modal shown after accepting workspace invitation
 *
 * Features:
 * - Celebration UI with animations
 * - Workspace and role information
 * - Quick permission summary
 * - A button to start exploring
 * - "Don't show again" checkbox
 *
 * Shown right after an invitation is accepted.
 */
export function WorkspaceWelcomeModal({
  open,
  onClose,
  workspace,
  inviterName,
  roleName,
  rolePermissions = [],
}: WorkspaceWelcomeModalProps) {
  const router = useRouter();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Default permissions based on role if not provided
  const permissions =
    rolePermissions.length > 0
      ? rolePermissions
      : getDefaultPermissions(roleName);

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
    router.push(workspaceRoutes.generate_content(workspace.slug) as Route);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent
        className="!max-w-2xl w-[95vw] p-0"
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

        {/* Close button */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            data-rec="show"
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
            <div className="rounded-md border border-border/70 bg-muted/40 p-5 sm:p-6 space-y-4">
              {/* Inviter */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground border border-border">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invited by</p>
                  <p className="font-medium">{inviterName}</p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground border border-border">
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
              <div className="rounded-md border border-border bg-surface-inset p-5 sm:p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-foreground" />
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
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-foreground border border-border shrink-0">
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
                data-rec="show"
                onClick={handleStartExploring}
                size="lg"
                className="flex-1 gap-2"
              >
                Start Exploring
                <ArrowRight className="h-4 w-4" />
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
                data-rec="show"
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
        "Collaborate with team members",
        "No team management access",
      ];

    default:
      return [
        "View all workspace content",
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
