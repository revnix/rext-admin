/**
 * Audience Selection Question Component
 *
 * Chip-style input for target audience selection/creation.
 */

"use client";

import { motion } from "framer-motion";
import { Plus, Users } from "lucide-react";
import { useCallback } from "react";
import { ChipInput } from "@/components/ui/typeform/chip-input";
import {
  getMotionVariants,
  questionItemVariants,
  useReducedMotion,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import type { QuestionConfig } from "@/types/wizard";

export interface AudienceQuestionProps {
  question: QuestionConfig;
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  error?: string;
  isLoading?: boolean;
}

export function AudienceQuestion({
  question: _question,
  formData,
  updateFormData,
  error,
  isLoading = false,
}: AudienceQuestionProps) {
  const prefersReducedMotion = useReducedMotion();
  const itemVariants = getMotionVariants(
    questionItemVariants,
    prefersReducedMotion,
  );

  const handleChange = useCallback(
    (audiences: string[]) => {
      updateFormData("audience", audiences);
    },
    [updateFormData],
  );

  // Predefined audience suggestions
  const suggestions = [
    "Small business owners",
    "Marketing professionals",
    "Students",
    "Working parents",
    "Tech enthusiasts",
    "Healthcare professionals",
    "Remote workers",
    "Entrepreneurs",
    "Content creators",
    "Young professionals",
    "Senior executives",
    "Freelancers",
  ];

  const currentAudiences = formData.audience || [];

  const addSuggestion = (suggestion: string) => {
    if (!currentAudiences.includes(suggestion)) {
      handleChange([...currentAudiences, suggestion]);
    }
  };

  const removeSuggestion = (suggestion: string) => {
    handleChange(
      currentAudiences.filter((audience) => audience !== suggestion),
    );
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <ChipInput
        value={currentAudiences}
        onChange={handleChange}
        placeholder="Type an audience and press Enter..."
        disabled={isLoading}
        error={error}
        maxItems={5}
        icon={<Users className="w-5 h-5" />}
      />

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            Popular audiences (click to add):
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => {
              const isSelected = currentAudiences.includes(suggestion);

              return (
                <button
                  key={`suggestion-${suggestion}`}
                  type="button"
                  onClick={() =>
                    isSelected
                      ? removeSuggestion(suggestion)
                      : addSuggestion(suggestion)
                  }
                  disabled={
                    isLoading || (!isSelected && currentAudiences.length >= 5)
                  }
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg transition-all duration-200",
                    "border border-border hover:border-primary/50",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-1">
                    {isSelected ? (
                      <>
                        {suggestion}
                        <span className="text-xs">✓</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        {suggestion}
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Selected Count */}
      {currentAudiences.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="text-sm text-muted-foreground"
        >
          {currentAudiences.length} audience
          {currentAudiences.length !== 1 ? "s" : ""} selected
          {currentAudiences.length >= 5 && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">
              (Maximum reached)
            </span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
