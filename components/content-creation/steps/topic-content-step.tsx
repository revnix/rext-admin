"use client";

import { Building2, FileText, Globe } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTopics } from "@/hooks/use-topics";
import type { WizardDependencyEngine } from "@/lib/content-creation/dependency-engine";
import {
  getContentTypeOptions,
  INDUSTRY_OPTIONS,
  PLATFORM_OPTIONS,
} from "@/lib/content-creation/wizard-config";
import type { WizardAction, WizardStepProps } from "@/types/content-creation";
import type { GeneratedTopic } from "@/types/topic-builder";
import { AutoFilledFieldWrapper } from "../fields/auto-filled-field-wrapper";
import { TopicSelector } from "../fields/topic-selector";

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
  // Fetch topics from API
  const { data: topics = [] } = useTopics();

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
          <AutoFilledFieldWrapper
            isAutoFilled={
              formData._topicPrefillingMetadata?.prefilledFields?.platform ||
              false
            }
            isModified={touched.platform || false}
            label="Select Platform"
            description="Where will this content be published?"
            icon={<Globe className="h-5 w-5 text-primary" />}
            className={
              errors.platform && touched.platform ? "wizard-card-error" : ""
            }
            errorContent={
              errors.platform && touched.platform ? (
                <div className="wizard-field-error mt-4">
                  <Globe className="h-4 w-4" />
                  {errors.platform}
                </div>
              ) : undefined
            }
          >
            <RadioGroup
              options={PLATFORM_OPTIONS}
              value={formData.platform || ""}
              onValueChange={handlePlatformChange}
              columns={2}
            />
          </AutoFilledFieldWrapper>
        )}

        {/* Enhanced Content Type Selection */}
        {contentTypeField && formData.platform && (
          <Card
            className={`wizard-card ${errors.contentType && touched.contentType ? "wizard-card-error" : ""}`}
          >
            <CardHeader className="pb-4">
              <CardTitle className="wizard-field-label">
                <FileText className="h-5 w-5 text-primary" />
                Content Type
              </CardTitle>
              <CardDescription className="wizard-field-description">
                What type of content do you want to create?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                options={contentTypeOptions}
                value={formData.contentType || ""}
                onValueChange={(value) => {
                  onFieldChange("contentType", value);
                  onFieldTouch("contentType");
                }}
                columns={1}
              />

              {errors.contentType && touched.contentType && (
                <div className="wizard-field-error mt-4">
                  <FileText className="h-4 w-4" />
                  {errors.contentType}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Enhanced Industry Selection */}
        {industryField && (
          <AutoFilledFieldWrapper
            isAutoFilled={
              formData._topicPrefillingMetadata?.prefilledFields?.industry ||
              false
            }
            isModified={touched.industry || false}
            label="Industry"
            description="Your business industry (pre-filled from topic but can be changed)"
            icon={<Building2 className="h-5 w-5 text-primary" />}
            className={
              errors.industry && touched.industry ? "wizard-card-error" : ""
            }
            errorContent={
              errors.industry && touched.industry ? (
                <div className="wizard-field-error mt-4">
                  <Building2 className="h-4 w-4" />
                  {errors.industry}
                </div>
              ) : undefined
            }
          >
            <Select
              value={formData.industry || ""}
              onValueChange={(value) => {
                onFieldChange("industry", value);
                onFieldTouch("industry");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your industry..." />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AutoFilledFieldWrapper>
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
