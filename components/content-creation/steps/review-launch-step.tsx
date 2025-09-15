"use client";

import {
  AlertCircle,
  BarChart,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  Globe,
  Loader2,
  MessageSquare,
  Rocket,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ReviewerSelector } from "@/components/content-creation/fields";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { WizardDependencyEngine } from "@/lib/content-creation/dependency-engine";
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
      console.error(error);
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

      {/* Completion Overview */}
      <Card
        className={
          completionStats.percentage === 100
            ? "border-green-200 bg-green-50 dark:bg-green-950/20"
            : ""
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle
              className={`h-5 w-5 ${completionStats.percentage === 100 ? "text-green-600" : "text-muted-foreground"}`}
            />
            Completion Status
          </CardTitle>
          <CardDescription>
            {completionStats.completed} of {completionStats.total} required
            fields completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Progress value={completionStats.percentage} className="flex-1" />
            <Badge
              variant={
                completionStats.percentage === 100 ? "default" : "secondary"
              }
            >
              {completionStats.percentage}%
            </Badge>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {completionStats.fields.map((field, _index) => (
              <Badge
                key={field.key}
                variant={field.completed ? "default" : "outline"}
                className="justify-center text-xs"
              >
                {field.completed && <CheckCircle className="h-3 w-3 mr-1" />}
                {field.label}
              </Badge>
            ))}
          </div>

          {completionStats.percentage < 100 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please complete all required fields before launching content
                creation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuration Review */}
      <div className="grid gap-6 w-full">
        {/* Topic & Content */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Topic & Content Type
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditStep(0)}
                className="text-primary hover:text-primary/80"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Topic
                </Label>
                <p className="font-medium">
                  {formData.topicId || "Not specified"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Content Type
                </Label>
                <Badge variant="outline" className="ml-2">
                  {formData.contentType || "Not specified"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audience & Goals */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Audience & Goals
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditStep(1)}
                className="text-primary hover:text-primary/80"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Audience Size
                </Label>
                <p className="font-medium">
                  {formData.audienceSize || "Not specified"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Reading Level
                </Label>
                <p className="font-medium">
                  {formData.readingLevel || "Not specified"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Audience Types
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.audienceType?.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  )) || (
                    <span className="text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Goals
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.goals?.map((goal) => (
                    <Badge key={goal} variant="secondary" className="text-xs">
                      {goal}
                    </Badge>
                  )) || (
                    <span className="text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice & Style */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Voice & Style
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditStep(2)}
                className="text-primary hover:text-primary/80"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Tone
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.tone?.map((tone) => (
                    <Badge key={tone} variant="default" className="text-xs">
                      {tone}
                    </Badge>
                  )) || (
                    <span className="text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Region
                </Label>
                <div className="flex items-center gap-1 mt-1">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {formData.region || "Not specified"}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Language
                </Label>
                <p className="font-medium">
                  {formData.language || "Not specified"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Structure */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart className="h-5 w-5" />
                Content Structure
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditStep(3)}
                className="text-primary hover:text-primary/80"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Content Length
                </Label>
                {formData.contentLength ? (
                  <div>
                    <p className="font-medium">
                      {formData.contentLength.type === "preset"
                        ? formData.contentLength.preset
                        : "Custom"}
                    </p>
                    {formData.contentLength.type === "custom" &&
                      formData.contentLength.custom && (
                        <p className="text-sm text-muted-foreground">
                          {formData.contentLength.custom.value}{" "}
                          {formData.contentLength.custom.unit}
                        </p>
                      )}
                  </div>
                ) : (
                  <p className="font-medium">Not specified</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Search Intent
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.searchIntent?.map((intent) => (
                    <Badge key={intent} variant="outline" className="text-xs">
                      {intent}
                    </Badge>
                  )) || (
                    <span className="text-muted-foreground">Not specified</span>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Keywords
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.primaryKeywords?.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  )) || (
                    <span className="text-muted-foreground">
                      None specified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Research Settings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5" />
                Research Settings
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditStep(4)}
                className="text-primary hover:text-primary/80"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Research Level
                </Label>
                <Badge
                  variant={
                    formData.researchLevel === "Expert"
                      ? "default"
                      : "secondary"
                  }
                  className="ml-2"
                >
                  {formData.researchLevel || "Not specified"}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Fact Checking
                </Label>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {formData.factChecking || "Not specified"}
                  </span>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Enhancements
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    {
                      key: "includeLatestInfo",
                      label: "Latest Info",
                      icon: Clock,
                    },
                    { key: "includeExamples", label: "Examples", icon: Eye },
                    {
                      key: "includeStatistics",
                      label: "Statistics",
                      icon: BarChart,
                    },
                    {
                      key: "includeQuotes",
                      label: "Quotes",
                      icon: MessageSquare,
                    },
                    {
                      key: "competitorAnalysis",
                      label: "Competitor Analysis",
                      icon: Search,
                    },
                  ].map(({ key, label, icon: Icon }) => (
                    <Badge
                      key={key}
                      variant={
                        formData[key as keyof ContentCreationFormData]
                          ? "default"
                          : "outline"
                      }
                      className="text-xs flex items-center gap-1"
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Human Review Configuration */}
      <ReviewerSelector
        selectedReviewers={formData.humanReviewers}
        enableHumansInLoop={formData.enableHumansInLoop}
        availableReviewers={[
          // Mock data - in real implementation, this would come from API
          {
            id: "1",
            name: "Sarah Johnson",
            email: "sarah.johnson@company.com",
            role: "Content Manager",
            department: "Marketing",
            expertise: ["SEO", "Brand Voice", "Content Strategy"],
            isOnline: true,
          },
          {
            id: "2",
            name: "Mike Chen",
            email: "mike.chen@company.com",
            role: "Senior Editor",
            department: "Marketing",
            expertise: ["Copywriting", "Technical Writing"],
            isOnline: false,
          },
          {
            id: "3",
            name: "Emily Rodriguez",
            email: "emily.rodriguez@company.com",
            role: "Brand Manager",
            department: "Marketing",
            expertise: ["Brand Guidelines", "Marketing Copy"],
            isOnline: true,
          },
          {
            id: "4",
            name: "David Park",
            email: "david.park@company.com",
            role: "Legal Counsel",
            department: "Legal",
            expertise: ["Compliance", "Legal Review"],
            isOnline: true,
          },
        ]}
        maxReviewers={3}
        onChange={(reviewers, enabled) => {
          onFieldChange("humanReviewers", reviewers);
          onFieldChange("enableHumansInLoop", enabled);
          onFieldTouch("humanReviewers");
          onFieldTouch("enableHumansInLoop");
        }}
        onTouch={() => {
          onFieldTouch("humanReviewers");
          onFieldTouch("enableHumansInLoop");
        }}
        onLoadReviewers={async () => {
          // In real implementation, this would fetch from API
          console.log("Loading team members...");
          return [];
        }}
      />

      {/* Launch Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
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
                  <Rocket className="h-5 w-5" />
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
                  <Download className="h-5 w-5" />
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
                  <Clock className="h-5 w-5" />
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

          {/* Launch Button */}
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
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
              <Edit className="h-4 w-4 mr-2" />
              Review & Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress summary for this step */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Final Step - Ready to Launch:
            </span>
            <div className="flex items-center gap-4">
              <Badge
                variant={
                  completionStats.percentage >= 90 ? "default" : "outline"
                }
              >
                Configuration{" "}
                {completionStats.percentage >= 90
                  ? "✓"
                  : `${completionStats.percentage}%`}
              </Badge>
              <Badge variant={agreedToTerms ? "default" : "outline"}>
                Terms {agreedToTerms ? "✓" : ""}
              </Badge>
              <Badge variant={launchOption ? "default" : "outline"}>
                Launch Option {launchOption ? "✓" : ""}
              </Badge>
              <Badge
                variant={
                  formData.enableHumansInLoop
                    ? formData.humanReviewers?.length
                      ? "default"
                      : "outline"
                    : "secondary"
                }
              >
                Human Review{" "}
                {formData.enableHumansInLoop
                  ? formData.humanReviewers?.length
                    ? "✓"
                    : "Pending"
                  : "Disabled"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
