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
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useOnboarding } from "@/hooks/use-onboarding";
import { ONBOARDING_STEPS } from "@/types/onboarding";
import { OnboardingProgress } from "./onboarding-progress";
import { OnboardingComplete } from "./steps/onboarding-complete";
import { OnboardingContent } from "./steps/onboarding-content";
import { OnboardingKnowledge } from "./steps/onboarding-knowledge";
import { OnboardingTeam } from "./steps/onboarding-team";
import { OnboardingWelcome } from "./steps/onboarding-welcome";
import { OnboardingWorkspace } from "./steps/onboarding-workspace";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const { status, completeStep, skipStep, goToStep, complete, isLoading } =
    useOnboarding();
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const currentStep = status?.current_step ?? 0;
  const totalSteps = ONBOARDING_STEPS.length;

  const handleNext = async () => {
    setDirection("forward");
    await completeStep(currentStep);
  };

  const handleSkip = async () => {
    setDirection("forward");
    if (ONBOARDING_STEPS[currentStep]?.required) {
      // Can't skip required steps, just go next
      await completeStep(currentStep);
    } else {
      await skipStep(currentStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection("backward");
      goToStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setDirection("backward");
    } else {
      setDirection("forward");
    }
    goToStep(step);
  };

  const handleComplete = async () => {
    await complete();
    onClose();
  };

  const handleDismiss = async () => {
    await complete();
    onClose();
  };

  // Render current step content
  const renderStepContent = () => {
    const stepProps = {
      onNext: handleNext,
      onSkip: handleSkip,
      onBack: handleBack,
      isLoading,
      currentStep,
    };

    switch (currentStep) {
      case 0:
        return <OnboardingWelcome {...stepProps} />;
      case 1:
        return <OnboardingWorkspace {...stepProps} />;
      case 2:
        return <OnboardingTeam {...stepProps} />;
      case 3:
        return <OnboardingKnowledge {...stepProps} />;
      case 4:
        return <OnboardingContent {...stepProps} />;
      case 5:
        return <OnboardingComplete onComplete={handleComplete} />;
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        {/* Accessible title and description for screen readers */}
        <VisuallyHidden>
          <DialogTitle>Get Started with WREXT - Onboarding</DialogTitle>
          <DialogDescription>
            Complete the onboarding steps to set up your workspace and start
            creating content with WREXT.
          </DialogDescription>
        </VisuallyHidden>

        {/* Header with progress */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Get Started with WREXT</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <OnboardingProgress
            currentStep={currentStep}
            totalSteps={totalSteps}
            completedSteps={status?.completed_steps ?? []}
            skippedSteps={status?.skipped_steps ?? []}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Animated step content */}
        <div className="relative overflow-hidden">
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
