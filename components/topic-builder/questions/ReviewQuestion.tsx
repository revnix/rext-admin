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

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  // New props for enhanced functionality
  onGoToQuestion?: (questionIndex: number) => void;
  getQuestionError?: (questionId: string) => string | undefined;
}

interface ReviewCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | string[] | number | boolean | undefined;
  field: keyof TopicBuilderFormData;
  hasError?: boolean;
  onEdit?: () => void;
  ariaLabel: string;
}

function ReviewCard({
  icon,
  label,
  value,
  hasError,
  onEdit,
  ariaLabel,
}: ReviewCardProps) {
  return (
    <Card
      className={`h-fit transition-colors ${hasError ? "border-destructive bg-destructive/5" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-medium text-sm">{label}</h3>
            {hasError && (
              <AlertCircle
                className="h-4 w-4 text-destructive"
                aria-label="Error in this field"
              />
            )}
          </div>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              aria-label={ariaLabel}
              className="h-auto p-1"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
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
      <span className="italic text-muted-foreground/60">Not specified</span>
    );
  }

  if (typeof value === "boolean") {
    return (
      <Badge variant="outline" className="text-xs">
        {value ? "Yes" : "No"}
      </Badge>
    );
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {value.map((item) => (
          <Badge key={item} variant="secondary" className="text-xs">
            {item}
          </Badge>
        ))}
      </div>
    ) : (
      <span className="italic text-muted-foreground/60">None selected</span>
    );
  }

  if (typeof value === "number") {
    return <span className="font-medium">{value}</span>;
  }

  return <span>{String(value)}</span>;
}

export function ReviewQuestion({
  formData,
  onGoToQuestion,
  getQuestionError,
}: ReviewQuestionProps) {
  const getDisplayValue = (
    options: { label: string; value: string }[],
    value: string,
  ) => {
    return options.find((opt) => opt.value === value)?.label || value;
  };

  // Question index mapping for navigation
  const questionMapping: Record<string, number> = {
    wizardMode: 0,
    subject: 1,
    industry: 1,
    content_type: 2,
    platform: 3,
    audience: 4,
    purpose: 5,
    tone: 6,
    num_ideas: 7,
    notes: 8,
  };

  const hasErrors =
    getQuestionError &&
    (!!getQuestionError("wizardMode") ||
      !!getQuestionError("industry") ||
      !!getQuestionError("content_type") ||
      !!getQuestionError("purpose") ||
      !!getQuestionError("tone") ||
      !!getQuestionError("num_ideas"));

  return (
    <div className="space-y-6">
      {/* Error Summary */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Please review your selections</AlertTitle>
          <AlertDescription>
            Some required information is missing. Use the edit buttons below to
            fix any issues.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mb-3">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          We'll create{" "}
          <span className="font-semibold text-primary">
            {formData.num_ideas} targeted topic ideas
          </span>{" "}
          based on your selections below.
        </p>
      </div>

      {/* Configuration Review Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReviewCard
          icon={<Settings className="h-4 w-4 text-primary" />}
          label="Wizard Mode"
          value={
            formData.wizardMode === "subject-first"
              ? "Subject-First"
              : "Industry-First"
          }
          field="wizardMode"
          hasError={getQuestionError?.("wizardMode") !== undefined}
          onEdit={
            onGoToQuestion
              ? () => onGoToQuestion(questionMapping.wizardMode)
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
            hasError={getQuestionError?.("subject") !== undefined}
            onEdit={
              onGoToQuestion
                ? () => onGoToQuestion(questionMapping.subject)
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
          hasError={getQuestionError?.("industry") !== undefined}
          onEdit={
            onGoToQuestion
              ? () => onGoToQuestion(questionMapping.industry)
              : undefined
          }
          ariaLabel="Edit industry selection"
        />

        <ReviewCard
          icon={<Settings className="h-4 w-4 text-primary" />}
          label="Content Type"
          value={getDisplayValue(CONTENT_TYPE_OPTIONS, formData.content_type)}
          field="content_type"
          hasError={getQuestionError?.("content_type") !== undefined}
          onEdit={
            onGoToQuestion
              ? () => onGoToQuestion(questionMapping.content_type)
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
            hasError={getQuestionError?.("platform") !== undefined}
            onEdit={
              onGoToQuestion
                ? () => onGoToQuestion(questionMapping.platform)
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
            hasError={getQuestionError?.("audience") !== undefined}
            onEdit={
              onGoToQuestion
                ? () => onGoToQuestion(questionMapping.audience)
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
          hasError={getQuestionError?.("purpose") !== undefined}
          onEdit={
            onGoToQuestion
              ? () => onGoToQuestion(questionMapping.purpose)
              : undefined
          }
          ariaLabel="Edit purpose selection"
        />

        <ReviewCard
          icon={<Target className="h-4 w-4 text-primary" />}
          label="Tone"
          value={formData.tone.map((t) => getDisplayValue(TONE_OPTIONS, t))}
          field="tone"
          hasError={getQuestionError?.("tone") !== undefined}
          onEdit={
            onGoToQuestion
              ? () => onGoToQuestion(questionMapping.tone)
              : undefined
          }
          ariaLabel="Edit tone selection"
        />

        <ReviewCard
          icon={<Lightbulb className="h-4 w-4 text-primary" />}
          label="Number of Ideas"
          value={formData.num_ideas}
          field="num_ideas"
          hasError={getQuestionError?.("num_ideas") !== undefined}
          onEdit={
            onGoToQuestion
              ? () => onGoToQuestion(questionMapping.num_ideas)
              : undefined
          }
          ariaLabel="Edit number of ideas"
        />

        {formData.notes && (
          <ReviewCard
            icon={<Lightbulb className="h-4 w-4 text-primary" />}
            label="Additional Notes"
            value={formData.notes}
            field="notes"
            hasError={getQuestionError?.("notes") !== undefined}
            onEdit={
              onGoToQuestion
                ? () => onGoToQuestion(questionMapping.notes)
                : undefined
            }
            ariaLabel="Edit additional notes"
          />
        )}
      </div>
    </div>
  );
}
