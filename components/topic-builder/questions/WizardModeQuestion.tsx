/**
 * Wizard Mode Selection Question Component
 *
 * Allows users to choose between subject-first or industry-first flow.
 */

"use client";

import { motion } from "framer-motion";
import { BookOpen, Building2 } from "lucide-react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { SingleSelectCard } from "@/components/ui/typeform/single-select-card";
import { useReducedMotion } from "@/lib/animations";
import {
  questionItemVariants,
  useTypeformMotionVariants,
} from "@/components/ui/typeform/motion";
import type { TopicBuilderFormData, WizardMode } from "@/types/topic-builder";
import { WIZARD_MODE_OPTIONS } from "@/types/topic-builder";
import type { QuestionConfig } from "@/types/wizard";

export interface WizardModeQuestionProps {
  question: QuestionConfig;
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  form: UseFormReturn<TopicBuilderFormData>;
  error?: string;
  isLoading?: boolean;
}

export function WizardModeQuestion({
  question: _question,
  formData: _formData,
  updateFormData,
  form,
  error: _error,
  isLoading = false,
}: WizardModeQuestionProps) {
  const _prefersReducedMotion = useReducedMotion();
  const itemVariants = useTypeformMotionVariants(questionItemVariants);

  const getIcon = (value: string) => {
    switch (value) {
      case "subject-first":
        return <BookOpen className="w-6 h-6" />;
      case "industry-first":
        return <Building2 className="w-6 h-6" />;
      default:
        return null;
    }
  };

  const getDescription = (value: string) => {
    switch (value) {
      case "subject-first":
        return "Perfect if you already know what topic you want to create content about";
      case "industry-first":
        return "Great for discovering new topic opportunities within your industry";
      default:
        return "";
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <Controller
        name="wizardMode"
        control={form.control}
        render={({ field, fieldState }) => (
          <div className="space-y-4">
            {fieldState.error && (
              <div className="text-destructive text-sm mb-4">
                {fieldState.error.message}
              </div>
            )}
            {WIZARD_MODE_OPTIONS.map((option, index) => {
              const isRecommended = option.value === "industry-first";
              return (
                <SingleSelectCard
                  key={option.value}
                  label={option.label}
                  description={getDescription(option.value)}
                  selected={field.value === option.value}
                  onSelect={() => {
                    field.onChange(option.value);
                    updateFormData("wizardMode", option.value as WizardMode);
                  }}
                  icon={getIcon(option.value)}
                  disabled={isLoading}
                  className={`transition-all duration-200 ${
                    isRecommended ? "border-foreground" : ""
                  }`}
                  delay={index * 0.1}
                />
              );
            })}
          </div>
        )}
      />
    </motion.div>
  );
}
