"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Edit,
  FileText,
  Globe,
  MessageSquare,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { UserMultiSelect } from "@/components/content-creation/fields";
import { QuestionAnswerLayout } from "@/components/content-creation/layouts/question-answer-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import type { WizardDependencyEngine } from "@/lib/content-creation/dependency-engine";
import { useWorkspace } from "@/providers/workspace-provider";
import type { WizardStepProps } from "@/types/content-creation";

interface ReviewLaunchStepProps extends WizardStepProps {
  dependencyEngine: WizardDependencyEngine;
  onGoToStep?: (stepIndex: number) => void;
}

/**
 * Step 6: Review & Launch Component
 *
 * This final step handles:
 * - Comprehensive review of all user selections
 * - Content configuration preview
 * - Human review configuration
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
  onGoToStep,
}: ReviewLaunchStepProps) {
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
      name: member.user.display_name || member.user.name,
      email: member.user.email,
      avatar: undefined, // No avatar in current API response
    }));
  }, [membersResponse]);

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
        <div className="space-y-3">
          {isLoadingMembers ? (
            <div className="text-sm text-muted-foreground">
              Loading team members...
            </div>
          ) : availableReviewers.length === 0 ? (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                No team members available. Invite members to your workspace to
                enable human review.
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
                placeholder="Select team members (up to 3)..."
                maxSelection={3}
              />
              {(formData.humanReviewers?.length || 0) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Selected reviewers will be notified when content is ready for
                  review.
                </p>
              )}
            </>
          )}
        </div>
      </QuestionAnswerLayout>
    </div>
  );
}
