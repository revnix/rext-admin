import { ArrowLeft, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import {
  CONTENT_GOAL_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  PLATFORM_OPTIONS,
  PURPOSE_OPTIONS,
  REGION_OPTIONS,
  TONE_OPTIONS,
} from "@/types/topic-builder";

interface ReviewStepProps {
  formData: TopicBuilderFormData;
  onGenerate: () => Promise<void>;
  onGoBack: () => void;
  isGenerating: boolean;
}

export function ReviewStep({
  formData,
  onGenerate,
  onGoBack,
  isGenerating,
}: ReviewStepProps) {
  const getDisplayValue = (
    options: { label: string; value: string }[],
    value: string,
  ) => {
    return options.find((opt) => opt.value === value)?.label || value;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Ready to Generate Ideas!</h3>
        <p className="text-muted-foreground">
          We'll create {formData.num_ideas} topic ideas based on your choices
          below. You can go back to any step to make changes.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Core Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Core Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mode</span>
              <Badge variant="secondary">
                {formData.wizardMode === "subject-first"
                  ? "Subject-First"
                  : "Industry-First"}
              </Badge>
            </div>

            {formData.subject && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Subject</span>
                <span className="text-sm text-right max-w-48 truncate">
                  {formData.subject}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Industry</span>
              <Badge variant="outline">
                {getDisplayValue(INDUSTRY_OPTIONS, formData.industry)}
              </Badge>
            </div>

            {formData.focus && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Focus</span>
                <span className="text-sm text-right max-w-48 truncate">
                  {formData.focus}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Content Type</span>
              <Badge variant="outline">
                {getDisplayValue(CONTENT_TYPE_OPTIONS, formData.content_type)}
              </Badge>
            </div>

            {formData.platform && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Platform</span>
                <Badge variant="outline">
                  {getDisplayValue(PLATFORM_OPTIONS, formData.platform)}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audience & Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audience & Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.audience && (
              <div>
                <span className="text-sm font-medium">Audience</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.audience}
                </p>
              </div>
            )}

            {formData.purpose.length > 0 && (
              <div>
                <span className="text-sm font-medium">Purpose</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.purpose.map((p) => (
                    <Badge key={p} variant="secondary" className="text-xs">
                      {getDisplayValue(PURPOSE_OPTIONS, p)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {formData.content_goal.length > 0 && (
              <div>
                <span className="text-sm font-medium">Content Goals</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.content_goal.map((g) => (
                    <Badge key={g} variant="secondary" className="text-xs">
                      {getDisplayValue(CONTENT_GOAL_OPTIONS, g)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {formData.tone.length > 0 && (
              <div>
                <span className="text-sm font-medium">Tone</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.tone.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {getDisplayValue(TONE_OPTIONS, t)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advanced Options */}
        {(formData.keywords ||
          formData.exclude ||
          formData.region ||
          formData.language ||
          formData.notes) && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Advanced Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {formData.keywords && (
                  <div>
                    <span className="text-sm font-medium">Keywords</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.keywords}
                    </p>
                  </div>
                )}

                {formData.exclude && (
                  <div>
                    <span className="text-sm font-medium">Exclude</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.exclude}
                    </p>
                  </div>
                )}

                {formData.region && (
                  <div>
                    <span className="text-sm font-medium">Region</span>
                    <Badge variant="outline">
                      {getDisplayValue(REGION_OPTIONS, formData.region)}
                    </Badge>
                  </div>
                )}

                {formData.language && (
                  <div>
                    <span className="text-sm font-medium">Language</span>
                    <Badge variant="outline">
                      {getDisplayValue(LANGUAGE_OPTIONS, formData.language)}
                    </Badge>
                  </div>
                )}
              </div>

              {formData.notes && (
                <div>
                  <span className="text-sm font-medium">Notes</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generation Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Your Request</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Number of Ideas</span>
              <Badge variant="default">{formData.num_ideas}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6">
        <Button
          variant="outline"
          onClick={onGoBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>

        <div className="text-center">
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            size="lg"
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Topic Ideas"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            This will create {formData.num_ideas} targeted topic ideas
          </p>
        </div>

        <div className="w-24" />
      </div>
    </div>
  );
}
