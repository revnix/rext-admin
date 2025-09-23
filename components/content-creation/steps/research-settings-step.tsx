"use client";

import {
  BarChart,
  Clock,
  Eye,
  Quote,
  Search,
  Shield,
  TrendingUp,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import type { WizardDependencyEngine } from "@/lib/content-creation/dependency-engine";
import {
  CONTENT_FRESHNESS_OPTIONS,
  FACT_CHECKING_OPTIONS,
  RESEARCH_LEVEL_OPTIONS,
} from "@/lib/content-creation/wizard-config";
import type {
  ContentCreationFormData,
  WizardStepProps,
} from "@/types/content-creation";
import { AutoFilledFieldWrapper } from "../fields/auto-filled-field-wrapper";
import { OptionGridLayout } from "../layouts/option-grid-layout";

interface ResearchSettingsStepProps extends WizardStepProps {
  dependencyEngine: WizardDependencyEngine;
}

/**
 * Step 5: Research Settings Component
 *
 * This step handles:
 * - Research level selection (Basic/Comprehensive/Expert)
 * - Content enhancement toggles (Latest Info, Examples, Statistics, Quotes)
 * - Quality control (Fact checking level, Content freshness)
 * - Advanced options (Competitor analysis)
 */
export function ResearchSettingsStep({
  step,
  formData,
  errors,
  touched,
  isActive: _isActive,
  onFieldChange,
  onFieldTouch,
  dependencyEngine,
}: ResearchSettingsStepProps) {
  // Get visible fields for this step
  const visibleFields = dependencyEngine.getVisibleFields(step);

  // Handle toggle changes
  const handleToggleChange = useCallback(
    (fieldId: string, checked: boolean) => {
      onFieldChange(fieldId as keyof ContentCreationFormData, checked);
      onFieldTouch(fieldId as keyof ContentCreationFormData);
    },
    [onFieldChange, onFieldTouch],
  );

  // Smart recommendations based on content goals and type
  const getSmartRecommendations = useMemo(() => {
    const recommendations = [];

    if (formData.goals?.includes("Educate")) {
      recommendations.push(
        "Educational content benefits from examples, statistics, and expert quotes",
      );
    }

    if (formData.goals?.includes("Drive SEO")) {
      recommendations.push(
        "SEO content should include latest information and competitor analysis",
      );
    }

    if (
      formData.contentType === "White Paper" ||
      formData.readingLevel === "Advanced"
    ) {
      recommendations.push(
        "Professional content requires comprehensive research and strict fact-checking",
      );
    }

    if (formData.goals?.includes("Thought Leadership")) {
      recommendations.push(
        "Thought leadership content needs latest trends and industry quotes",
      );
    }

    return recommendations;
  }, [formData.goals, formData.contentType, formData.readingLevel]);

  // Check field visibility
  const researchLevelField = visibleFields.find(
    (f) => f.id === "researchLevel",
  );
  const includeLatestInfoField = visibleFields.find(
    (f) => f.id === "includeLatestInfo",
  );
  const includeExamplesField = visibleFields.find(
    (f) => f.id === "includeExamples",
  );
  const factCheckingField = visibleFields.find((f) => f.id === "factChecking");
  const contentFreshnessField = visibleFields.find(
    (f) => f.id === "contentFreshness",
  );
  const includeStatisticsField = visibleFields.find(
    (f) => f.id === "includeStatistics",
  );
  const includeQuotesField = visibleFields.find(
    (f) => f.id === "includeQuotes",
  );
  const competitorAnalysisField = visibleFields.find(
    (f) => f.id === "competitorAnalysis",
  );

  return (
    <div className="space-y-8 w-full">
      {/* Step header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{step.title}</h2>
        <p className="text-muted-foreground mt-2">{step.description}</p>
      </div>

      <div className="grid gap-8 w-full">
        {/* Research Level Selection */}
        {researchLevelField && (
          <AutoFilledFieldWrapper
            isAutoFilled={
              formData._topicPrefillingMetadata?.prefilledFields
                ?.research_level || false
            }
            isModified={touched.researchLevel || false}
            label="Research Level"
            description="How thorough should the research be? Higher levels provide more comprehensive content but take longer."
            icon={<Search className="h-5 w-5 text-primary" />}
            className={
              errors.researchLevel && touched.researchLevel
                ? "wizard-card-error"
                : ""
            }
            errorContent={
              errors.researchLevel && touched.researchLevel ? (
                <div className="wizard-field-error mt-4">
                  <Search className="h-4 w-4" />
                  {errors.researchLevel}
                </div>
              ) : undefined
            }
          >
            <RadioGroup
              options={RESEARCH_LEVEL_OPTIONS}
              value={formData.researchLevel || ""}
              onValueChange={(value) => {
                onFieldChange("researchLevel", value);
                onFieldTouch("researchLevel");
              }}
              columns={3}
            />
          </AutoFilledFieldWrapper>
        )}

        {/* Content Enhancement Options */}
        {(includeLatestInfoField ||
          includeExamplesField ||
          includeStatisticsField ||
          includeQuotesField ||
          competitorAnalysisField) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Content Enhancement
              </CardTitle>
              <CardDescription>
                Choose what types of supporting content to include
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OptionGridLayout columns={2}>
                {/* Include Latest Information */}
                {includeLatestInfoField && (
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="includeLatestInfo"
                      checked={formData.includeLatestInfo ?? true}
                      onCheckedChange={(checked) =>
                        handleToggleChange("includeLatestInfo", !!checked)
                      }
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="includeLatestInfo"
                        className="font-medium cursor-pointer flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        Include Latest Information
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Prioritize recent developments and news in the research
                      </p>
                    </div>
                  </div>
                )}

                {/* Include Examples */}
                {includeExamplesField && (
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="includeExamples"
                      checked={formData.includeExamples ?? true}
                      onCheckedChange={(checked) =>
                        handleToggleChange("includeExamples", !!checked)
                      }
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="includeExamples"
                        className="font-medium cursor-pointer"
                      >
                        Include Examples
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Add real-world examples and case studies to illustrate
                        points
                      </p>
                    </div>
                  </div>
                )}

                {/* Include Statistics */}
                {includeStatisticsField && (
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="includeStatistics"
                      checked={formData.includeStatistics ?? true}
                      onCheckedChange={(checked) =>
                        handleToggleChange("includeStatistics", !!checked)
                      }
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="includeStatistics"
                        className="font-medium cursor-pointer flex items-center gap-2"
                      >
                        <BarChart className="h-4 w-4" />
                        Include Statistics
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Add relevant data, statistics, and quantitative insights
                      </p>
                    </div>
                  </div>
                )}

                {/* Include Quotes */}
                {includeQuotesField && (
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="includeQuotes"
                      checked={formData.includeQuotes ?? true}
                      onCheckedChange={(checked) =>
                        handleToggleChange("includeQuotes", !!checked)
                      }
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="includeQuotes"
                        className="font-medium cursor-pointer flex items-center gap-2"
                      >
                        <Quote className="h-4 w-4" />
                        Include Quotes
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Add expert quotes and industry leader insights
                      </p>
                    </div>
                  </div>
                )}

                {/* Competitor Analysis */}
                {competitorAnalysisField && (
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="competitorAnalysis"
                      checked={formData.competitorAnalysis ?? false}
                      onCheckedChange={(checked) =>
                        handleToggleChange("competitorAnalysis", !!checked)
                      }
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="competitorAnalysis"
                        className="font-medium cursor-pointer flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Competitor Analysis
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Research competitor content for insights and
                        differentiation opportunities
                      </p>
                    </div>
                  </div>
                )}
              </OptionGridLayout>
            </CardContent>
          </Card>
        )}

        {/* Quality Control */}
        {(factCheckingField || contentFreshnessField) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Quality Control
              </CardTitle>
              <CardDescription>
                Set standards for content accuracy and recency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fact Checking Level */}
              {factCheckingField && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">
                      Fact Checking Level
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      How rigorous should fact verification be?
                    </p>
                  </div>

                  <RadioGroup
                    options={FACT_CHECKING_OPTIONS}
                    value={formData.factChecking || ""}
                    onValueChange={(value) => {
                      onFieldChange("factChecking", value);
                      onFieldTouch("factChecking");
                    }}
                    columns={3}
                  />

                  {errors.factChecking && touched.factChecking && (
                    <Alert variant="destructive">
                      <AlertDescription>{errors.factChecking}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Content Freshness */}
              {contentFreshnessField && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">
                      Content Freshness
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      How recent should source material be?
                    </p>
                  </div>

                  <RadioGroup
                    options={CONTENT_FRESHNESS_OPTIONS}
                    value={formData.contentFreshness || ""}
                    onValueChange={(value) => {
                      onFieldChange("contentFreshness", value);
                      onFieldTouch("contentFreshness");
                    }}
                    columns={3}
                  />

                  {errors.contentFreshness && touched.contentFreshness && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {errors.contentFreshness}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Smart Recommendations */}
        {getSmartRecommendations.length > 0 && (
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 text-sm">
                💡 AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {getSmartRecommendations.map((recommendation, index) => (
                <p
                  key={`recommendation-${index}-${recommendation.slice(0, 20)}`}
                  className="text-blue-800 dark:text-blue-200"
                >
                  • {recommendation}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Research Preview */}
        {formData.researchLevel && (
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm">
                Research Configuration Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <Badge variant={formData.researchLevel ? "default" : "outline"}>
                  Research: {formData.researchLevel}
                </Badge>
                <Badge variant={formData.factChecking ? "default" : "outline"}>
                  Fact Check: {formData.factChecking}
                </Badge>
                <Badge
                  variant={formData.contentFreshness ? "default" : "outline"}
                >
                  Freshness: {formData.contentFreshness?.split(" ")[0]}
                </Badge>
                <Badge variant="outline">
                  Enhancements:{" "}
                  {
                    [
                      formData.includeLatestInfo && "Latest",
                      formData.includeExamples && "Examples",
                      formData.includeStatistics && "Stats",
                      formData.includeQuotes && "Quotes",
                      formData.competitorAnalysis && "Competitors",
                    ].filter(Boolean).length
                  }
                </Badge>
              </div>

              {formData.researchLevel === "Expert" && (
                <Alert>
                  <Search className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Expert Research:</strong> This will provide the most
                    comprehensive content with 20+ sources, extensive
                    fact-checking, and detailed analysis. Generation time: 3-5
                    minutes.
                  </AlertDescription>
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
            <span className="text-muted-foreground">Step 5 Progress:</span>
            <div className="flex items-center gap-4">
              <Badge variant={formData.researchLevel ? "default" : "outline"}>
                Research Level {formData.researchLevel ? "✓" : ""}
              </Badge>
              <Badge variant={formData.factChecking ? "default" : "outline"}>
                Fact Checking {formData.factChecking ? "✓" : ""}
              </Badge>
              <Badge
                variant={formData.contentFreshness ? "default" : "outline"}
              >
                Freshness {formData.contentFreshness ? "✓" : ""}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
