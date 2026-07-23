"use client";

import { ChevronLeft, ChevronRight, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WizardNavigationProps {
  /** Current step index */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether can navigate to next step */
  canGoNext: boolean;
  /** Whether can navigate to previous step */
  canGoBack: boolean;
  /** Whether can submit form */
  canSubmit: boolean;
  /** Whether operations are loading */
  isLoading: boolean;
  /** Navigation handlers */
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Wizard Navigation Component
 *
 * Simple navigation controls for the content creation wizard.
 */
export function WizardNavigation({
  currentStep,
  totalSteps,
  canGoNext,
  canGoBack,
  canSubmit,
  isLoading,
  onNext,
  onBack,
  onSubmit,
  onCancel,
}: WizardNavigationProps) {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="p-6 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between">
        {/* Left side - Back button */}
        <div className="flex items-center gap-2">
          {canGoBack ? (
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div /> // Placeholder to maintain spacing
          )}
        </div>

        {/* Center - Step counter */}
        <div className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {totalSteps}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-3">
          {/* Cancel button */}
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>

          {/* Next/Submit button */}
          {isLastStep ? (
            <Button
              onClick={onSubmit}
              disabled={!canSubmit || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isLoading ? "Creating..." : "Create Content"}
            </Button>
          ) : (
            <Button onClick={onNext} disabled={!canGoNext || isLoading}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
