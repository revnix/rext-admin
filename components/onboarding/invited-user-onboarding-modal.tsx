"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import type { Workspace } from "@/types/workspace";
import { InvitedUserFirstTasks } from "./steps/invited-user-first-tasks";
import {
  getRolePermissions,
  InvitedUserPermissions,
} from "./steps/invited-user-permissions";
import { InvitedUserQuickTour } from "./steps/invited-user-quick-tour";
import { InvitedUserWelcome } from "./steps/invited-user-welcome";

interface InvitedUserOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  workspace: Workspace;
  inviterName: string;
  roleName: string;
  roleDescription?: string;
}

const STEPS = [
  { id: 0, name: "welcome" },
  { id: 1, name: "permissions" },
  { id: 2, name: "tour" },
  { id: 3, name: "tasks" },
];

/**
 * Specialized onboarding modal for invited users
 *
 * Provides a streamlined onboarding experience focused on:
 * - Welcome to the workspace
 * - Understanding their role and permissions
 * - Quick tour of relevant features
 * - Suggested first actions
 *
 * Skips marketing questions and workspace creation steps
 * that organic users see.
 */
export function InvitedUserOnboardingModal({
  open,
  onClose,
  workspace,
  inviterName,
  roleName,
  roleDescription,
}: InvitedUserOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    setDirection("forward");
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    // Skip directly to completion
    handleComplete();
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Mark onboarding as completed
      // This will be handled by the parent component
      await new Promise((resolve) => setTimeout(resolve, 500));
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // When user closes manually, mark as completed anyway
    handleComplete();
  };

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

  // Get role permissions for display
  const rolePermissions = getRolePermissions(roleName);

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <InvitedUserWelcome
            workspace={workspace}
            inviterName={inviterName}
            roleName={roleName}
            roleDescription={roleDescription}
            onNext={handleNext}
            onSkip={handleSkip}
            isLoading={isLoading}
          />
        );
      case 1:
        return (
          <InvitedUserPermissions
            roleName={roleName}
            permissions={rolePermissions}
            onNext={handleNext}
            onSkip={handleSkip}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <InvitedUserQuickTour
            roleName={roleName}
            onNext={handleNext}
            onSkip={handleSkip}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <InvitedUserFirstTasks
            workspaceSlug={workspace.slug}
            roleName={roleName}
            onComplete={handleComplete}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  const variants = {
    enter: (direction: "forward" | "backward") => ({
      x: direction === "forward" ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: "forward" | "backward") => ({
      x: direction === "forward" ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="!max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0"
        showCloseButton={false}
      >
        {/* Accessible title and description for screen readers */}
        <VisuallyHidden>
          <DialogTitle>Welcome to {workspace.name || "Workspace"}</DialogTitle>
          <DialogDescription>
            Get started with your new workspace as a {roleName}.
          </DialogDescription>
        </VisuallyHidden>

        {/* Header with progress and close button */}
        <div className="border-b p-6 flex-shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Welcome to {workspace.name || "Workspace"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Step {currentStep + 1} of {STEPS.length}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Animated step content with overflow scroll */}
        <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="p-6"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
