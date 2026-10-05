/**
 * Individual Question Step Component
 *
 * Renders a single question within the TypeForm-style wizard flow.
 * Handles question-specific layouts, validation states, and accessibility.
 */

"use client";

import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { lazy, Suspense, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useReducedMotion } from "@/lib/animations";
import {
  QuestionCard,
  useTypeformMotionVariants,
} from "@/components/ui/typeform";
import { questionItemVariants } from "@/components/ui/typeform/motion";
import { cn } from "@/lib/utils";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import type { QuestionConfig, WizardProgress } from "@/types/wizard";

// Dynamic imports for question components
const AudienceQuestion = lazy(() =>
  import("../questions/AudienceQuestion").then((m) => ({
    default: m.AudienceQuestion,
  })),
);
const IndustryQuestion = lazy(() =>
  import("../questions/IndustryQuestion").then((m) => ({
    default: m.IndustryQuestion,
  })),
);
const PurposeQuestion = lazy(() =>
  import("../questions/PurposeQuestion").then((m) => ({
    default: m.PurposeQuestion,
  })),
);
const ReviewQuestion = lazy(() =>
  import("../questions/ReviewQuestion").then((m) => ({
    default: m.ReviewQuestion,
  })),
);
const SubjectQuestion = lazy(() =>
  import("../questions/SubjectQuestion").then((m) => ({
    default: m.SubjectQuestion,
  })),
);
const WizardModeQuestion = lazy(() =>
  import("../questions/WizardModeQuestion").then((m) => ({
    default: m.WizardModeQuestion,
  })),
);

// Loading fallback component
const QuestionLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-foreground" />
  </div>
);

export interface QuestionStepProps {
  /** Question configuration */
  question: QuestionConfig;

  /** Current form data */
  formData: TopicBuilderFormData;

  /** Update form data handler */
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;

  /** React Hook Form instance */
  form: UseFormReturn<TopicBuilderFormData>;

  /** Validation error message */
  error?: string;

  /** Wizard progress info */
  progress: WizardProgress;

  /** Loading state */
  isLoading?: boolean;

  /** Navigation controls to render inside the question */
  navigationControls?: React.ReactNode;

  /** Custom class name */
  className?: string;

  /** Go to question handler for review step */
  onGoToQuestion?: (questionIndex: number) => void;

  /** Enhanced navigation: Enter edit mode (Task 8.2) */
  enterEditMode?: (questionIndex: number) => void;

  /** Get question error handler for review step */
  getQuestionError?: (questionId: string) => string | undefined;

  /** Questions array for dynamic mapping in review step */
  questions?: QuestionConfig[];

  /** Step advancement callback for dual enter behavior */
  onStepAdvance?: () => void;
}

export function QuestionStep({
  question,
  formData,
  updateFormData,
  form,
  error,
  progress,
  isLoading = false,
  navigationControls,
  className,
  onGoToQuestion,
  enterEditMode,
  getQuestionError,
  questions,
  onStepAdvance,
}: QuestionStepProps) {
  const _prefersReducedMotion = useReducedMotion();
  const itemVariants = useTypeformMotionVariants(questionItemVariants);

  // Render the appropriate question component based on type
  const questionComponent = useMemo(() => {
    const baseProps = {
      question,
      formData,
      updateFormData,
      form,
      error,
      isLoading,
    };

    switch (question.type) {
      case "wizard-mode":
        return <WizardModeQuestion {...baseProps} />;
      case "text-input":
        if (question.id === "subject") {
          return <SubjectQuestion {...baseProps} />;
        }
        // Default text input handling
        return <SubjectQuestion {...baseProps} />;
      case "single-select":
        if (question.id === "industry") {
          return <IndustryQuestion {...baseProps} />;
        }
        // Default single select handling
        return <IndustryQuestion {...baseProps} />;
      case "multi-select":
        if (question.id === "purpose") {
          return <PurposeQuestion {...baseProps} />;
        }
        // Default multi select handling
        return <PurposeQuestion {...baseProps} />;
      case "chip-input":
        return (
          <AudienceQuestion {...baseProps} onStepAdvance={onStepAdvance} />
        );
      case "review":
        return (
          <ReviewQuestion
            {...baseProps}
            onGoToQuestion={onGoToQuestion}
            enterEditMode={enterEditMode}
            getQuestionError={getQuestionError}
            questions={questions}
          />
        );
      default:
        return (
          <div className="p-4 text-muted-foreground text-center">
            Question type "{question.type}" not implemented
          </div>
        );
    }
  }, [
    question,
    formData,
    updateFormData,
    form,
    error,
    isLoading,
    onGoToQuestion,
    enterEditMode,
    getQuestionError,
    questions,
    onStepAdvance,
  ]);

  return (
    <div className={cn("w-full relative", className)}>
      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          className={cn(
            "absolute inset-0 bg-background/80 backdrop-blur-sm",
            "flex items-center justify-center z-10 rounded-md",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          variants={itemVariants}
        >
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </motion.div>
      )}

      {/* Question Content */}
      <QuestionCard
        title={question.title}
        description={question.description}
        required={question.required}
        error={error}
        helpText={question.helpText}
        questionId={question.id}
        progress={progress}
        className={cn(
          "transition-all duration-200",
          isLoading ? "opacity-75 pointer-events-none" : "opacity-100",
        )}
      >
        <Suspense fallback={<QuestionLoadingFallback />}>
          {questionComponent}
        </Suspense>
        {navigationControls}
      </QuestionCard>
    </div>
  );
}
