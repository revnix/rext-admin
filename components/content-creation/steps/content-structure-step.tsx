"use client";

import { CheckCircle, FileText, Hash, List, Mouse, Search } from "lucide-react";
import { useCallback, useMemo } from "react";
import {
  KeywordTagInput,
  MultiSelectCheckboxGrid,
} from "@/components/content-creation/fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import type { WizardDependencyEngine } from "@/lib/content-creation/dependency-engine";
import {
  getContentLengthOptions,
  SEARCH_INTENT_OPTIONS,
} from "@/lib/content-creation/wizard-config";
import type {
  ContentCreationFormData,
  WizardStepProps,
} from "@/types/content-creation";

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
  // Get visible fields for this step
  const visibleFields = dependencyEngine.getVisibleFields(step);

  // Get content length options based on content type
  const contentLengthOptions = useMemo(
    () => getContentLengthOptions(formData.contentType),
    [formData.contentType],
  );

  // Handle content length selection
  const handleLengthPresetChange = useCallback(
    (preset: string) => {
      const newLength = { type: "preset" as const, preset };
      onFieldChange("contentLength", newLength);
      onFieldTouch("contentLength");
    },
    [onFieldChange, onFieldTouch],
  );

  // Handle custom content length
  const handleCustomLength = useCallback(() => {
    const customValue = prompt("Enter custom word count:");
    if (customValue && !Number.isNaN(Number(customValue))) {
      const newLength = {
        type: "custom" as const,
        custom: {
          value: Number(customValue),
          unit: "words" as const,
        },
      };
      onFieldChange("contentLength", newLength);
      onFieldTouch("contentLength");
    }
  }, [onFieldChange, onFieldTouch]);

  // Handle toggle changes
  const handleToggleChange = (fieldId: string, checked: boolean) => {
    onFieldChange(fieldId as keyof ContentCreationFormData, checked);
    onFieldTouch(fieldId as keyof ContentCreationFormData);
  };

  // Check field visibility
  const contentLengthField = visibleFields.find(
    (f) => f.id === "contentLength",
  );
  const primaryKeywordsField = visibleFields.find(
    (f) => f.id === "primaryKeywords",
  );
  const searchIntentField = visibleFields.find((f) => f.id === "searchIntent");
  const includeTOCField = visibleFields.find((f) => f.id === "includeTOC");
  const includeSummaryField = visibleFields.find(
    (f) => f.id === "includeSummary",
  );
  const includeCTAField = visibleFields.find((f) => f.id === "includeCTA");
  const includeKeyTakeawaysField = visibleFields.find(
    (f) => f.id === "includeKeyTakeaways",
  );

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
          <Card
            className={`transition-colors ${errors.contentLength && touched.contentLength ? "border-destructive" : ""}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                How long should it be?
              </CardTitle>
              <CardDescription>
                Choose a preset length or specify custom requirements
                {formData.contentType && ` for ${formData.contentType}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                options={contentLengthOptions.map((option) => ({
                  label: option.label,
                  value: option.value,
                  description: option.description,
                }))}
                value={
                  formData.contentLength?.type === "preset"
                    ? formData.contentLength.preset
                    : ""
                }
                onValueChange={handleLengthPresetChange}
                columns={2}
              />

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleCustomLength}
                  type="button"
                >
                  Set Custom Length
                </Button>
                {formData.contentLength?.type === "custom" &&
                  formData.contentLength.custom && (
                    <Alert className="flex-1">
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Custom:</strong>{" "}
                        {formData.contentLength.custom.value}{" "}
                        {formData.contentLength.custom.unit}
                      </AlertDescription>
                    </Alert>
                  )}
              </div>

              {errors.contentLength && touched.contentLength && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.contentLength}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
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
                metadata.originalSuggestedDefaults as any;
              const suggestions: string[] = [];

              // Add secondary keywords if available
              if (
                suggestedDefaults.secondaryKeywords &&
                Array.isArray(suggestedDefaults.secondaryKeywords)
              ) {
                suggestions.push(...suggestedDefaults.secondaryKeywords);
              }

              // Add long tail keywords from content guidance if available
              if (
                suggestedDefaults.content_guidance?.seo_opportunities
                  ?.long_tail_keywords &&
                Array.isArray(
                  suggestedDefaults.content_guidance.seo_opportunities
                    .long_tail_keywords,
                )
              ) {
                suggestions.push(
                  ...suggestedDefaults.content_guidance.seo_opportunities
                    .long_tail_keywords,
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Content Structure
            </CardTitle>
            <CardDescription>
              Choose additional sections to include in your content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
          </CardContent>
        </Card>

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
