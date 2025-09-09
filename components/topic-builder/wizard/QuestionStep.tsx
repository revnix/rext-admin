/**
 * Individual Question Step Component
 *
 * Renders a single question within the TypeForm-style wizard flow.
 * Handles question-specific layouts, validation states, and accessibility.
 */

"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { QuestionCard } from "@/components/ui/typeform/question-card";
import {
  getMotionVariants,
  questionItemVariants,
  useReducedMotion,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import type { QuestionConfig, WizardProgress } from "@/types/wizard";
import { AudienceQuestion } from "../questions/AudienceQuestion";
import { ContentTypeQuestion } from "../questions/ContentTypeQuestion";
import { IndustryQuestion } from "../questions/IndustryQuestion";
import { NotesQuestion } from "../questions/NotesQuestion";
import { NumIdeasQuestion } from "../questions/NumIdeasQuestion";
import { PlatformQuestion } from "../questions/PlatformQuestion";
import { PurposeQuestion } from "../questions/PurposeQuestion";
import { ReviewQuestion } from "../questions/ReviewQuestion";
import { SubjectQuestion } from "../questions/SubjectQuestion";
import { ToneQuestion } from "../questions/ToneQuestion";
// Question-specific components
import { WizardModeQuestion } from "../questions/WizardModeQuestion";

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

  /** Get question error handler for review step */
  getQuestionError?: (questionId: string) => string | undefined;

  /** Questions array for dynamic mapping in review step */
  questions?: QuestionConfig[];
}

export function QuestionStep({
  question,
  formData,
  updateFormData,
  error,
  progress,
  isLoading = false,
  navigationControls,
  className,
  onGoToQuestion,
  getQuestionError,
  questions,
}: QuestionStepProps) {
  const prefersReducedMotion = useReducedMotion();
  const itemVariants = getMotionVariants(
    questionItemVariants,
    prefersReducedMotion,
  );

  // Render the appropriate question component based on type
  const questionComponent = useMemo(() => {
    const baseProps = {
      question,
      formData,
      updateFormData,
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
        if (question.id === "notes") {
          return <NotesQuestion {...baseProps} />;
        }
        // Default text input handling
        return <SubjectQuestion {...baseProps} />;
      case "single-select":
        if (question.id === "industry") {
          return <IndustryQuestion {...baseProps} />;
        }
        if (question.id === "content_type") {
          return <ContentTypeQuestion {...baseProps} />;
        }
        if (question.id === "platform") {
          return <PlatformQuestion {...baseProps} />;
        }
        // Default single select handling
        return <IndustryQuestion {...baseProps} />;
      case "multi-select":
        if (question.id === "purpose") {
          return <PurposeQuestion {...baseProps} />;
        }
        if (question.id === "tone") {
          return <ToneQuestion {...baseProps} />;
        }
        // Default multi select handling
        return <PurposeQuestion {...baseProps} />;
      case "chip-input":
        return <AudienceQuestion {...baseProps} />;
      case "number-input":
        return <NumIdeasQuestion {...baseProps} />;
      case "review":
        return (
          <ReviewQuestion
            {...baseProps}
            onGoToQuestion={onGoToQuestion}
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
    error,
    isLoading,
    onGoToQuestion,
    getQuestionError,
    questions,
  ]);

  return (
    <div className={cn("w-full relative", className)}>
      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          className={cn(
            "absolute inset-0 bg-background/80 backdrop-blur-sm",
            "flex items-center justify-center z-10 rounded-lg",
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
        {questionComponent}
        {navigationControls}
      </QuestionCard>
    </div>
  );
}
