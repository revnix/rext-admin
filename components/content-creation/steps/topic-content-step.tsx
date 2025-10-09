"use client";

import { Building2, FileText, Globe } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { useTopics } from "@/hooks/use-topics";
import type { WizardDependencyEngine } from "@/lib/content-creation/dependency-engine";
import {
  getContentTypeOptions,
  INDUSTRY_OPTIONS,
  PLATFORM_OPTIONS,
} from "@/lib/content-creation/wizard-config";
import { useCurrentWorkspace } from "@/stores/workspace-store";
import type { WizardAction, WizardStepProps } from "@/types/content-creation";
import type { GeneratedTopic } from "@/types/topic-builder";
import { TopicSelector } from "../fields/topic-selector";
import { QuestionAnswerLayout } from "../layouts/question-answer-layout";

interface TopicContentStepProps extends WizardStepProps {
  dependencyEngine: WizardDependencyEngine;
  dispatch: React.Dispatch<WizardAction>;
}

/**
 * Step 1: Topic & Content Type Component
 *
 * This step handles:
 * - Topic selection with search functionality
 * - Platform selection (Website/Social Media)
 * - Content type selection (dependent on platform)
 * - Industry selection (pre-filled from topic but editable)
 */
export function TopicContentStep({
  step,
  formData,
  errors,
  touched,
  isActive: _isActive,
  onFieldChange,
  onFieldTouch,
  dependencyEngine,
  dispatch,
}: TopicContentStepProps) {
  const currentWorkspace = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id || "";

  // Fetch topics from API
  const { data: topics = [] } = useTopics(workspaceId);

  // Create stable references for callbacks to avoid dependency loops
  const onFieldChangeRef = useRef(onFieldChange);
  const onFieldTouchRef = useRef(onFieldTouch);

  // Keep refs updated
  useEffect(() => {
    onFieldChangeRef.current = onFieldChange;
    onFieldTouchRef.current = onFieldTouch;
  });

  // Get visible fields for this step
  const visibleFields = dependencyEngine.getVisibleFields(step);

  const topicField = visibleFields.find((f) => f.id === "topicId");
  const platformField = visibleFields.find((f) => f.id === "platform");
  const contentTypeField = visibleFields.find((f) => f.id === "contentType");
  const industryField = visibleFields.find((f) => f.id === "industry");

  // Get content type options based on selected platform
  const contentTypeOptions = useMemo(() => {
    return formData.platform
      ? getContentTypeOptions(formData.platform as "Website" | "Social Media")
      : [];
  }, [formData.platform]);

  // Ensure default content type is selected when available
  useEffect(() => {
    if (!contentTypeField || formData.contentType) {
      return;
    }

    const enabledOptions = contentTypeOptions.filter(
      (option) => !option.disabled,
    );
    if (enabledOptions.length === 0) {
      return;
    }

    const preferredDefault = contentTypeField.defaultValue;
    const hasPreferredDefault = preferredDefault
      ? enabledOptions.some((option) => option.value === preferredDefault)
      : false;

    const fallbackValue = hasPreferredDefault
      ? preferredDefault
      : enabledOptions[0]?.value;

    if (fallbackValue) {
      onFieldChangeRef.current("contentType", fallbackValue);
    }
  }, [contentTypeField, contentTypeOptions, formData.contentType]);

  // Handle topic selection
  const handleTopicSelect = useCallback(
    async (topic: GeneratedTopic) => {
      onFieldChangeRef.current("topicId", topic.id);
      onFieldTouchRef.current("topicId");

      // Dispatch pre-fill action with topic data
      dispatch({
        type: "PREFILL_FROM_TOPIC",
        payload: {
          topicData: topic,
          suggestedDefaults: topic.suggested_defaults,
          userSettings: undefined, // user_settings not implemented yet
        },
      });
    },
    [dispatch],
  );

  // Handle platform change
  const handlePlatformChange = useCallback(
    (platform: string) => {
      onFieldChangeRef.current("platform", platform);
      onFieldTouchRef.current("platform");

      // Clear content type if platform changed
      const newContentTypeOptions = getContentTypeOptions(
        platform as "Website" | "Social Media",
      );
      const isCurrentTypeValid = newContentTypeOptions.some(
        (option) => option.value === formData.contentType,
      );

      if (!isCurrentTypeValid) {
        onFieldChangeRef.current("contentType", "");
      }
    },
    [formData.contentType], // Keep contentType dependency as it's used in comparison
  );

  const selectedTopic = formData.topicId
    ? topics.find((t) => t.id === formData.topicId)
    : null;

  const industryOptions = industryField ? INDUSTRY_OPTIONS : [];
  const predefinedIndustryValues = useMemo(
    () => new Set(industryOptions.map((option) => option.value)),
    [industryOptions],
  );

  const [industrySelection, setIndustrySelection] = useState(() => {
    if (!industryField) return "";
    const currentValue = formData.industry || "";
    if (!currentValue) return "";
    return predefinedIndustryValues.has(currentValue) ? currentValue : "Other";
  });

  useEffect(() => {
    if (!industryField) {
      setIndustrySelection("");
      return;
    }

    const currentValue = formData.industry || "";
    if (!currentValue) {
      if (industrySelection === "Other") {
        return;
      }
      setIndustrySelection("");
      return;
    }

    const nextSelection = predefinedIndustryValues.has(currentValue)
      ? currentValue
      : "Other";

    if (nextSelection !== industrySelection) {
      setIndustrySelection(nextSelection);
    }
  }, [
    formData.industry,
    industryField,
    industrySelection,
    predefinedIndustryValues,
  ]);

  const showCustomIndustryInput = industrySelection === "Other";

  const handleIndustrySelect = useCallback(
    (value: string) => {
      setIndustrySelection(value);

      if (value === "Other") {
        const currentValue = formData.industry || "";
        const nextValue =
          currentValue && !predefinedIndustryValues.has(currentValue)
            ? currentValue
            : "";
        onFieldChangeRef.current("industry", nextValue);
      } else {
        onFieldChangeRef.current("industry", value);
      }

      onFieldTouchRef.current("industry");
    },
    [formData.industry, predefinedIndustryValues],
  );

  const handleCustomIndustryChange = useCallback((value: string) => {
    onFieldChangeRef.current("industry", value);
  }, []);

  const handleCustomIndustryBlur = useCallback(() => {
    onFieldTouchRef.current("industry");
  }, []);

  return (
    <div className="space-y-8 w-full">
      {/* Enhanced Step header */}
      <div className="wizard-section-header">
        <h2 className="wizard-section-title">{step.title}</h2>
        <p className="wizard-section-subtitle">{step.description}</p>
      </div>

      <div className="grid gap-8 w-full">
        {/* Enhanced Topic Selection */}
        {topicField && (
          <TopicSelector
            selectedTopic={selectedTopic}
            onTopicSelect={handleTopicSelect}
            hasError={!!(errors.topicId && touched.topicId)}
            errorMessage={
              errors.topicId && touched.topicId ? errors.topicId : undefined
            }
          />
        )}

        {/* Enhanced Platform Selection */}
        {platformField && (
          <QuestionAnswerLayout
            question={{
              label: "Select Platform",
              description: "Where will this content be published?",
              icon: Globe,
            }}
            isAutoFilled={
              formData._topicPrefillingMetadata?.prefilledFields?.platform ||
              false
            }
            isModified={touched.platform || false}
            hasError={!!(errors.platform && touched.platform)}
            error={errors.platform}
          >
            <RadioGroup
              options={PLATFORM_OPTIONS}
              value={formData.platform || ""}
              onValueChange={handlePlatformChange}
              columns={2}
            />
          </QuestionAnswerLayout>
        )}

        {/* Enhanced Content Type Selection */}
        {contentTypeField && formData.platform && (
          <QuestionAnswerLayout
            question={{
              label: "Content Type",
              description: "What type of content do you want to create?",
              icon: FileText,
            }}
            hasError={!!(errors.contentType && touched.contentType)}
            error={errors.contentType}
          >
            <RadioGroup
              options={contentTypeOptions}
              value={formData.contentType || ""}
              onValueChange={(value) => {
                onFieldChange("contentType", value);
                onFieldTouch("contentType");
              }}
              columns={3}
            />
          </QuestionAnswerLayout>
        )}

        {/* Enhanced Industry Selection */}
        {industryField && (
          <QuestionAnswerLayout
            question={{
              label: "Industry",
              description: "Your business industry",
              icon: Building2,
            }}
            isAutoFilled={
              formData._topicPrefillingMetadata?.prefilledFields?.industry ||
              false
            }
            isModified={touched.industry || false}
            hasError={!!(errors.industry && touched.industry)}
            error={errors.industry}
          >
            <div className="space-y-4">
              <RadioGroup
                options={industryOptions}
                value={industrySelection}
                onValueChange={handleIndustrySelect}
                columns={3}
              />

              {showCustomIndustryInput && (
                <div className="grid gap-2">
                  <Label
                    htmlFor="custom-industry"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Specify your industry
                  </Label>
                  <Input
                    id="custom-industry"
                    value={formData.industry || ""}
                    placeholder="Enter your industry"
                    onChange={(event) =>
                      handleCustomIndustryChange(event.target.value)
                    }
                    onBlur={handleCustomIndustryBlur}
                  />
                </div>
              )}
            </div>
          </QuestionAnswerLayout>
        )}
      </div>

      {/* Progress summary for this step */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Step 1 Progress:</span>
            <div className="flex items-center gap-4">
              <Badge variant={formData.topicId ? "default" : "outline"}>
                Topic {formData.topicId ? "✓" : ""}
              </Badge>
              <Badge variant={formData.platform ? "default" : "outline"}>
                Platform {formData.platform ? "✓" : ""}
              </Badge>
              <Badge variant={formData.contentType ? "default" : "outline"}>
                Content Type {formData.contentType ? "✓" : ""}
              </Badge>
              <Badge variant={formData.industry ? "default" : "outline"}>
                Industry {formData.industry ? "✓" : ""}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
