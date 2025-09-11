"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { announceToScreenReader } from "@/lib/typeform-utils";
import { cn } from "@/lib/utils";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import type { WizardContainerProps } from "@/types/topic-builder-components";
import type { NavigationDirection } from "@/types/wizard";

export const WizardContainer = memo(function WizardContainer({
  questions,
  currentQuestionIndex,
  formData,
  onNext,
  onPrevious,
  onGoToQuestion,
  autoAdvance: _autoAdvance = false,
  allowBackNavigation = true,
  className,
  children,
}: WizardContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Memoize validation result to prevent infinite loops
  const currentQuestionValidation = useMemo(() => {
    if (!currentQuestion)
      return { isValid: false, errors: ["No question found"] };

    // Special case: review step is always valid since it's just displaying information
    if (currentQuestion.id === "review") {
      return { isValid: true, errors: [] };
    }

    const field = currentQuestion.id as keyof TopicBuilderFormData;
    const value = formData[field];

    if (currentQuestion.required) {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return { isValid: false, errors: ["This field is required"] };
      }
    }

    return { isValid: true, errors: [] };
  }, [currentQuestion, formData]);

  // Determine navigation direction for animations
  const [direction, setDirection] = useState<NavigationDirection>("forward");

  // Focus management
  const focusQuestion = useCallback(() => {
    if (containerRef.current) {
      const questionElement = containerRef.current.querySelector("fieldset");
      if (questionElement instanceof HTMLElement) {
        questionElement.focus();
      }
    }
  }, []);

  // Check if the active element is within a chip input
  const isChipInputFocused = useCallback(() => {
    const activeElement = document.activeElement;
    if (!activeElement) return false;
    const chipInputContainer = activeElement.closest("[data-chip-input]");
    return !!chipInputContainer;
  }, []);

  // Announce question changes to screen readers
  useEffect(() => {
    if (currentQuestion) {
      announceToScreenReader(
        `Question ${currentQuestionIndex + 1} of ${questions.length}: ${
          currentQuestion.title
        }`,
      );
      focusQuestion();
    }
  }, [currentQuestionIndex, currentQuestion, questions.length, focusQuestion]);

  // Keyboard navigation
  useHotkeys(
    "ctrl+shift+left,cmd+shift+left",
    () => {
      if (!isFirstQuestion && allowBackNavigation) {
        handlePrevious();
      }
    },
    { preventDefault: true, enableOnFormTags: true },
  );

  useHotkeys(
    "ctrl+shift+right,cmd+shift+right",
    () => {
      if (currentQuestionValidation.isValid && !isLastQuestion) {
        handleNext();
      }
    },
    { preventDefault: true, enableOnFormTags: true },
  );

  // Enter key navigation - proceed to next question
  useHotkeys(
    "enter",
    (e) => {
      console.log("🔑 Enter key pressed", {
        isChipInputFocused: isChipInputFocused(),
        targetTag: (e.target as HTMLElement)?.tagName,
        isValid: currentQuestionValidation.isValid,
        isLastQuestion,
      });

      // Don't handle Enter if we're in a chip input - let the component handle it
      if (isChipInputFocused()) {
        console.log("🚫 Enter ignored - chip input is focused");
        return;
      }

      // Only handle if not in a textarea or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true" ||
        target.getAttribute("role") === "combobox"
      ) {
        console.log("🚫 Enter ignored - in textarea/contenteditable/combobox");
        return;
      }

      if (currentQuestionValidation.isValid) {
        console.log("✅ Enter - advancing to next question");
        e.preventDefault();
        handleNext();
      } else {
        console.log("❌ Enter blocked - validation issue");
      }
    },
    { preventDefault: false, enableOnFormTags: true },
  );

  // Arrow key navigation
  useHotkeys(
    "ArrowRight",
    (e) => {
      const target = e.target as HTMLElement;
      // Only handle if not in an input field
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      if (currentQuestionValidation.isValid) {
        e.preventDefault();
        handleNext();
      }
    },
    { preventDefault: false, enableOnFormTags: true },
  );

  useHotkeys(
    "ArrowLeft",
    (e) => {
      const target = e.target as HTMLElement;
      // Only handle if not in an input field
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      if (!isFirstQuestion && allowBackNavigation) {
        e.preventDefault();
        handlePrevious();
      }
    },
    { preventDefault: false, enableOnFormTags: true },
  );

  // ESC key - go back to previous question
  useHotkeys(
    "Escape",
    (e) => {
      console.log("🔑 Escape key pressed", {
        isFirstQuestion,
        allowBackNavigation,
      });

      if (!isFirstQuestion && allowBackNavigation) {
        console.log("✅ Escape - going back to previous question");
        e.preventDefault();
        handlePrevious();
      } else {
        console.log("❌ Escape blocked - first question or not allowed");
      }
    },
    { preventDefault: false, enableOnFormTags: true },
  );

  // Navigation handlers with direction tracking
  const handleNext = useCallback(() => {
    setDirection("forward");
    return onNext();
  }, [onNext]);

  const handlePrevious = useCallback(() => {
    setDirection("backward");
    return onPrevious();
  }, [onPrevious]);

  const handleGoToQuestion = useCallback(
    (index: number) => {
      setDirection(index > currentQuestionIndex ? "forward" : "backward");
      return onGoToQuestion(index);
    },
    [currentQuestionIndex, onGoToQuestion],
  );

  // Handle auto-advance for single-select questions
  const handleQuestionChange = useCallback(
    (
      _field: keyof TopicBuilderFormData,
      _value: TopicBuilderFormData[keyof TopicBuilderFormData],
    ) => {
      // This will be passed to parent to handle form data updates
    },
    [],
  );

  const progress = {
    current: currentQuestionIndex + 1,
    total: questions.length,
    percentage: ((currentQuestionIndex + 1) / questions.length) * 100,
  };

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">
            No questions available
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col min-h-screen bg-background",
        "focus:outline-none",
        className,
      )}
      role="application"
      aria-label="Topic Builder Wizard"
    >
      {children({
        currentQuestion,
        direction,
        isFirstQuestion,
        isLastQuestion,
        currentQuestionValidation,
        progress,
        handleNext,
        handlePrevious,
        handleGoToQuestion,
        handleQuestionChange,
        containerRef,
      })}

      {/* Screen Reader Live Region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="wizard-announcements"
      />
    </div>
  );
});
