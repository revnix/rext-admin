/**
 * Review Question Component
 *
 * Displays a comprehensive review of all form selections before topic generation.
 * Shows the form data in a structured, readable format similar to the ReviewStep
 * but integrated within the TypeForm-style wizard flow.
 */

"use client";

import { Lightbulb, Settings, Sparkles, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import {
  CONTENT_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  PLATFORM_OPTIONS,
  PURPOSE_OPTIONS,
  TONE_OPTIONS,
} from "@/types/topic-builder";
import type { QuestionConfig } from "@/types/wizard";

interface ReviewQuestionProps {
  question: QuestionConfig;
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  error?: string;
  isLoading?: boolean;
}

export function ReviewQuestion({ formData }: ReviewQuestionProps) {
  const getDisplayValue = (
    options: { label: string; value: string }[],
    value: string,
  ) => {
    return options.find((opt) => opt.value === value)?.label || value;
  };

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mb-3">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          We'll create{" "}
          <span className="font-semibold text-primary">
            {formData.num_ideas} targeted topic ideas
          </span>{" "}
          based on your selections below.
        </p>
      </div>

      {/* Configuration Review Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Core Settings Card */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4 text-primary" />
              Core Settings
            </CardTitle>
            <CardDescription className="text-xs">
              Your content foundation and format preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Audience & Goals
            </CardTitle>
            <CardDescription className="text-xs">
              Who you're targeting and what you want to achieve
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" />
              Advanced Options
            </CardTitle>
            <CardDescription className="text-xs">
              Specific requirements and customizations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Number of Ideas</span>
              <Badge variant="outline" className="text-xs">
                {formData.num_ideas}
              </Badge>
            </div>

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
    </div>
  );
}
