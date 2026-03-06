/**
 * Wizard Navigation Component
 *
 * Provides navigation controls for the wizard with accessibility,
 * loading states, and keyboard support.
 */

"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  buttonVariants,
  useReducedMotion,
} from "@/lib/animations";
import { useTypeformMotionVariants } from "@/components/ui/typeform/motion";
import { cn } from "@/lib/utils";

export interface WizardNavigationProps {
  /** Whether user can go back */
  canGoBack: boolean;

  /** Whether user can go forward */
  canGoForward: boolean;

  /** Is this the first question */
  isFirstQuestion: boolean;

  /** Is this the last question */
  isLastQuestion: boolean;

  /** Is form submitting */
  isSubmitting?: boolean;

  /** Is content loading */
  isLoading?: boolean;

  /** Next button handler */
  onNext: () => void;

  /** Previous button handler */
  onPrevious: () => void;

  /** Custom next button label */
  nextLabel?: string;

  /** Custom previous button label */
  previousLabel?: string;

  /** Show skip button for optional questions */
  showSkip?: boolean;

  /** Skip button handler */
  onSkip?: () => void;

  /** Custom class name */
  className?: string;

  /** Compact mode for mobile */
  compact?: boolean;

  /** Enhanced navigation: Whether wizard is in edit mode (Task 8.2) */
  isInEditMode?: boolean;

  /** Enhanced navigation: Save and return to review handler (Task 8.2) */
  onSaveAndReturn?: () => void;
}

export function WizardNavigation({
  canGoBack,
  canGoForward,
  isFirstQuestion,
  isLastQuestion,
  isSubmitting = false,
  isLoading = false,
  onNext,
  onPrevious,
  nextLabel,
  previousLabel = "Back",
  showSkip = false,
  onSkip,
  className,
  compact = false,
  isInEditMode = false,
  onSaveAndReturn,
}: WizardNavigationProps) {
  const prefersReducedMotion = useReducedMotion();
  const motionVariants = useTypeformMotionVariants(buttonVariants);

  const defaultNextLabel = isLastQuestion ? "Generate Topics" : "Next";
  const finalNextLabel = nextLabel || defaultNextLabel;

  const isNextDisabled = !canGoForward || isSubmitting || isLoading;
  const isPrevDisabled = !canGoBack || isSubmitting || isLoading;

  const handleNext = useCallback(() => {
    if (!isNextDisabled) {
      onNext();
    }
  }, [onNext, isNextDisabled]);

  const handlePrevious = useCallback(() => {
    if (!isPrevDisabled) {
      onPrevious();
    }
  }, [onPrevious, isPrevDisabled]);

  const handleSkip = useCallback(() => {
    if (onSkip && !isSubmitting && !isLoading) {
      onSkip();
    }
  }, [onSkip, isSubmitting, isLoading]);

  const handleSaveAndReturn = useCallback(() => {
    if (onSaveAndReturn && !isSubmitting && !isLoading) {
      onSaveAndReturn();
    }
  }, [onSaveAndReturn, isSubmitting, isLoading]);

  if (compact) {
    return (
      <motion.div
        className={cn(
          "flex items-center justify-between gap-3 p-4 bg-card border-t border-border",
          className,
        )}
        variants={motionVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={isPrevDisabled}
          className={cn("min-w-0 px-3", isFirstQuestion && "invisible")}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="sr-only">{previousLabel}</span>
        </Button>

        {/* Skip Button */}
        {showSkip && onSkip && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={isSubmitting || isLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip
          </Button>
        )}

        {/* Next Button */}
        <Button
          onClick={handleNext}
          disabled={isNextDisabled}
          size="sm"
          className={cn(
            "min-w-0 px-3",
            isLastQuestion &&
            "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
          )}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLastQuestion && !isSubmitting && <Sparkles className="w-4 h-4" />}
          {!isSubmitting && !isLastQuestion && (
            <ArrowRight className="w-4 h-4" />
          )}
          <span className="sr-only">{finalNextLabel}</span>
        </Button>

        {/* Save & Return Button (Edit Mode - Task 8.2) */}
        {isInEditMode && onSaveAndReturn && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAndReturn}
            disabled={isSubmitting || isLoading}
            className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/30"
            aria-label="Save changes and return to review step"
            title="Save your changes and return to the review step"
          >
            Save
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        "flex items-center justify-between gap-4 p-6 bg-card border-t border-border",
        className,
      )}
      variants={motionVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center gap-3">
        {/* Previous Button */}
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isPrevDisabled}
          className={cn("gap-2 px-6 h-11", isFirstQuestion && "invisible")}
        >
          <ArrowLeft className="w-4 h-4" />
          {previousLabel}
        </Button>

        {/* Skip Button */}
        {showSkip && onSkip && (
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting || isLoading}
            className="text-muted-foreground hover:text-foreground px-6 h-11"
          >
            Skip
          </Button>
        )}
      </div>

      {/* Center - Help Text */}
      <div className="flex-1 text-center">
        <output className="text-sm text-muted-foreground" aria-live="polite">
          {isInEditMode ? (
            <span>
              Edit mode: Press{" "}
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">
                Enter
              </kbd>{" "}
              to continue or use Save
              {!isFirstQuestion && (
                <>
                  {" · "}
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">
                    Esc
                  </kbd>{" "}
                  to go back
                </>
              )}
            </span>
          ) : (
            <span>
              Press{" "}
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">
                Enter
              </kbd>{" "}
              to continue
              {!isFirstQuestion && (
                <>
                  {" or "}
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">
                    Esc
                  </kbd>{" "}
                  to go back
                </>
              )}
            </span>
          )}
        </output>
      </div>

      <div className="flex items-center gap-3">
        {/* Next Button */}
        <Button
          onClick={handleNext}
          disabled={isNextDisabled}
          className={cn(
            "gap-2 px-6 h-11 min-w-[120px] font-medium",
            isLastQuestion && [
              "bg-gradient-to-r from-primary via-primary to-primary/80",
              "hover:from-primary/90 hover:via-primary/90 hover:to-primary/70",
              "shadow-lg hover:shadow-xl transition-all duration-200",
            ],
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isLastQuestion ? "Generating..." : "Loading..."}</span>
            </>
          ) : (
            <>
              <span>{finalNextLabel}</span>
              {isLastQuestion ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </>
          )}
        </Button>

        {/* Save & Return Button (Edit Mode - Task 8.2) */}
        {isInEditMode && onSaveAndReturn && (
          <Button
            variant="outline"
            onClick={handleSaveAndReturn}
            disabled={isSubmitting || isLoading}
            className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/30 px-4 h-11"
            aria-label="Save changes and return to review step"
            title="Save your changes and return to the review step"
          >
            Save
          </Button>
        )}
      </div>
    </motion.div>
  );
}
