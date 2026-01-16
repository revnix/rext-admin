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
import { OnboardingComplete } from "./steps/onboarding-complete";
import { OnboardingMarketingQuestions } from "./steps/onboarding-marketing-questions";
import { OnboardingStrategy } from "./steps/onboarding-strategy";
import { OnboardingWorkspace } from "./steps/onboarding-workspace";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const { status, completeStep, complete, isLoading } = useOnboarding();
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [selectedStrategy, setSelectedStrategy] = useState<
    "analyze" | "manual" | null
  >(null);

  const currentStep = status?.current_step ?? 0;

  const handleNext = async () => {
    setDirection("forward");
    await completeStep(currentStep);
  };

  const handleBack = () => {
    setDirection("backward");
    // For now, we don't have backward navigation in the API
    // Could be implemented if needed
  };

  const handleComplete = async () => {
    await complete();
    onClose();
  };

  const handleClose = async () => {
    // Mark onboarding as completed when user closes
    await complete();
    onClose();
  };

  const handleStrategySelection = async (strategy: "analyze" | "manual") => {
    setSelectedStrategy(strategy);
    setDirection("forward");
    await completeStep(currentStep);
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Step 1: Strategy Selection
        return (
          <OnboardingStrategy
            onNext={handleStrategySelection}
            isLoading={isLoading}
          />
        );
      case 1:
        // Step 2: If "Analyze Website" was selected, show workspace form
        // Otherwise skip to marketing questions
        if (selectedStrategy === "analyze") {
          return (
            <OnboardingWorkspace
              onNext={handleNext}
              onBack={handleBack}
              isLoading={isLoading}
              currentStep={currentStep}
            />
          );
        }
        // For "Manual Persona", go directly to marketing questions
        return (
          <OnboardingMarketingQuestions
            onNext={handleNext}
            isLoading={isLoading}
          />
        );
      case 2:
        // Step 3 (or final): Complete
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="!max-w-4xl w-[95vw] max-h-[85vh] flex flex-col p-0"
        showCloseButton={false}
      >
        {/* Accessible title and description for screen readers */}
        <VisuallyHidden>
          <DialogTitle>Get Started with WREXT</DialogTitle>
          <DialogDescription>
            Complete the onboarding steps to set up your account.
          </DialogDescription>
        </VisuallyHidden>

        {/* Header with close button */}
        <div className="border-b p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Get Started</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
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
