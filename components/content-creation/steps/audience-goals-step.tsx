"use client";

import { BookOpen, Target, Trophy, Users } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import type { WizardDependencyEngine } from "@/lib/content-creation/dependency-engine";
import {
  AUDIENCE_SIZE_OPTIONS,
  GOALS_OPTIONS,
  getAudienceTypeOptions,
  READING_LEVEL_OPTIONS,
} from "@/lib/content-creation/wizard-config";
import type { WizardStepProps } from "@/types/content-creation";
import { OptionGridLayout } from "../layouts/option-grid-layout";
import { QuestionAnswerLayout } from "../layouts/question-answer-layout";

interface AudienceGoalsStepProps extends WizardStepProps {
  dependencyEngine: WizardDependencyEngine;
}

/**
 * Step 2: Audience & Goals Component
 *
 * This step handles:
 * - Audience size selection
 * - Audience type multi-selection (filtered by industry)
 * - Reading level selection
 * - Content goals multi-selection
 */
export function AudienceGoalsStep({
  step,
  formData,
  errors,
  touched,
  isActive: _isActive,
  onFieldChange,
  onFieldTouch,
  dependencyEngine,
}: AudienceGoalsStepProps) {
  // Get visible fields for this step
  const visibleFields = dependencyEngine.getVisibleFields(step);

  const audienceSizeField = visibleFields.find((f) => f.id === "audienceSize");
  const audienceTypeField = visibleFields.find((f) => f.id === "audienceType");
  const readingLevelField = visibleFields.find((f) => f.id === "readingLevel");
  const goalsField = visibleFields.find((f) => f.id === "goals");

  // Get audience type options based on industry
  const audienceTypeOptions = useMemo(
    () => getAudienceTypeOptions(formData.industry),
    [formData.industry],
  );

  // Handle audience type multi-select
  const handleAudienceTypeChange = useCallback(
    (audienceType: string, isChecked: boolean) => {
      const currentTypes = formData.audienceType || [];

      if (isChecked) {
        // Add if under limit (max 3)
        if (currentTypes.length < 3) {
          const newTypes = [...currentTypes, audienceType];
          onFieldChange("audienceType", newTypes);
        }
      } else {
        // Remove
        const newTypes = currentTypes.filter((type) => type !== audienceType);
        onFieldChange("audienceType", newTypes);
      }

      onFieldTouch("audienceType");
    },
    [formData.audienceType, onFieldChange, onFieldTouch],
  );

  // Handle goals multi-select
  const handleGoalsChange = useCallback(
    (goal: string, isChecked: boolean) => {
      const currentGoals = formData.goals || [];

      if (isChecked) {
        // Add if under limit (max 3)
        if (currentGoals.length < 3) {
          const newGoals = [...currentGoals, goal];
          onFieldChange("goals", newGoals);
        }
      } else {
        // Remove
        const newGoals = currentGoals.filter((g) => g !== goal);
        onFieldChange("goals", newGoals);
      }

      onFieldTouch("goals");
    },
    [formData.goals, onFieldChange, onFieldTouch],
  );

  return (
    <div className="space-y-8 w-full">
      {/* Step header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{step.title}</h2>
        <p className="text-muted-foreground mt-2">{step.description}</p>
      </div>

      <div className="grid gap-8 w-full">
        {/* Audience Size Selection */}
        {audienceSizeField && (
          <QuestionAnswerLayout
            question={{
              label: "Audience Size",
              description:
                "What's the approximate size of your target audience?",
              icon: Users,
            }}
            hasError={!!(errors.audienceSize && touched.audienceSize)}
            error={errors.audienceSize}
          >
            <RadioGroup
              options={AUDIENCE_SIZE_OPTIONS}
              value={formData.audienceSize || ""}
              onValueChange={(value) => {
                onFieldChange("audienceSize", value);
                onFieldTouch("audienceSize");
              }}
              columns={3}
            />
          </QuestionAnswerLayout>
        )}

        {/* Audience Type Multi-Selection */}
        {audienceTypeField && (
          <QuestionAnswerLayout
            question={{
              label: "Who's your audience?",
              description: `Select up to 3 audience types that best describe your target audience${formData.industry ? ` (filtered for ${formData.industry})` : ""}`,
              icon: Target,
            }}
            hasError={!!(errors.audienceType && touched.audienceType)}
            error={errors.audienceType}
          >
            <div className="space-y-4">
              <OptionGridLayout>
                {audienceTypeOptions.map((option) => {
                  const isSelected =
                    formData.audienceType?.includes(option.value) || false;
                  const isDisabled =
                    !isSelected && (formData.audienceType?.length || 0) >= 3;

                  return (
                    <Label
                      key={option.value}
                      className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : isDisabled
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-accent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={(e) =>
                          handleAudienceTypeChange(
                            option.value,
                            e.target.checked,
                          )
                        }
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="font-medium">{option.label}</span>
                    </Label>
                  );
                })}
              </OptionGridLayout>

              {/* Selected audience types preview */}
              {formData.audienceType && formData.audienceType.length > 0 && (
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Selected audience types:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.audienceType.map((type) => (
                        <Badge key={type} variant="default" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground">
                {formData.audienceType?.length || 0} / 3 selected
              </div>
            </div>
          </QuestionAnswerLayout>
        )}

        {/* Reading Level Selection */}
        {readingLevelField && (
          <QuestionAnswerLayout
            question={{
              label: "Reading Level",
              description: "How technical or complex should the content be?",
              icon: BookOpen,
            }}
            isAutoFilled={
              formData._topicPrefillingMetadata?.prefilledFields
                ?.readingLevel || false
            }
            isModified={touched.readingLevel || false}
            hasError={!!(errors.readingLevel && touched.readingLevel)}
            error={errors.readingLevel}
          >
            <RadioGroup
              options={READING_LEVEL_OPTIONS}
              value={formData.readingLevel || ""}
              onValueChange={(value) => {
                onFieldChange("readingLevel", value);
                onFieldTouch("readingLevel");
              }}
              columns={3}
            />
          </QuestionAnswerLayout>
        )}

        {/* Content Goals Multi-Selection */}
        {goalsField && (
          <QuestionAnswerLayout
            question={{
              label: "Content Goals",
              description:
                "What do you want to achieve with this content? Select up to 3 goals",
              icon: Trophy,
            }}
            isAutoFilled={
              formData._topicPrefillingMetadata?.prefilledFields?.goals || false
            }
            isModified={touched.goals || false}
            hasError={!!(errors.goals && touched.goals)}
            error={errors.goals}
          >
            <div className="space-y-4">
              <OptionGridLayout>
                {GOALS_OPTIONS.map((option) => {
                  const isSelected =
                    formData.goals?.includes(option.value) || false;
                  const isDisabled =
                    !isSelected && (formData.goals?.length || 0) >= 3;

                  return (
                    <Label
                      key={option.value}
                      className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : isDisabled
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-accent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={(e) =>
                          handleGoalsChange(option.value, e.target.checked)
                        }
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </Label>
                  );
                })}
              </OptionGridLayout>

              {/* Selected goals preview */}
              {formData.goals && formData.goals.length > 0 && (
                <Alert>
                  <Trophy className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Selected goals:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.goals.map((goal) => (
                        <Badge key={goal} variant="default" className="text-xs">
                          {goal}
                        </Badge>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground">
                {formData.goals?.length || 0} / 3 selected
              </div>
            </div>
          </QuestionAnswerLayout>
        )}
      </div>

      {/* Progress summary for this step */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Step 2 Progress:</span>
            <div className="flex items-center gap-4">
              <Badge variant={formData.audienceSize ? "default" : "outline"}>
                Audience Size {formData.audienceSize ? "✓" : ""}
              </Badge>
              <Badge
                variant={
                  formData.audienceType && formData.audienceType.length > 0
                    ? "default"
                    : "outline"
                }
              >
                Audience Type{" "}
                {formData.audienceType && formData.audienceType.length > 0
                  ? "✓"
                  : ""}
              </Badge>
              <Badge variant={formData.readingLevel ? "default" : "outline"}>
                Reading Level {formData.readingLevel ? "✓" : ""}
              </Badge>
              <Badge
                variant={
                  formData.goals && formData.goals.length > 0
                    ? "default"
                    : "outline"
                }
              >
                Goals {formData.goals && formData.goals.length > 0 ? "✓" : ""}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
