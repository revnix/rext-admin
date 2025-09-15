"use client";

import { Globe, Languages, MessageSquare } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
          <Card
            className={`transition-colors ${errors.tone && touched.tone ? "border-destructive" : ""}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                How should it sound?
              </CardTitle>
              <CardDescription>
                Select up to 3 tones that match your brand and audience
                {formData.audienceType && formData.audienceType.length > 0 && (
                  <span className="block mt-1 text-xs">
                    Suggestions based on your {formData.audienceType.join(", ")}{" "}
                    audience
                    {formData.readingLevel &&
                      ` and ${formData.readingLevel} reading level`}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {toneOptions.map((option) => {
                  const isSelected =
                    formData.tone?.includes(option.value) || false;
                  const isDisabled =
                    !isSelected && (formData.tone?.length || 0) >= 3;

                  // Check if this is a suggested tone (appears first in filtered results)
                  const isSuggested = toneOptions
                    .slice(0, 3)
                    .some((suggested) => suggested.value === option.value);

                  return (
                    <Label
                      key={option.value}
                      className={`relative flex items-center justify-center border rounded-lg p-3 cursor-pointer transition-colors ${
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
                        className="sr-only"
                      />
                      <div className="text-center">
                        <span className="font-medium text-sm">
                          {option.label}
                        </span>
                        {isSuggested && !isSelected && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </Label>
                  );
                })}
              </div>

              {/* Smart suggestions */}
              {smartSuggestions.length > 0 && (
                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    <strong>AI Suggestions:</strong>
                    <ul className="mt-2 space-y-1">
                      {smartSuggestions.map((suggestion, index) => (
                        <li
                          key={index}
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

              {errors.tone && touched.tone && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.tone}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Target Region Selection */}
        {regionField && (
          <Card
            className={`transition-colors ${errors.region && touched.region ? "border-destructive" : ""}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Target Region
              </CardTitle>
              <CardDescription>
                What geographic region should this content focus on?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.region || ""}
                onValueChange={(value) => {
                  onFieldChange("region", value);
                  onFieldTouch("region");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target region..." />
                </SelectTrigger>
                <SelectContent>
                  {REGION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.value === "International/Global" && (
                          <Globe className="h-4 w-4" />
                        )}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Region context info */}
              {formData.region &&
                formData.region !== "International/Global" && (
                  <Alert className="mt-4">
                    <Globe className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Regional Focus:</strong> Content will be optimized
                      for {formData.region}, including local references,
                      examples, and cultural context where relevant.
                    </AlertDescription>
                  </Alert>
                )}

              {errors.region && touched.region && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{errors.region}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Language Selection */}
        {languageField && (
          <Card
            className={`transition-colors ${errors.language && touched.language ? "border-destructive" : ""}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Language
              </CardTitle>
              <CardDescription>
                What language should the content be written in?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.language || ""}
                onValueChange={(value) => {
                  onFieldChange("language", value);
                  onFieldTouch("language");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language..." />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Note about language expansion */}
              <Alert className="mt-4">
                <Languages className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Additional languages will be supported
                  in future updates. Currently focusing on high-quality English
                  content generation.
                </AlertDescription>
              </Alert>

              {errors.language && touched.language && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{errors.language}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
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
