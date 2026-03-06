/**
 * Audience Selection Question Component
 *
 * Chip-style input for target audience selection/creation.
 */

"use client";

import { motion } from "framer-motion";
import { Plus, Users } from "lucide-react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { ChipInput } from "@/components/ui/typeform/chip-input";
import { useAudienceSuggestions } from "@/hooks/use-contextual-suggestions";
import { useReducedMotion } from "@/lib/animations";
import { questionItemVariants, useTypeformMotionVariants } from "@/components/ui/typeform/motion";
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
  form: UseFormReturn<TopicBuilderFormData>;
  error?: string;
  isLoading?: boolean;
  onStepAdvance?: () => void;
}

export function AudienceQuestion({
  question: _question,
  formData: _formData,
  updateFormData,
  form,
  error,
  isLoading = false,
  onStepAdvance,
}: AudienceQuestionProps) {
  const prefersReducedMotion = useReducedMotion();
  const itemVariants = useTypeformMotionVariants(questionItemVariants);

  const currentAudiences = _formData.audience || [];

  // Get contextual audience suggestions based on selected industry (Task 7.2)
  const contextualSuggestions = useAudienceSuggestions(
    _formData.industry,
    currentAudiences,
  );

  // Fallback to generic suggestions if no industry selected
  const fallbackSuggestions = [
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

  // Use contextual suggestions if available, otherwise fallback
  const suggestions =
    contextualSuggestions.length > 0
      ? contextualSuggestions
      : fallbackSuggestions;

  const addSuggestion = (suggestion: string) => {
    if (!currentAudiences.includes(suggestion)) {
      const newAudiences = [...currentAudiences, suggestion];
      updateFormData("audience", newAudiences);
    }
  };

  const removeSuggestion = (suggestion: string) => {
    const newAudiences = currentAudiences.filter(
      (audience) => audience !== suggestion,
    );
    updateFormData("audience", newAudiences);
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <Controller
        name="audience"
        control={form.control}
        render={({ field, fieldState }) => (
          <ChipInput
            value={field.value || []}
            onChange={(values) => {
              field.onChange(values);
              updateFormData("audience", values);
            }}
            placeholder="Type an audience and press Enter..."
            disabled={isLoading}
            error={fieldState.error?.message || error}
            maxItems={5}
            icon={<Users className="w-5 h-5" />}
            enableDualEnter={true}
            onStepAdvance={onStepAdvance}
          />
        )}
      />

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            {contextualSuggestions.length > 0 && _formData.industry
              ? `Audiences for ${_formData.industry} industry (click to add):`
              : "Popular audiences (click to add):"}
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
                    "px-3 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer",
                    "border hover:border-primary/50 shadow-sm hover:shadow-md",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                      : "bg-background hover:bg-primary/5 text-foreground border-border hover:text-primary",
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
