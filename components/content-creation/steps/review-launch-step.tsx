"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Clock,
  Download,
  Edit,
  FileText,
  Globe,
  Loader2,
  MessageSquare,
  Rocket,
  RotateCcw,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { UserMultiSelect } from "@/components/content-creation/fields";
import { QuestionAnswerLayout } from "@/components/content-creation/layouts/question-answer-layout";
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
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api-client";
import type { WizardDependencyEngine } from "@/lib/content-creation/dependency-engine";
import { log } from "@/lib/logger";
import { useWorkspace } from "@/providers/workspace-provider";
import type {
  ContentCreationFormData,
  PartialContentCreationFormData,
  WizardStepProps,
} from "@/types/content-creation";

interface ReviewLaunchStepProps extends WizardStepProps {
  dependencyEngine: WizardDependencyEngine;
  onLaunch?: (formData: ContentCreationFormData) => Promise<void>;
  onSaveDraft?: (formData: PartialContentCreationFormData) => Promise<void>;
  onGoToStep?: (stepIndex: number) => void;
}

/**
 * Step 6: Review & Launch Component
 *
 * This final step handles:
 * - Comprehensive review of all user selections
 * - Content configuration preview
 * - Validation and readiness checks
 * - Launch options (Generate now, Save draft, Schedule)
 * - Final confirmation and content creation initiation
 */
export function ReviewLaunchStep({
  step,
  formData,
  errors: _errors,
  touched: _touched,
  isActive: _isActive,
  onFieldChange,
  onFieldTouch,
  dependencyEngine: _dependencyEngine,
  onLaunch,
  onSaveDraft,
  onGoToStep,
}: ReviewLaunchStepProps) {
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchOption, setLaunchOption] = useState<
    "generate" | "draft" | "schedule"
  >("generate");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [_expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  // Get current workspace
  const { workspaceId } = useWorkspace();

  // Fetch workspace members for reviewer selection
  const { data: membersResponse, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: () => apiClient.members.list(workspaceId),
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Transform workspace members to user format for UserMultiSelect
  const availableReviewers = useMemo(() => {
    if (!membersResponse?.members) return [];
    return membersResponse.members.map((member) => ({
      id: member.user_id,
      name: member.user.display_name,
      email: member.user.email,
      avatar: undefined, // No avatar in current API response
    }));
  }, [membersResponse]);

  // Calculate completion status
  const completionStats = useMemo(() => {
    const requiredFields = [
      { key: "topicId", label: "Topic", completed: !!formData.topicId },
      {
        key: "contentType",
        label: "Content Type",
        completed: !!formData.contentType,
      },
      {
        key: "audienceType",
        label: "Audience",
        completed: !!formData.audienceType?.length,
      },
      { key: "goals", label: "Goals", completed: !!formData.goals?.length },
      { key: "tone", label: "Tone", completed: !!formData.tone?.length },
      { key: "region", label: "Region", completed: !!formData.region },
      { key: "language", label: "Language", completed: !!formData.language },
      {
        key: "contentLength",
        label: "Content Length",
        completed: !!formData.contentLength,
      },
      {
        key: "researchLevel",
        label: "Research Level",
        completed: !!formData.researchLevel,
      },
    ];

    // Add human review as optional but recommended
    const optionalFields = [
      {
        key: "humanReview",
        label: "Human Review",
        completed: formData.enableHumansInLoop
          ? !!formData.humanReviewers?.length
          : true,
      },
    ];

    const allFields = [...requiredFields, ...optionalFields];
    const completed = allFields.filter((field) => field.completed).length;
    const total = allFields.length;
    const percentage = Math.round((completed / total) * 100);

    return {
      completed,
      total,
      percentage,
      fields: requiredFields,
      optionalFields,
    };
  }, [formData]);

  // Generate estimated completion time
  const estimatedTime = useMemo(() => {
    let baseTime = 2; // 2 minutes base

    if (formData.researchLevel === "Comprehensive") baseTime += 2;
    if (formData.researchLevel === "Expert") baseTime += 4;

    // Handle ContentLengthOption object
    if (formData.contentLength?.type === "preset") {
      if (formData.contentLength.preset === "Long") baseTime += 3;
    } else if (formData.contentLength?.type === "custom") {
      const wordCount = formData.contentLength.custom?.value || 0;
      if (wordCount > 2000) baseTime += 3;
      if (wordCount > 3000) baseTime += 5;
    }

    if (formData.includeLatestInfo) baseTime += 1;
    if (formData.includeStatistics) baseTime += 1;
    if (formData.competitorAnalysis) baseTime += 2;

    return Math.max(baseTime, 2);
  }, [formData]);

  // Handle section expansion
  const _toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Handle launch
  const handleLaunch = useCallback(async () => {
    if (!agreedToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    if (completionStats.percentage < 90) {
      toast.error("Please complete all required fields before launching");
      return;
    }

    setIsLaunching(true);

    try {
      if (launchOption === "draft") {
        await onSaveDraft?.(formData);
        toast.success("Draft saved successfully!");
      } else {
        // At this point, we've validated completeness, so cast to complete form data
        await onLaunch?.(formData as ContentCreationFormData);
        toast.success("Content creation started!");
      }
    } catch (error) {
      toast.error("Failed to launch content creation");
      log.error("Failed to launch content creation", error);
    } finally {
      setIsLaunching(false);
    }
  }, [
    agreedToTerms,
    completionStats.percentage,
    launchOption,
    formData,
    onSaveDraft,
    onLaunch,
  ]);

  // Handle edit step
  const handleEditStep = useCallback(
    (stepIndex: number) => {
      onGoToStep?.(stepIndex);
    },
    [onGoToStep],
  );

  return (
    <div className="space-y-8 w-full">
      {/* Step header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{step.title}</h2>
        <p className="text-muted-foreground mt-2">{step.description}</p>
      </div>

      {/* Configuration Review */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
        {/* Topic & Content */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Topic & Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">
                {formData.topicId || "No topic selected"}
              </p>
            </div>
            <div>
              <Badge variant="outline" className="text-xs">
                {formData.contentType || "Not specified"}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditStep(0)}
              className="text-primary hover:text-primary/80 text-xs h-7 px-2 mt-2"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </CardContent>
        </Card>

        {/* Audience & Goals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Audience & Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">
                {formData.audienceSize || "Not specified"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formData.readingLevel || "Reading level not set"}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.goals?.slice(0, 2).map((goal) => (
                <Badge key={goal} variant="secondary" className="text-xs">
                  {goal}
                </Badge>
              )) || (
                <span className="text-xs text-muted-foreground">
                  No goals selected
                </span>
              )}
              {(formData.goals?.length || 0) > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{(formData.goals?.length || 0) - 2} more
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditStep(1)}
              className="text-primary hover:text-primary/80 text-xs h-7 px-2 mt-2"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </CardContent>
        </Card>

        {/* Voice & Style */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Voice & Style
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {formData.tone?.slice(0, 2).map((tone) => (
                <Badge key={tone} variant="default" className="text-xs">
                  {tone}
                </Badge>
              )) || (
                <span className="text-xs text-muted-foreground">
                  No tone selected
                </span>
              )}
              {(formData.tone?.length || 0) > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{(formData.tone?.length || 0) - 2} more
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>
                {formData.region || "Global"} • {formData.language || "English"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditStep(2)}
              className="text-primary hover:text-primary/80 text-xs h-7 px-2 mt-2"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </CardContent>
        </Card>

        {/* Content Structure */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart className="h-4 w-4" />
              Content Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">
                {formData.contentLength?.type === "preset"
                  ? formData.contentLength.preset
                  : formData.contentLength?.type === "custom"
                    ? `${formData.contentLength.custom?.value} ${formData.contentLength.custom?.unit}`
                    : "Length not set"}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.primaryKeywords?.slice(0, 3).map((keyword) => (
                <Badge key={keyword} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              )) || (
                <span className="text-xs text-muted-foreground">
                  No keywords
                </span>
              )}
              {(formData.primaryKeywords?.length || 0) > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{(formData.primaryKeywords?.length || 0) - 3} more
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditStep(3)}
              className="text-primary hover:text-primary/80 text-xs h-7 px-2 mt-2"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </CardContent>
        </Card>

        {/* Research Settings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              Research Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  formData.researchLevel === "Expert" ? "default" : "secondary"
                }
                className="text-xs"
              >
                {formData.researchLevel || "Basic"}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>{formData.factChecking || "Basic"}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                formData.includeLatestInfo && "Latest",
                formData.includeStatistics && "Stats",
                formData.competitorAnalysis && "Competitors",
              ]
                .filter((item): item is string => Boolean(item))
                .slice(0, 3)
                .map((label) => (
                  <Badge key={label} variant="outline" className="text-xs">
                    {label}
                  </Badge>
                ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditStep(4)}
              className="text-primary hover:text-primary/80 text-xs h-7 px-2 mt-2"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Human Review Configuration */}
      <QuestionAnswerLayout
        question={{
          label: "Human Review (Optional)",
          description:
            "Select team members to review content before publication",
          icon: Users,
        }}
      >
        <div className="space-y-4">
          {/* Enable Toggle */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="enableHumansInLoop"
              checked={formData.enableHumansInLoop || false}
              onCheckedChange={(checked) => {
                onFieldChange("enableHumansInLoop", !!checked);
                onFieldTouch("enableHumansInLoop");
              }}
            />
            <div className="space-y-0.5 flex-1">
              <Label
                htmlFor="enableHumansInLoop"
                className="font-medium cursor-pointer flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Enable Human Review
              </Label>
              <p className="text-xs text-muted-foreground">
                Have team members review content before it goes live
              </p>
            </div>
          </div>

          {/* Reviewer Selection (when enabled) */}
          {formData.enableHumansInLoop && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Select Reviewers ({formData.humanReviewers?.length || 0}/3)
              </Label>
              {isLoadingMembers ? (
                <div className="text-sm text-muted-foreground">
                  Loading team members...
                </div>
              ) : availableReviewers.length === 0 ? (
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    No team members available. Invite members to your workspace
                    to enable human review.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <UserMultiSelect
                    users={availableReviewers}
                    value={formData.humanReviewers || []}
                    onChange={(reviewers) => {
                      onFieldChange("humanReviewers", reviewers);
                      onFieldTouch("humanReviewers");
                    }}
                    placeholder="Select team members..."
                    maxSelection={3}
                  />
                  {(formData.humanReviewers?.length || 0) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Selected reviewers will be notified when content is ready
                      for review.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </QuestionAnswerLayout>

      {/* Launch Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Launch Options
          </CardTitle>
          <CardDescription>
            Choose how you want to create your content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <Label
              className={`relative flex items-center justify-between border rounded-lg p-4 cursor-pointer transition-colors ${
                launchOption === "generate"
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent"
              }`}
            >
              <input
                type="radio"
                value="generate"
                checked={launchOption === "generate"}
                onChange={(e) =>
                  setLaunchOption(e.target.value as typeof launchOption)
                }
                className="sr-only"
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  <span className="font-medium">Generate Now</span>
                  <Badge variant="default" className="text-xs">
                    Recommended
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Start content creation immediately. Estimated time: ~
                  {estimatedTime} minutes
                </p>
              </div>
            </Label>

            <Label
              className={`relative flex items-center justify-between border rounded-lg p-4 cursor-pointer transition-colors ${
                launchOption === "draft"
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent"
              }`}
            >
              <input
                type="radio"
                value="draft"
                checked={launchOption === "draft"}
                onChange={(e) =>
                  setLaunchOption(e.target.value as typeof launchOption)
                }
                className="sr-only"
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  <span className="font-medium">Save as Draft</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Save configuration for later. You can generate content anytime
                </p>
              </div>
            </Label>

            <Label
              className={`relative flex items-center justify-between border rounded-lg p-4 cursor-pointer transition-colors opacity-50 cursor-not-allowed`}
            >
              <input
                type="radio"
                value="schedule"
                checked={launchOption === "schedule"}
                onChange={(e) =>
                  setLaunchOption(e.target.value as typeof launchOption)
                }
                className="sr-only"
                disabled
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-medium">Schedule for Later</span>
                  <Badge variant="outline" className="text-xs">
                    Coming Soon
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Schedule content generation for a specific time
                </p>
              </div>
            </Label>
          </div>

          <Separator />

          {/* Generation Preview */}
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Generation Preview:</strong>
              <div className="mt-2 space-y-1 text-sm">
                <p>
                  • Research Level: {formData.researchLevel} ({estimatedTime}min
                  estimated)
                </p>
                <p>
                  • Content Length:{" "}
                  {formData.contentLength?.type === "preset"
                    ? formData.contentLength.preset
                    : formData.contentLength?.type === "custom"
                      ? `${formData.contentLength.custom?.value} ${formData.contentLength.custom?.unit}`
                      : "Not specified"}
                </p>
                <p>• Language: {formData.language}</p>
                <p>
                  • Enhancements:{" "}
                  {[
                    formData.includeLatestInfo && "Latest Info",
                    formData.includeExamples && "Examples",
                    formData.includeStatistics && "Statistics",
                    formData.includeQuotes && "Quotes",
                    formData.competitorAnalysis && "Competitor Analysis",
                  ]
                    .filter(Boolean)
                    .join(", ") || "None"}
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Terms Agreement */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="terms"
                className="text-sm font-medium cursor-pointer"
              >
                I agree to the terms and conditions
              </Label>
              <p className="text-xs text-muted-foreground">
                By proceeding, you agree that the generated content will be
                reviewed before publication and that AI-generated content may
                require human editing for accuracy and quality.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              size="lg"
              disabled={
                completionStats.percentage < 90 || !agreedToTerms || isLaunching
              }
              onClick={handleLaunch}
            >
              {isLaunching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4 mr-2" />
              )}
              {isLaunching
                ? "Processing..."
                : launchOption === "draft"
                  ? "Save Draft"
                  : "Launch Content Creation"}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => handleEditStep(0)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
