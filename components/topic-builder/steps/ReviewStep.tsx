import { ArrowLeft, Settings, Sparkles, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-base">Core Settings</h3>
          </div>

          <div className="space-y-3">
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
                <span className="text-sm text-right max-w-32 truncate">
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
                <span className="text-sm text-right max-w-32 truncate">
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
          </div>
        </div>

        {/* Audience & Goals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-base">Audience & Goals</h3>
          </div>

          <div className="space-y-3">
            {formData.audience && formData.audience.length > 0 && (
              <div>
                <span className="text-sm font-medium">Audience</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.audience.map((aud) => (
                    <Badge key={aud} variant="secondary" className="text-xs">
                      {aud}
                    </Badge>
                  ))}
                </div>
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
          </div>
        </div>

        {/* Your Request */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-base">Your Request</h3>
          </div>

          <div className="space-y-3">
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

            {formData.notes && (
              <div>
                <span className="text-sm font-medium">Notes</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.notes}
                </p>
              </div>
            )}
          </div>
        </div>
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
