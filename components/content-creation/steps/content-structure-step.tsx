"use client";

import { CheckCircle, FileText, Hash, List, Mouse, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  KeywordTagInput,
  MultiSelectCheckboxGrid,
} from "@/components/content-creation/fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WizardDependencyEngine } from "@/lib/content-creation/dependency-engine";
import {
  getContentLengthOptions,
  SEARCH_INTENT_OPTIONS,
} from "@/lib/content-creation/wizard-config";
import type {
  ContentCreationFormData,
  WizardStepProps,
} from "@/types/content-creation";
import { QuestionAnswerLayout } from "../layouts/question-answer-layout";

interface ContentStructureStepProps extends WizardStepProps {
  dependencyEngine: WizardDependencyEngine;
}

/**
 * Step 4: Content Structure Component
 *
 * This step handles:
 * - Content length selection (preset or custom)
 * - Primary keywords tag input
 * - Search intent multi-selection (conditional on SEO goal)
 * - Structure toggles (TOC, Summary, CTA, Key Takeaways)
 */
export function ContentStructureStep({
  step,
  formData,
  errors,
  touched,
  isActive: _isActive,
  onFieldChange,
  onFieldTouch,
  dependencyEngine,
}: ContentStructureStepProps) {
  // State for custom length input
  const [showCustomInput, setShowCustomInput] = useState(
    formData.contentLength?.type === "custom",
  );
  const [customValue, setCustomValue] = useState<number>(
    formData.contentLength?.custom?.value || 500,
  );
  const [customUnit, setCustomUnit] = useState<
    "words" | "characters" | "tweets"
  >(formData.contentLength?.custom?.unit || "words");

  // Get visible fields for this step
  const visibleFields = dependencyEngine.getVisibleFields(step);

  // Get field references
  const contentLengthField = visibleFields.find(
    (f) => f.id === "contentLength",
  );
  const primaryKeywordsField = visibleFields.find(
    (f) => f.id === "primaryKeywords",
  );
  const searchIntentField = visibleFields.find((f) => f.id === "searchIntent");
  const structureFields = {
    includeTOC: visibleFields.find((f) => f.id === "includeTOC"),
    includeSummary: visibleFields.find((f) => f.id === "includeSummary"),
    includeCTA: visibleFields.find((f) => f.id === "includeCTA"),
    includeKeyTakeaways: visibleFields.find(
      (f) => f.id === "includeKeyTakeaways",
    ),
  };

  // Get content length options based on content type
  const contentLengthOptions = useMemo(
    () => getContentLengthOptions(formData.contentType),
    [formData.contentType],
  );

  // Get available units based on content type
  const availableUnits = useMemo(() => {
    const baseUnits = ["words", "characters"];
    if (formData.contentType === "Thread" || formData.contentType === "Post") {
      return [...baseUnits, "tweets"];
    }
    return baseUnits;
  }, [formData.contentType]);

  // Extended options including custom
  const extendedLengthOptions = useMemo(
    () => [
      ...contentLengthOptions,
      {
        label: "Custom",
        value: "custom",
        description: "Set your own length requirements",
      },
    ],
    [contentLengthOptions],
  );

  // Handle content length selection (both preset and custom)
  const handleLengthOptionChange = useCallback(
    (value: string) => {
      if (value === "custom") {
        setShowCustomInput(true);
        // Set initial custom length if not already set
        const newLength = {
          type: "custom" as const,
          custom: {
            value: customValue,
            unit: customUnit,
          },
        };
        onFieldChange("contentLength", newLength);
        onFieldTouch("contentLength");
      } else {
        setShowCustomInput(false);
        const newLength = { type: "preset" as const, preset: value };
        onFieldChange("contentLength", newLength);
        onFieldTouch("contentLength");
      }
    },
    [customValue, customUnit, onFieldChange, onFieldTouch],
  );

  // Handle custom value changes
  const handleCustomValueChange = useCallback(
    (value: string) => {
      const numValue = parseInt(value, 10);
      if (!Number.isNaN(numValue) && numValue > 0) {
        setCustomValue(numValue);
        const newLength = {
          type: "custom" as const,
          custom: {
            value: numValue,
            unit: customUnit,
          },
        };
        onFieldChange("contentLength", newLength);
        onFieldTouch("contentLength");
      }
    },
    [customUnit, onFieldChange, onFieldTouch],
  );

  // Handle custom unit changes
  const handleCustomUnitChange = useCallback(
    (unit: "words" | "characters" | "tweets") => {
      setCustomUnit(unit);
      const newLength = {
        type: "custom" as const,
        custom: {
          value: customValue,
          unit,
        },
      };
      onFieldChange("contentLength", newLength);
      onFieldTouch("contentLength");
    },
    [customValue, onFieldChange, onFieldTouch],
  );

  // Handle toggle changes
  const handleToggleChange = (fieldId: string, checked: boolean) => {
    onFieldChange(fieldId as keyof ContentCreationFormData, checked);
    onFieldTouch(fieldId as keyof ContentCreationFormData);
  };

  // Use fields from structureFields object
  const includeTOCField = structureFields.includeTOC;
  const includeSummaryField = structureFields.includeSummary;
  const includeCTAField = structureFields.includeCTA;
  const includeKeyTakeawaysField = structureFields.includeKeyTakeaways;

  // Check if search intent should be visible (based on SEO goal)
  const showSearchIntent = formData.goals?.includes("Drive SEO");

  // Check if TOC/Summary should be visible (based on content length)
  const showStructureOptions = () => {
    if (formData.contentLength?.type === "preset") {
      return ["Medium", "Long"].includes(formData.contentLength.preset || "");
    }
    return true; // Show for custom length
  };

  // Check if CTA should be visible (based on goals)
  const showCTA = formData.goals?.some((goal) =>
    ["Promote", "Persuade"].includes(goal),
  );

  // Get current selected value for radio group
  const currentLengthValue = useMemo(() => {
    if (formData.contentLength?.type === "preset") {
      return formData.contentLength.preset;
    } else if (formData.contentLength?.type === "custom") {
      return "custom";
    }
    return "";
  }, [formData.contentLength]);

  // Validation for custom input
  const customValueError = useMemo(() => {
    if (showCustomInput && (customValue < 1 || customValue > 10000)) {
      return "Length must be between 1 and 10,000";
    }
    return null;
  }, [showCustomInput, customValue]);

  return (
    <div className="space-y-8 w-full">
      {/* Step header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{step.title}</h2>
        <p className="text-muted-foreground mt-2">{step.description}</p>
      </div>

      <div className="grid gap-8 w-full">
        {/* Content Length Selection */}
        {contentLengthField && (
          <QuestionAnswerLayout
            question={{
              label: "How long should it be?",
              description:
                "Choose a preset length or specify custom requirements",
              icon: FileText,
            }}
            isAutoFilled={
              formData._topicPrefillingMetadata?.prefilledFields
                ?.contentLength || false
            }
            isModified={touched.contentLength || false}
            hasError={!!(errors.contentLength && touched.contentLength)}
            error={errors.contentLength}
          >
            <div className="space-y-4">
              {formData.contentType && (
                <div className="text-sm text-muted-foreground">
                  For {formData.contentType}
                </div>
              )}

              <RadioGroup
                options={extendedLengthOptions.map((option) => ({
                  label: option.label,
                  value: option.value,
                  description: option.description,
                }))}
                value={currentLengthValue}
                onValueChange={handleLengthOptionChange}
                columns={2}
              />

              {/* Inline Custom Length Input */}
              {showCustomInput && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">
                      Custom Length Settings
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom-length-value" className="text-sm">
                        Length
                      </Label>
                      <Input
                        id="custom-length-value"
                        type="number"
                        min="1"
                        max="10000"
                        value={customValue}
                        onChange={(e) =>
                          handleCustomValueChange(e.target.value)
                        }
                        placeholder="Enter length..."
                        className={customValueError ? "border-destructive" : ""}
                      />
                      {customValueError && (
                        <p className="text-sm text-destructive">
                          {customValueError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom-length-unit" className="text-sm">
                        Unit
                      </Label>
                      <Select
                        value={customUnit}
                        onValueChange={handleCustomUnitChange}
                      >
                        <SelectTrigger id="custom-length-unit">
                          <SelectValue placeholder="Select unit..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit.charAt(0).toUpperCase() + unit.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Custom Length Preview */}
                  {customValue > 0 && !customValueError && (
                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Preview:</strong> {customValue} {customUnit}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </QuestionAnswerLayout>
        )}

        {/* Primary Keywords */}
        {primaryKeywordsField && (
          <KeywordTagInput
            value={formData.primaryKeywords}
            label="Primary Keywords"
            description="Main keywords for SEO (optional, suggestions based on selected topic)"
            placeholder="Enter keywords..."
            maxKeywords={10}
            icon={Hash}
            error={errors.primaryKeywords}
            touched={touched.primaryKeywords}
            topicSuggestions={(() => {
              // Extract keyword suggestions from topic data
              const metadata = formData._topicPrefillingMetadata;
              if (!metadata?.originalSuggestedDefaults) return [];

              const suggestedDefaults =
                metadata.originalSuggestedDefaults as Record<string, unknown>;
              const suggestions: string[] = [];

              // Add secondary keywords if available
              if (
                suggestedDefaults.secondaryKeywords &&
                Array.isArray(suggestedDefaults.secondaryKeywords)
              ) {
                suggestions.push(...suggestedDefaults.secondaryKeywords);
              }

              // Add long tail keywords from content guidance if available
              const contentGuidance = suggestedDefaults.content_guidance as
                | {
                    seo_opportunities?: {
                      long_tail_keywords?: string[];
                    };
                  }
                | undefined;

              if (
                contentGuidance?.seo_opportunities?.long_tail_keywords &&
                Array.isArray(
                  contentGuidance.seo_opportunities.long_tail_keywords,
                )
              ) {
                suggestions.push(
                  ...contentGuidance.seo_opportunities.long_tail_keywords,
                );
              }

              // Remove duplicates and limit to 6-8 suggestions
              return [...new Set(suggestions)].slice(0, 8);
            })()}
            onChange={(keywords) => {
              onFieldChange("primaryKeywords", keywords);
              onFieldTouch("primaryKeywords");
            }}
            onTouch={() => onFieldTouch("primaryKeywords")}
          />
        )}

        {/* Search Intent (conditional) */}
        {searchIntentField && showSearchIntent && (
          <MultiSelectCheckboxGrid
            value={formData.searchIntent}
            options={SEARCH_INTENT_OPTIONS}
            label="Search Intent"
            description="What are users looking for when they search? (Select all that apply)"
            maxSelections={5}
            columns={2}
            icon={Search}
            error={errors.searchIntent}
            touched={touched.searchIntent}
            showCount={true}
            onChange={(intents) => {
              onFieldChange("searchIntent", intents);
              onFieldTouch("searchIntent");
            }}
            onTouch={() => onFieldTouch("searchIntent")}
          />
        )}

        {/* Content Structure Options */}
        {(structureFields.includeTOC ||
          structureFields.includeSummary ||
          structureFields.includeCTA ||
          structureFields.includeKeyTakeaways) && (
          <QuestionAnswerLayout
            question={{
              label: "Content Structure",
              description:
                "Choose additional sections to include in your content",
              icon: List,
            }}
          >
            <div className="space-y-6">
              {/* Table of Contents (conditional) */}
              {includeTOCField && showStructureOptions() && (
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="includeTOC"
                    checked={formData.includeTOC || false}
                    onCheckedChange={(checked) =>
                      handleToggleChange("includeTOC", !!checked)
                    }
                  />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="includeTOC"
                      className="font-medium cursor-pointer"
                    >
                      Include Table of Contents
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add a table of contents for longer content
                    </p>
                  </div>
                </div>
              )}

              {/* Summary (conditional) */}
              {includeSummaryField && showStructureOptions() && (
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="includeSummary"
                    checked={formData.includeSummary || false}
                    onCheckedChange={(checked) =>
                      handleToggleChange("includeSummary", !!checked)
                    }
                  />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="includeSummary"
                      className="font-medium cursor-pointer"
                    >
                      Include Summary
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add an executive summary at the beginning
                    </p>
                  </div>
                </div>
              )}

              {/* Call-to-Action (conditional) */}
              {includeCTAField && showCTA && (
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="includeCTA"
                    checked={formData.includeCTA || false}
                    onCheckedChange={(checked) =>
                      handleToggleChange("includeCTA", !!checked)
                    }
                  />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="includeCTA"
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      <Mouse className="h-4 w-4" />
                      Include Call-to-Action
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add a call-to-action section (recommended for promotional
                      content)
                    </p>
                  </div>
                </div>
              )}

              {/* Key Takeaways */}
              {includeKeyTakeawaysField && (
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="includeKeyTakeaways"
                    checked={formData.includeKeyTakeaways || false}
                    onCheckedChange={(checked) =>
                      handleToggleChange("includeKeyTakeaways", !!checked)
                    }
                  />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="includeKeyTakeaways"
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Include Key Takeaways
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add a key takeaways section to summarize main points
                    </p>
                  </div>
                </div>
              )}
            </div>
          </QuestionAnswerLayout>
        )}

        {/* Smart Recommendations */}
        {(formData.contentLength || formData.goals?.length) && (
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 text-sm">
                💡 Smart Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {formData.contentLength?.type === "preset" &&
                formData.contentLength.preset === "Long" && (
                  <p className="text-blue-800 dark:text-blue-200">
                    • For long content, consider enabling Table of Contents and
                    Summary
                  </p>
                )}
              {formData.goals?.includes("Drive SEO") && (
                <p className="text-blue-800 dark:text-blue-200">
                  • SEO-focused content benefits from primary keywords and clear
                  search intent
                </p>
              )}
              {showCTA && (
                <p className="text-blue-800 dark:text-blue-200">
                  • Your promotional goals suggest including a call-to-action
                </p>
              )}
              {formData.goals?.includes("Educate") && (
                <p className="text-blue-800 dark:text-blue-200">
                  • Educational content works well with key takeaways and
                  summaries
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Progress summary for this step */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Step 4 Progress:</span>
            <div className="flex items-center gap-4">
              <Badge variant={formData.contentLength ? "default" : "outline"}>
                Length {formData.contentLength ? "✓" : ""}
              </Badge>
              <Badge
                variant={
                  formData.primaryKeywords &&
                  formData.primaryKeywords.length > 0
                    ? "default"
                    : "outline"
                }
              >
                Keywords{" "}
                {formData.primaryKeywords && formData.primaryKeywords.length > 0
                  ? `(${formData.primaryKeywords.length})`
                  : ""}
              </Badge>
              <Badge variant="outline">Structure Options</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
