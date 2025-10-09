"use client";

import { Globe, Languages, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WizardDependencyEngine } from "@/lib/content-creation/dependency-engine";
import {
  getToneOptions,
  LANGUAGE_OPTIONS,
  REGION_OPTIONS,
} from "@/lib/content-creation/wizard-config";
import type { WizardStepProps } from "@/types/content-creation";
import { OptionGridLayout } from "../layouts/option-grid-layout";
import { QuestionAnswerLayout } from "../layouts/question-answer-layout";

interface VoiceStyleStepProps extends WizardStepProps {
  dependencyEngine: WizardDependencyEngine;
}

/**
 * Step 3: Voice & Style Component
 *
 * This step handles:
 * - Tone multi-selection (dynamically filtered based on audience and reading level)
 * - Target region selection
 * - Language selection
 */
export function VoiceStyleStep({
  step,
  formData,
  errors,
  touched,
  isActive: _isActive,
  onFieldChange,
  onFieldTouch,
  dependencyEngine,
}: VoiceStyleStepProps) {
  // Get visible fields for this step
  const visibleFields = dependencyEngine.getVisibleFields(step);

  const toneField = visibleFields.find((f) => f.id === "tone");
  const regionField = visibleFields.find((f) => f.id === "region");
  const languageField = visibleFields.find((f) => f.id === "language");

  // Custom region input state
  const [showCustomRegionInput, setShowCustomRegionInput] = useState(
    formData.region === "Other" ||
      (formData.region && formData.region !== "International/Global"),
  );
  const [customRegion, setCustomRegion] = useState(
    formData.region &&
      formData.region !== "International/Global" &&
      formData.region !== "Other"
      ? formData.region
      : "",
  );

  // Set default values on mount
  useEffect(() => {
    if (!formData.region) {
      onFieldChange("region", "International/Global");
    }
    if (!formData.language) {
      onFieldChange("language", "English");
    }
  }, [formData.region, formData.language, onFieldChange]);

  // Get tone options based on audience type and reading level
  const toneOptions = useMemo(
    () => getToneOptions(formData.audienceType, formData.readingLevel),
    [formData.audienceType, formData.readingLevel],
  );

  // Handle tone multi-select
  const handleToneChange = useCallback(
    (tone: string, isChecked: boolean) => {
      const currentTones = formData.tone || [];

      if (isChecked) {
        // Add if under limit (max 3)
        if (currentTones.length < 3) {
          const newTones = [...currentTones, tone];
          onFieldChange("tone", newTones);
        }
      } else {
        // Remove
        const newTones = currentTones.filter((t) => t !== tone);
        onFieldChange("tone", newTones);
      }

      onFieldTouch("tone");
    },
    [formData.tone, onFieldChange, onFieldTouch],
  );

  // Smart suggestions based on context
  const getSmartSuggestions = useMemo(() => {
    const suggestions = [];

    if (formData.audienceType?.includes("Enterprises")) {
      suggestions.push(
        "Consider Professional or Technical tone for enterprise audience",
      );
    }

    if (formData.audienceType?.includes("Students")) {
      suggestions.push(
        "Friendly and Simple tones work well for student audiences",
      );
    }

    if (formData.goals?.includes("Inspire")) {
      suggestions.push(
        "Inspirational tone aligns with your goal to inspire readers",
      );
    }

    if (formData.readingLevel === "Beginner") {
      suggestions.push("Simple tone recommended for beginner reading level");
    }

    return suggestions;
  }, [formData.audienceType, formData.goals, formData.readingLevel]);

  const smartSuggestions = getSmartSuggestions;

  return (
    <div className="space-y-8 w-full">
      {/* Step header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{step.title}</h2>
        <p className="text-muted-foreground mt-2">{step.description}</p>
      </div>

      <div className="grid gap-8 w-full">
        {/* Tone Multi-Selection */}
        {toneField && (
          <QuestionAnswerLayout
            question={{
              label: "How should it sound?",
              description:
                "Select up to 3 tones that match your brand and audience",
              icon: MessageSquare,
            }}
            isAutoFilled={
              formData._topicPrefillingMetadata?.prefilledFields?.tone || false
            }
            isModified={touched.tone || false}
            hasError={!!(errors.tone && touched.tone)}
            error={errors.tone}
          >
            <div className="space-y-4">
              {formData.audienceType && formData.audienceType.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Suggestions based on your {formData.audienceType.join(", ")}{" "}
                  audience
                  {formData.readingLevel &&
                    ` and ${formData.readingLevel} reading level`}
                </div>
              )}

              <OptionGridLayout>
                {toneOptions.map((option) => {
                  const isSelected =
                    formData.tone?.includes(option.value) || false;
                  const isDisabled =
                    !isSelected && (formData.tone?.length || 0) >= 3;

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
                          handleToneChange(option.value, e.target.checked)
                        }
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="font-medium text-sm">
                        {option.label}
                      </span>
                    </Label>
                  );
                })}
              </OptionGridLayout>

              {/* Smart suggestions */}
              {smartSuggestions.length > 0 && (
                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    <strong>AI Suggestions:</strong>
                    <ul className="mt-2 space-y-1">
                      {smartSuggestions.map((suggestion) => (
                        <li
                          key={suggestion}
                          className="text-sm text-muted-foreground"
                        >
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Selected tones preview */}
              {formData.tone && formData.tone.length > 0 && (
                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Selected tones:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tone.map((tone) => (
                        <Badge key={tone} variant="default" className="text-xs">
                          {tone}
                        </Badge>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground">
                {formData.tone?.length || 0} / 3 selected
                {formData.tone?.length === 0 && " (recommended: 1-3 tones)"}
              </div>
            </div>
          </QuestionAnswerLayout>
        )}

        {/* Location & Language Combined */}
        {(regionField || languageField) && (
          <QuestionAnswerLayout
            question={{
              label: "Location & Language",
              description: "Geographic focus and content language settings",
              icon: Globe,
            }}
            hasError={
              !!(
                (errors.region && touched.region) ||
                (errors.language && touched.language)
              )
            }
            error={
              (errors.region && touched.region && errors.region) ||
              (errors.language && touched.language && errors.language) ||
              undefined
            }
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Target Region */}
                {regionField && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Target Region
                    </Label>
                    <Select
                      value={
                        showCustomRegionInput && customRegion
                          ? "Other"
                          : formData.region || "International/Global"
                      }
                      onValueChange={(value) => {
                        if (value === "Other") {
                          setShowCustomRegionInput(true);
                          // Don't set region yet, wait for user to type
                          if (customRegion) {
                            onFieldChange("region", customRegion);
                          }
                        } else {
                          // User selected International/Global or another option
                          setShowCustomRegionInput(false);
                          setCustomRegion("");
                          onFieldChange("region", value);
                          onFieldTouch("region");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target region..." />
                      </SelectTrigger>
                      <SelectContent>
                        {REGION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {showCustomRegionInput && (
                      <Input
                        id="custom-region"
                        value={customRegion}
                        placeholder="Enter country/region name"
                        onChange={(e) => {
                          const value = e.target.value;
                          setCustomRegion(value);
                          onFieldChange("region", value);
                        }}
                        onBlur={() => onFieldTouch("region")}
                      />
                    )}
                  </div>
                )}

                {/* Language */}
                {languageField && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      Language
                    </Label>
                    <Select
                      value={formData.language || "English"}
                      onValueChange={(value) => {
                        // Prevent selecting disabled option
                        if (value !== "other") {
                          onFieldChange("language", value);
                          onFieldTouch("language");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language..." />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                          >
                            <div className="flex items-center gap-2">
                              <span>{option.label}</span>
                              {option.disabled && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] ml-auto"
                                >
                                  Coming Soon
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Regional context info */}
              {formData.region &&
                formData.region !== "International/Global" && (
                  <Alert>
                    <Globe className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Regional Focus:</strong> Content will be optimized
                      for {formData.region}, including local references,
                      examples, and cultural context where relevant.
                    </AlertDescription>
                  </Alert>
                )}

              {/* Language expansion note */}
              {formData.language && (
                <Alert>
                  <Languages className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Note:</strong> Additional languages will be
                    supported in future updates. Currently focusing on
                    high-quality English content generation.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </QuestionAnswerLayout>
        )}
      </div>

      {/* Progress summary for this step */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Step 3 Progress:</span>
            <div className="flex items-center gap-4">
              <Badge
                variant={
                  formData.tone && formData.tone.length > 0
                    ? "default"
                    : "outline"
                }
              >
                Tone {formData.tone && formData.tone.length > 0 ? "✓" : ""}
              </Badge>
              <Badge variant={formData.region ? "default" : "outline"}>
                Region {formData.region ? "✓" : ""}
              </Badge>
              <Badge variant={formData.language ? "default" : "outline"}>
                Language {formData.language ? "✓" : ""}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
