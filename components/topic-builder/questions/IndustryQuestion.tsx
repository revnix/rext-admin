/**
 * Industry Selection Question Component
 *
 * Single-select dropdown for industry/domain selection.
 */

"use client";

import { motion } from "framer-motion";
import {
  Building,
  Code,
  DollarSign,
  GraduationCap,
  Heart,
  Plane,
} from "lucide-react";
import { SingleSelectCard } from "@/components/ui/typeform/single-select-card";
import { TextInput } from "@/components/ui/typeform/text-input";
import {
  getMotionVariants,
  questionItemVariants,
  useReducedMotion,
} from "@/lib/animations";
import type { Industry, TopicBuilderFormData } from "@/types/topic-builder";
import { INDUSTRY_OPTIONS } from "@/types/topic-builder";
import type { QuestionConfig } from "@/types/wizard";

export interface IndustryQuestionProps {
  question: QuestionConfig;
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  error?: string;
  isLoading?: boolean;
}

export function IndustryQuestion({
  question: _question,
  formData,
  updateFormData,
  error: _error,
  isLoading = false,
}: IndustryQuestionProps) {
  const prefersReducedMotion = useReducedMotion();
  const itemVariants = getMotionVariants(
    questionItemVariants,
    prefersReducedMotion,
  );

  const handleSelect = (value: Industry) => {
    updateFormData("industry", value);
    // Clear the custom industry when switching away from "other"
    if (value !== "other") {
      updateFormData("industry_other", "");
    }
  };

  const handleCustomIndustryChange = (value: string) => {
    updateFormData("industry_other", value);
  };

  const getIcon = (value: string) => {
    switch (value) {
      case "technology":
        return <Code className="w-5 h-5" />;
      case "healthcare":
        return <Heart className="w-5 h-5" />;
      case "finance":
        return <DollarSign className="w-5 h-5" />;
      case "education":
        return <GraduationCap className="w-5 h-5" />;
      case "travel":
        return <Plane className="w-5 h-5" />;
      case "business":
        return <Building className="w-5 h-5" />;
      default:
        return <Building className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {INDUSTRY_OPTIONS.map((option, index) => (
          <SingleSelectCard
            key={`industry-${option.value}-${index}`}
            label={option.label}
            value={option.value}
            selected={formData.industry === option.value}
            onSelect={() => handleSelect(option.value as Industry)}
            icon={getIcon(option.value)}
            disabled={isLoading}
            className="transition-all duration-150 h-auto"
            delay={index * 0.05}
          />
        ))}
      </div>

      {/* Custom Industry Input */}
      {formData.industry === "other" && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mt-6"
        >
          <TextInput
            value={formData.industry_other || ""}
            onChange={handleCustomIndustryChange}
            placeholder="Please specify your industry..."
            disabled={isLoading}
            maxLength={100}
            className="w-full"
            autoFocus
          />
        </motion.div>
      )}
    </motion.div>
  );
}
