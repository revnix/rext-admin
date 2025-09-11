/**
 * Review Question Component
 *
 * Displays a comprehensive review of all form selections before topic generation.
 * Shows the form data in a structured, readable format similar to the ReviewStep
 * but integrated within the TypeForm-style wizard flow.
 */

"use client";

import {
  AlertCircle,
  Lightbulb,
  Pencil,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import {
  CONTENT_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  PLATFORM_OPTIONS,
  PURPOSE_OPTIONS,
  TONE_OPTIONS,
} from "@/types/topic-builder";
import type { QuestionConfig } from "@/types/wizard";

interface ReviewQuestionProps {
  question: QuestionConfig;
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  error?: string;
  isLoading?: boolean;
  // Enhanced props for dynamic navigation (Task 8.2)
  onGoToQuestion?: (questionIndex: number) => void;
  enterEditMode?: (questionIndex: number) => void; // New edit mode function
  getQuestionError?: (questionId: string) => string | undefined;
  questions?: QuestionConfig[];
}

interface ReviewCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | string[] | number | boolean | undefined;
  field: keyof TopicBuilderFormData;
  hasError?: boolean;
  errorMessage?: string;
  onEdit?: () => void;
  ariaLabel: string;
}

function ReviewCard({
  icon,
  label,
  value,
  field,
  hasError,
  errorMessage,
  onEdit,
  ariaLabel,
}: ReviewCardProps) {
  return (
    <Card
      className={cn(
        "h-fit transition-all duration-200",
        hasError
          ? "border-destructive bg-destructive/5 shadow-sm ring-1 ring-destructive/20"
          : "hover:shadow-sm",
      )}
      aria-invalid={hasError ? "true" : "false"}
      aria-describedby={hasError ? `${field}-error` : undefined}
    >
      <CardContent className="p-3 sm:p-4">
        {/* Error Context */}
        {hasError && errorMessage && (
          <div
            id={`${field}-error`}
            className="text-xs text-destructive mb-3 p-2 bg-destructive/10 rounded border border-destructive/20"
            role="alert"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Error:</strong> {errorMessage}
                {getErrorGuidance(field, errorMessage) && (
                  <div className="mt-1 text-muted-foreground">
                    💡 {getErrorGuidance(field, errorMessage)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            <div className="flex-shrink-0">{icon}</div>
            <h3 className="font-medium text-sm sm:text-base truncate">
              {label}
            </h3>
            {hasError && (
              <AlertCircle
                className="h-4 w-4 text-destructive flex-shrink-0"
                aria-label="Error in this field"
              />
            )}
          </div>
          {onEdit && (
            <Button
              variant={hasError ? "destructive" : "ghost"}
              size="sm"
              onClick={onEdit}
              aria-label={ariaLabel}
              title={hasError ? `Fix error in ${label}` : `Edit ${label}`}
              className={cn(
                "h-auto p-2 min-w-[44px] min-h-[44px] flex-shrink-0 ml-2",
                hasError &&
                  "text-destructive-foreground hover:bg-destructive/90",
              )}
            >
              <Pencil className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
              {hasError && <span className="sr-only">Fix error</span>}
            </Button>
          )}
        </div>
        <div className="text-sm sm:text-base text-muted-foreground break-words">
          {renderValue(value)}
        </div>
      </CardContent>
    </Card>
  );
}

function renderValue(
  value: string | string[] | number | boolean | undefined,
): React.ReactNode {
  if (value === undefined || value === null || value === "") {
    return (
      <span className="italic text-muted-foreground/60 text-xs sm:text-sm">
        Not specified
      </span>
    );
  }

  if (typeof value === "boolean") {
    return (
      <span className="text-sm sm:text-base font-medium">
        {value ? "Yes" : "No"}
      </span>
    );
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? (
      <span className="text-sm sm:text-base break-words">
        {value.join(", ")}
      </span>
    ) : (
      <span className="italic text-muted-foreground/60 text-xs sm:text-sm">
        None selected
      </span>
    );
  }

  if (typeof value === "number") {
    return <span className="font-medium text-sm sm:text-base">{value}</span>;
  }

  return (
    <span className="text-sm sm:text-base break-words">{String(value)}</span>
  );
}

// Helper function to provide contextual error guidance
function getErrorGuidance(field: string, error: string): string | null {
  const guidance: Record<string, Record<string, string>> = {
    subject: {
      required: "Enter a specific topic you want to create content about.",
      "at least 3": "Provide more detail to help generate better topics.",
    },
    purpose: {
      "at least one": "Select what you want to achieve with your content.",
      required: "Choose your main content goal from the available options.",
    },
    tone: {
      "at least one": "Choose how you want your content to sound.",
      required: "Select the voice and style that matches your brand.",
    },
    num_topics: {
      "between 1 and 20": "Enter a number from 1 to 20.",
      required: "Specify how many topics you want us to generate.",
    },
    wizardMode: {
      required: "Choose how you want to approach brainstorming.",
    },
    industry: {
      required: "Select your industry to tailor content topics to your market.",
    },
    content_type: {
      required: "Choose what type of content you want to create.",
    },
  };

  const fieldGuidance = guidance[field];
  if (!fieldGuidance) return null;

  for (const [errorKey, message] of Object.entries(fieldGuidance)) {
    if (error.toLowerCase().includes(errorKey)) {
      return message;
    }
  }
  return null;
}

export function ReviewQuestion({
  formData,
  onGoToQuestion,
  enterEditMode,
  getQuestionError,
  questions,
}: ReviewQuestionProps) {
  const getDisplayValue = (
    options: { label: string; value: string }[],
    value: string,
  ) => {
    return options.find((opt) => opt.value === value)?.label || value;
  };

  // Dynamic question index mapping based on actual questions array
  const getQuestionIndex = useMemo(() => {
    if (!questions) {
      // Fallback to static mapping if questions not available
      const staticMapping: Record<string, number> = {
        wizardMode: 0,
        subject: 1,
        industry: 1,
        content_type: 2,
        platform: 3,
        audience: 4,
        purpose: 5,
        tone: 6,
        num_topics: 7,
        notes: 8,
      };
      return (questionId: string) => staticMapping[questionId] ?? 0;
    }

    // Create dynamic mapping from questions array
    const mapping = new Map<string, number>();
    questions.forEach((q, index) => {
      mapping.set(q.id, index);
    });

    return (questionId: string) => mapping.get(questionId) ?? 0;
  }, [questions]);

  // Enhanced error detection across all possible fields
  const errors = useMemo(() => {
    if (!getQuestionError || !questions) return {};

    const errorMap: Record<string, string> = {};
    questions.forEach((q) => {
      const error = getQuestionError(q.id);
      if (error) {
        errorMap[q.id] = error;
      }
    });
    return errorMap;
  }, [getQuestionError, questions]);

  const errorCount = Object.keys(errors).length;
  const errorCategories = useMemo(() => {
    const categories = { required: 0, validation: 0 };
    Object.entries(errors).forEach(([, error]) => {
      if (error?.toLowerCase().includes("required")) {
        categories.required++;
      } else {
        categories.validation++;
      }
    });
    return categories;
  }, [errors]);

  // Navigation functions for error fixing
  const handleFixFirstError = useCallback(() => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const questionIndex = getQuestionIndex(firstErrorField);
      // Task 8.2: Use enhanced edit mode when available
      if (enterEditMode) {
        enterEditMode(questionIndex);
      } else if (onGoToQuestion) {
        onGoToQuestion(questionIndex);
      }
    }
  }, [errors, onGoToQuestion, enterEditMode, getQuestionIndex]);

  const handleFixError = useCallback(
    (field: string) => {
      const questionIndex = getQuestionIndex(field);
      // Task 8.2: Use enhanced edit mode when available
      if (enterEditMode) {
        enterEditMode(questionIndex);
      } else if (onGoToQuestion) {
        onGoToQuestion(questionIndex);
      }
    },
    [onGoToQuestion, enterEditMode, getQuestionIndex],
  );

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "e":
            e.preventDefault();
            handleFixFirstError();
            break;
        }
      }
    };

    if (errorCount > 0) {
      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
    }
  }, [errorCount, handleFixFirstError]);

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Enhanced Error Summary */}
      {errorCount > 0 && (
        <Alert
          variant="destructive"
          className="mx-auto max-w-2xl"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <AlertTitle className="text-sm sm:text-base">
              {errorCount} {errorCount === 1 ? "issue" : "issues"} need
              attention
            </AlertTitle>
            <AlertDescription className="text-xs sm:text-sm space-y-2">
              <p>Please review and fix the following:</p>
              {errorCategories.required > 0 && (
                <p>
                  • {errorCategories.required} required field
                  {errorCategories.required !== 1 ? "s" : ""}
                </p>
              )}
              {errorCategories.validation > 0 && (
                <p>
                  • {errorCategories.validation} validation error
                  {errorCategories.validation !== 1 ? "s" : ""}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFixFirstError}
                  className="text-xs bg-background hover:bg-muted"
                >
                  Fix First Issue
                </Button>
                {errorCount > 1 && (
                  <span className="text-xs text-muted-foreground self-center">
                    or use edit buttons below
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Tip: Press{" "}
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                  Ctrl+E
                </kbd>{" "}
                to quickly fix the first error
              </p>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Summary Section */}
      <div className="text-center space-y-2 sm:space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mb-2 sm:mb-3">
          <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
        </div>
        <p
          className="text-muted-foreground max-w-2xl mx-auto px-2"
          style={{
            fontSize: "clamp(1rem, 4vw, 1.125rem)",
            lineHeight: "clamp(1.4, 4vw, 1.6)",
          }}
        >
          We'll create{" "}
          <span className="font-semibold text-primary">
            {formData.num_topics} targeted topics
          </span>{" "}
          based on your selections below.
        </p>
      </div>

      {/* Configuration Review Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto">
        <ReviewCard
          icon={<Settings className="h-4 w-4 text-primary" />}
          label="Wizard Mode"
          value={
            formData.wizardMode === "subject-first"
              ? "Subject-First"
              : "Industry-First"
          }
          field="wizardMode"
          hasError={!!errors.wizardMode}
          errorMessage={errors.wizardMode}
          onEdit={
            onGoToQuestion || enterEditMode
              ? () => handleFixError("wizardMode")
              : undefined
          }
          ariaLabel="Edit wizard mode selection"
        />

        {formData.subject && (
          <ReviewCard
            icon={<Target className="h-4 w-4 text-primary" />}
            label="Subject"
            value={formData.subject}
            field="subject"
            hasError={!!errors.subject}
            errorMessage={errors.subject}
            onEdit={
              onGoToQuestion || enterEditMode
                ? () => handleFixError("subject")
                : undefined
            }
            ariaLabel="Edit subject"
          />
        )}

        <ReviewCard
          icon={<Settings className="h-4 w-4 text-primary" />}
          label="Industry"
          value={getDisplayValue(INDUSTRY_OPTIONS, formData.industry)}
          field="industry"
          hasError={!!errors.industry}
          errorMessage={errors.industry}
          onEdit={
            onGoToQuestion || enterEditMode
              ? () => handleFixError("industry")
              : undefined
          }
          ariaLabel="Edit industry selection"
        />

        <ReviewCard
          icon={<Settings className="h-4 w-4 text-primary" />}
          label="Content Type"
          value={getDisplayValue(CONTENT_TYPE_OPTIONS, formData.content_type)}
          field="content_type"
          hasError={!!errors.content_type}
          errorMessage={errors.content_type}
          onEdit={
            onGoToQuestion || enterEditMode
              ? () => handleFixError("content_type")
              : undefined
          }
          ariaLabel="Edit content type selection"
        />

        {formData.platform && (
          <ReviewCard
            icon={<Settings className="h-4 w-4 text-primary" />}
            label="Platform"
            value={getDisplayValue(PLATFORM_OPTIONS, formData.platform)}
            field="platform"
            hasError={!!errors.platform}
            errorMessage={errors.platform}
            onEdit={
              onGoToQuestion || enterEditMode
                ? () => handleFixError("platform")
                : undefined
            }
            ariaLabel="Edit platform selection"
          />
        )}

        {formData.audience && formData.audience.length > 0 && (
          <ReviewCard
            icon={<Target className="h-4 w-4 text-primary" />}
            label="Target Audience"
            value={formData.audience}
            field="audience"
            hasError={!!errors.audience}
            errorMessage={errors.audience}
            onEdit={
              onGoToQuestion || enterEditMode
                ? () => handleFixError("audience")
                : undefined
            }
            ariaLabel="Edit audience selection"
          />
        )}

        <ReviewCard
          icon={<Target className="h-4 w-4 text-primary" />}
          label="Purpose"
          value={formData.purpose.map((p) =>
            getDisplayValue(PURPOSE_OPTIONS, p),
          )}
          field="purpose"
          hasError={!!errors.purpose}
          errorMessage={errors.purpose}
          onEdit={
            onGoToQuestion || enterEditMode
              ? () => handleFixError("purpose")
              : undefined
          }
          ariaLabel="Edit purpose selection"
        />

        <ReviewCard
          icon={<Target className="h-4 w-4 text-primary" />}
          label="Tone"
          value={formData.tone.map((t) => getDisplayValue(TONE_OPTIONS, t))}
          field="tone"
          hasError={!!errors.tone}
          errorMessage={errors.tone}
          onEdit={
            onGoToQuestion || enterEditMode
              ? () => handleFixError("tone")
              : undefined
          }
          ariaLabel="Edit tone selection"
        />

        <ReviewCard
          icon={<Lightbulb className="h-4 w-4 text-primary" />}
          label="Number of Topics"
          value={formData.num_topics}
          field="num_topics"
          hasError={!!errors.num_topics}
          errorMessage={errors.num_topics}
          onEdit={
            onGoToQuestion || enterEditMode
              ? () => handleFixError("num_topics")
              : undefined
          }
          ariaLabel="Edit number of topics"
        />

        {formData.notes && (
          <ReviewCard
            icon={<Lightbulb className="h-4 w-4 text-primary" />}
            label="Additional Notes"
            value={formData.notes}
            field="notes"
            hasError={!!errors.notes}
            errorMessage={errors.notes}
            onEdit={
              onGoToQuestion || enterEditMode
                ? () => handleFixError("notes")
                : undefined
            }
            ariaLabel="Edit additional notes"
          />
        )}
      </div>
    </div>
  );
}
