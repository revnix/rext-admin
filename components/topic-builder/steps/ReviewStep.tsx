import { Lightbulb, RotateCcw, Settings, Sparkles, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BackendError } from "@/types/backend";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import {
  CONTENT_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  PLATFORM_OPTIONS,
  PURPOSE_OPTIONS,
  TONE_OPTIONS,
} from "@/types/topic-builder";

interface ReviewStepProps {
  formData: TopicBuilderFormData;
  onGenerate: () => Promise<void>;
  onRestart: () => void;
  isGenerating: boolean;
  generationError?: BackendError | null;
  onRetry?: () => Promise<void>;
  onClearError?: () => void;
}

export function ReviewStep({
  formData,
  onGenerate,
  onRestart,
  isGenerating,
  generationError: _generationError,
  onRetry: _onRetry,
  onClearError: _onClearError,
}: ReviewStepProps) {
  const getDisplayValue = (
    options: { label: string; value: string }[],
    value: string,
  ) => {
    return options.find((opt) => opt.value === value)?.label || value;
  };

  return (
    <div className="space-y-8">
      {/* Header Section with Start Over Button */}
      <div className="relative">
        <Button
          variant="ghost"
          onClick={onRestart}
          disabled={isGenerating}
          className="absolute top-0 right-0 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Start Over
        </Button>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mb-4">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">Ready to Generate Ideas!</h3>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            We'll create{" "}
            <span className="font-semibold text-primary">
              {formData.num_ideas} targeted topic ideas
            </span>{" "}
            based on your preferences below. You can start over if you want to
            change your selections.
          </p>
        </div>
      </div>

      {/* Configuration Review Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Settings Card */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary" />
              Core Settings
            </CardTitle>
            <CardDescription className="text-sm">
              Your content foundation and format preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mode</span>
              <Badge variant="secondary" className="text-xs">
                {formData.wizardMode === "subject-first"
                  ? "Subject-First"
                  : "Industry-First"}
              </Badge>
            </div>

            {formData.subject && (
              <div className="space-y-1">
                <span className="text-sm font-medium">Subject</span>
                <p className="text-sm text-muted-foreground break-words">
                  {formData.subject}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Industry</span>
              <Badge variant="outline" className="text-xs">
                {getDisplayValue(INDUSTRY_OPTIONS, formData.industry)}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Content Type</span>
              <Badge variant="outline" className="text-xs">
                {getDisplayValue(CONTENT_TYPE_OPTIONS, formData.content_type)}
              </Badge>
            </div>

            {formData.platform && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Platform</span>
                <Badge variant="outline" className="text-xs">
                  {getDisplayValue(PLATFORM_OPTIONS, formData.platform)}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audience & Goals Card */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Audience & Goals
            </CardTitle>
            <CardDescription className="text-sm">
              Who you're targeting and what you want to achieve
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.audience && formData.audience.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Target Audience</span>
                <div className="flex flex-wrap gap-1">
                  {formData.audience.map((aud) => (
                    <Badge key={aud} variant="secondary" className="text-xs">
                      {aud}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {formData.purpose.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Purpose</span>
                <div className="flex flex-wrap gap-1">
                  {formData.purpose.map((p) => (
                    <Badge key={p} variant="secondary" className="text-xs">
                      {getDisplayValue(PURPOSE_OPTIONS, p)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {formData.tone.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Tone</span>
                <div className="flex flex-wrap gap-1">
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

        {/* Advanced Options Card */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
              Advanced Options
            </CardTitle>
            <CardDescription className="text-sm">
              Specific requirements and customizations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.notes && (
              <div className="space-y-1">
                <span className="text-sm font-medium">Additional Notes</span>
                <p className="text-sm text-muted-foreground break-words">
                  {formData.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center pt-6">
        <div className="text-center">
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            size="lg"
            className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Sparkles className="h-5 w-5 mr-3" />
            {isGenerating
              ? "Generating..."
              : `Generate ${formData.num_ideas} Topic Ideas`}
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            This usually takes 10-15 seconds to complete
          </p>
        </div>
      </div>
    </div>
  );
}
