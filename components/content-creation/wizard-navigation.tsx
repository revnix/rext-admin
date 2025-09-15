"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  MoreHorizontal,
  Save,
  Send,
  SkipForward,
  Target,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { WIZARD_STEPS } from "@/lib/content-creation/wizard-config";
import { cn } from "@/lib/utils";

interface EnhancedWizardNavigationProps {
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
  onSaveDraft: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  /** Enhanced navigation features */
  canSkipStep?: boolean;
  onSkipStep?: () => void;
  onGoToFirstError?: () => void;
  onGoToFirstIncomplete?: () => void;
  /** Navigation hints */
  nextStepHint?: string;
  previousStepHint?: string;
  completionHint?: string;
  /** Validation states */
  hasErrors?: boolean;
  hasWarnings?: boolean;
  errorCount?: number;
  warningCount?: number;
  /** Draft state */
  isDraftSaving?: boolean;
  lastDraftSaved?: Date;
  /** Keyboard shortcuts enabled */
  enableKeyboardShortcuts?: boolean;
  /** Compact mode */
  compact?: boolean;
}

/**
 * Enhanced Wizard Navigation Component
 *
 * Advanced navigation controls with keyboard shortcuts, smart navigation,
 * validation feedback, and accessibility features.
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
  onSaveDraft,
  onSubmit,
  onCancel,
  canSkipStep = false,
  onSkipStep,
  onGoToFirstError,
  onGoToFirstIncomplete,
  nextStepHint,
  previousStepHint,
  completionHint,
  hasErrors = false,
  hasWarnings = false,
  errorCount = 0,
  warningCount = 0,
  isDraftSaving = false,
  lastDraftSaved,
  enableKeyboardShortcuts = true,
  compact = false,
}: EnhancedWizardNavigationProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const isLastStep = currentStep === totalSteps - 1;
  const currentStepConfig = WIZARD_STEPS[currentStep];

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "ArrowRight":
            event.preventDefault();
            if (canGoNext) onNext();
            break;
          case "ArrowLeft":
            event.preventDefault();
            if (canGoBack) onBack();
            break;
          case "s":
            event.preventDefault();
            onSaveDraft();
            break;
          case "Enter":
            event.preventDefault();
            if (isLastStep && canSubmit) {
              onSubmit();
            } else if (canGoNext) {
              onNext();
            }
            break;
        }
      } else {
        switch (event.key) {
          case "Escape":
            event.preventDefault();
            onCancel();
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    enableKeyboardShortcuts,
    canGoNext,
    canGoBack,
    canSubmit,
    isLastStep,
    onNext,
    onBack,
    onSaveDraft,
    onSubmit,
    onCancel,
  ]);

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "p-6 bg-muted/30 rounded-lg border",
          compact && "p-4",
          hasErrors && "border-red-200 bg-red-50/30",
          hasWarnings && !hasErrors && "border-yellow-200 bg-yellow-50/30",
        )}
      >
        {/* Enhanced header with validation status */}
        <div className="flex items-center justify-between mb-4">
          {/* Step info with validation */}
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {totalSteps}
            </div>
            {currentStepConfig && (
              <div className="text-xs font-medium text-muted-foreground">
                {currentStepConfig.title}
              </div>
            )}
            {hasErrors && (
              <Badge variant="destructive" className="text-xs">
                {errorCount} error{errorCount !== 1 ? "s" : ""}
              </Badge>
            )}
            {hasWarnings && (
              <Badge variant="secondary" className="text-xs">
                {warningCount} warning{warningCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Draft status */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isDraftSaving ? (
              <div className="flex items-center gap-1">
                <div className="animate-spin h-3 w-3 border border-muted-foreground border-t-transparent rounded-full" />
                <span>Saving...</span>
              </div>
            ) : lastDraftSaved ? (
              <span>Saved {formatLastSaved(lastDraftSaved)}</span>
            ) : null}
            {enableKeyboardShortcuts && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <Keyboard className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Click to see keyboard shortcuts</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Keyboard shortcuts panel */}
        {showShortcuts && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg text-xs space-y-1">
            <div className="font-medium mb-2">Keyboard Shortcuts:</div>
            <div className="grid grid-cols-2 gap-2">
              <div>Ctrl/⌘ + →: Next step</div>
              <div>Ctrl/⌘ + ←: Previous step</div>
              <div>Ctrl/⌘ + S: Save draft</div>
              <div>Ctrl/⌘ + Enter: Submit/Next</div>
              <div>Escape: Cancel</div>
            </div>
          </div>
        )}

        {/* Navigation controls */}
        <div className="flex items-center justify-between">
          {/* Left side - Back button and navigation actions */}
          <div className="flex items-center gap-2">
            {canGoBack ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={onBack}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {previousStepHint || "Go to previous step"}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div /> // Placeholder to maintain spacing
            )}

            {/* Smart navigation dropdown */}
            {(onGoToFirstError || onGoToFirstIncomplete || canSkipStep) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {onGoToFirstError && hasErrors && (
                    <DropdownMenuItem onClick={onGoToFirstError}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Go to First Error
                    </DropdownMenuItem>
                  )}
                  {onGoToFirstIncomplete && (
                    <DropdownMenuItem onClick={onGoToFirstIncomplete}>
                      <Target className="h-4 w-4 mr-2" />
                      Go to First Incomplete
                    </DropdownMenuItem>
                  )}
                  {(onGoToFirstError || onGoToFirstIncomplete) &&
                    canSkipStep && <DropdownMenuSeparator />}
                  {canSkipStep && onSkipStep && (
                    <DropdownMenuItem onClick={onSkipStep}>
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip This Step
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Center - Progress hint */}
          {!compact && completionHint && (
            <div className="text-xs text-muted-foreground text-center">
              {completionHint}
            </div>
          )}

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

            {/* Save draft button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={onSaveDraft}
                  disabled={isLoading || isDraftSaving}
                  className="gap-2"
                >
                  <Save
                    className={cn("h-4 w-4", isDraftSaving && "animate-pulse")}
                  />
                  {isDraftSaving ? "Saving..." : "Save Draft"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Save your progress as a draft (Ctrl/⌘ + S)
              </TooltipContent>
            </Tooltip>

            {/* Next/Submit button */}
            {isLastStep ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onSubmit}
                    disabled={!canSubmit || isLoading}
                    className={cn(
                      "gap-2",
                      canSubmit && "bg-green-600 hover:bg-green-700",
                    )}
                  >
                    {isLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isLoading ? "Creating..." : "Create Content"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {canSubmit
                    ? "Submit form and create content (Ctrl/⌘ + Enter)"
                    : "Complete all required fields to submit"}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onNext}
                    disabled={!canGoNext || isLoading}
                    className={cn(
                      "gap-2",
                      hasErrors && "border-red-300",
                      canGoNext && "bg-primary hover:bg-primary/90",
                    )}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {nextStepHint ||
                    (canGoNext
                      ? "Continue to next step (Ctrl/⌘ + →)"
                      : "Complete current step to continue")}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
