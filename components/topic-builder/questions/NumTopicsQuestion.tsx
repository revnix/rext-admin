/**
 * Number of Topics Question Component
 *
 * Number input for selecting how many topics to generate.
 */

"use client";

import { motion } from "framer-motion";
import { Hash, Minus, Plus } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/typeform/number-input";
import {
  getMotionVariants,
  questionItemVariants,
  useReducedMotion,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import type { QuestionConfig } from "@/types/wizard";

export interface NumTopicsQuestionProps {
  question: QuestionConfig;
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  error?: string;
  isLoading?: boolean;
}

export function NumTopicsQuestion({
  question: _question,
  formData,
  updateFormData,
  error,
  isLoading = false,
}: NumTopicsQuestionProps) {
  const prefersReducedMotion = useReducedMotion();
  const itemVariants = getMotionVariants(
    questionItemVariants,
    prefersReducedMotion,
  );

  const handleChange = useCallback(
    (value: number) => {
      updateFormData("num_topics", value);
    },
    [updateFormData],
  );

  const handleIncrement = () => {
    const current = formData.num_topics || 5;
    if (current < 20) {
      handleChange(current + 1);
    }
  };

  const handleDecrement = () => {
    const current = formData.num_topics || 5;
    if (current > 1) {
      handleChange(current - 1);
    }
  };

  const currentValue = formData.num_topics || 5;

  // Preset options for quick selection
  const presets = [5, 10, 15, 20];

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Number Input with Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={isLoading || currentValue <= 1}
          className="h-12 w-12"
        >
          <Minus className="w-4 h-4" />
        </Button>

        <div className="text-center">
          <NumberInput
            value={currentValue}
            onChange={handleChange}
            min={1}
            max={20}
            disabled={isLoading}
            error={error}
            className="text-center text-2xl font-bold w-20 h-12"
            icon={<Hash className="w-5 h-5" />}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={isLoading || currentValue >= 20}
          className="h-12 w-12"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Preset Options */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground text-center">
          Quick select:
        </div>
        <div className="flex justify-center gap-2">
          {presets.map((preset) => (
            <button
              key={`preset-${preset}`}
              type="button"
              onClick={() => handleChange(preset)}
              disabled={isLoading}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                "border border-border hover:border-primary/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                currentValue === preset
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {preset} topics
            </button>
          ))}
        </div>
      </motion.div>

      {/* Helpful Context */}
      <motion.div variants={itemVariants} className="text-center space-y-2">
        <div className="text-sm text-muted-foreground">
          {currentValue <= 5 && "Perfect for focused exploration"}
          {currentValue > 5 &&
            currentValue <= 10 &&
            "Great balance of variety and manageability"}
          {currentValue > 10 &&
            currentValue <= 15 &&
            "Lots of options to choose from"}
          {currentValue > 15 && "Maximum variety and inspiration"}
        </div>

        <div className="text-xs text-muted-foreground/80">
          Each topic includes title, angle, and detailed explanation
        </div>
      </motion.div>
    </motion.div>
  );
}
