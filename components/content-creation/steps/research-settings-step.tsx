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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { OptionGridLayout } from "../layouts/option-grid-layout";
import { QuestionAnswerLayout } from "../layouts/question-answer-layout";

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
          <QuestionAnswerLayout
            question={{
              label: "Research Level",
              description:
                "How thorough should the research be? Higher levels provide more comprehensive content but take longer.",
              icon: Search,
            }}
            isAutoFilled={
              formData._topicPrefillingMetadata?.prefilledFields
                ?.research_level || false
            }
            isModified={touched.researchLevel || false}
            hasError={!!(errors.researchLevel && touched.researchLevel)}
            error={errors.researchLevel}
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
          </QuestionAnswerLayout>
        )}

        {/* Content Enhancement Options */}
        {(includeLatestInfoField ||
          includeExamplesField ||
          includeStatisticsField ||
          includeQuotesField ||
          competitorAnalysisField) && (
          <QuestionAnswerLayout
            question={{
              label: "Content Enhancement",
              description: "Choose what types of supporting content to include",
              icon: TrendingUp,
            }}
          >
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
          </QuestionAnswerLayout>
        )}

        {/* Quality Control */}
        {(factCheckingField || contentFreshnessField) && (
          <QuestionAnswerLayout
            question={{
              label: "Quality Control",
              description: "Set standards for content accuracy and recency",
              icon: Shield,
            }}
          >
            <div className="space-y-6">
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
            </div>
          </QuestionAnswerLayout>
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
              {getSmartRecommendations.map((recommendation) => (
                <p
                  key={`recommendation-${recommendation}-${recommendation.slice(0, 20)}`}
                  className="text-blue-800 dark:text-blue-200"
                >
                  • {recommendation}
                </p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
