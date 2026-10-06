/**
 * Purpose Selection Question Component
 *
 * Multi-select for content purpose/goals selection.
 */

"use client";

import {
  Award,
  Lightbulb,
  MessageSquare,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { MultiSelectCard } from "@/components/ui/typeform/multi-select-card";
import { TextInput } from "@/components/ui/typeform/text-input";
import { cn } from "@/lib/utils";
import type { PurposeType, TopicBuilderFormData } from "@/types/topic-builder";
import { PURPOSE_OPTIONS } from "@/types/topic-builder";
import type { QuestionConfig } from "@/types/wizard";

export interface PurposeQuestionProps {
  question: QuestionConfig;
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  error?: string;
  isLoading?: boolean;
}

export function PurposeQuestion({
  question: _question,
  formData,
  updateFormData,
  error: _error,
  isLoading = false,
}: PurposeQuestionProps) {
  const handleToggle = (value: PurposeType) => {
    const currentPurposes = formData.purpose || [];
    const isSelected = currentPurposes.includes(value);

    let newPurposes: PurposeType[];
    if (isSelected) {
      newPurposes = currentPurposes.filter((p) => p !== value);
    } else {
      newPurposes = [...currentPurposes, value];
    }

    updateFormData("purpose", newPurposes);

    // Clear the custom purpose when switching away from "other"
    if (value === "other" && isSelected) {
      updateFormData("purpose_other", "");
    }
  };

  const handleCustomPurposeChange = (value: string) => {
    updateFormData("purpose_other", value);
  };

  const getIcon = (value: string) => {
    switch (value) {
      case "educate-inform":
        return <Lightbulb className="w-5 h-5" />;
      case "entertain-engage":
        return <Users className="w-5 h-5" />;
      case "inspire-motivate":
        return <Target className="w-5 h-5" />;
      case "persuade-convince":
        return <MessageSquare className="w-5 h-5" />;
      case "promote-product":
        return <ShoppingCart className="w-5 h-5" />;
      case "drive-seo":
        return <TrendingUp className="w-5 h-5" />;
      case "thought-leadership":
        return <Award className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getDescription = (value: string) => {
    switch (value) {
      case "educate-inform":
        return "Share knowledge and valuable information";
      case "entertain-engage":
        return "Create enjoyable and engaging content";
      case "inspire-motivate":
        return "Motivate and inspire your audience";
      case "persuade-convince":
        return "Influence opinions and drive decisions";
      case "promote-product":
        return "Showcase products or services";
      case "drive-seo":
        return "Improve search engine rankings";
      case "thought-leadership":
        return "Establish expertise and authority";
      default:
        return "";
    }
  };

  const currentPurposes = formData.purpose || [];
  const hasOtherSelected = currentPurposes.includes("other");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PURPOSE_OPTIONS.map((option) => {
          const isRecommended = option.value === "educate-inform";
          const isSelected = currentPurposes.includes(
            option.value as PurposeType,
          );
          return (
            <MultiSelectCard
              key={`purpose-${option.value}`}
              label={option.label}
              description={getDescription(option.value)}
              selected={isSelected}
              onToggle={() => handleToggle(option.value as PurposeType)}
              icon={getIcon(option.value)}
              disabled={isLoading}
              className={cn(
                "h-auto",
                isSelected && "shadow-lg",
                isRecommended &&
                  !isSelected &&
                  "ring-1 ring-primary/30 bg-primary/5 border-primary/20",
              )}
            />
          );
        })}
      </div>

      {/* Custom Purpose Input */}
      {hasOtherSelected && (
        <div className="mt-6">
          <TextInput
            value={formData.purpose_other || ""}
            onChange={handleCustomPurposeChange}
            placeholder="Please specify your content purpose..."
            disabled={isLoading}
            maxLength={100}
            className="w-full"
            autoFocus
          />
        </div>
      )}

      {/* Selection Count */}
      {currentPurposes.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {currentPurposes.length} purpose
          {currentPurposes.length !== 1 ? "s" : ""} selected
          {currentPurposes.length >= 3 && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">
              (Consider focusing on 1-2 main purposes for better results)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
