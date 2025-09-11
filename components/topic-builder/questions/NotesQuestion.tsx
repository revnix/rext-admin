/**
 * Notes Question Component
 *
 * Optional textarea for additional notes and instructions.
 */

"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { useEffect, useRef } from "react";
import { TextAreaInput } from "@/components/ui/typeform/textarea-input";
import {
  getMotionVariants,
  questionItemVariants,
  useReducedMotion,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import type { QuestionConfig } from "@/types/wizard";

export interface NotesQuestionProps {
  question: QuestionConfig;
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  error?: string;
  isLoading?: boolean;
}

export function NotesQuestion({
  question: _question,
  formData,
  updateFormData,
  error,
  isLoading = false,
}: NotesQuestionProps) {
  const prefersReducedMotion = useReducedMotion();
  const itemVariants = getMotionVariants(
    questionItemVariants,
    prefersReducedMotion,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the textarea when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (value: string) => {
    updateFormData("notes", value);
  };

  const suggestions = [
    "Include trending hashtags for social media",
    "Focus on actionable tips and advice",
    "Add personal stories or case studies",
    "Include data and statistics to support points",
    "Make it beginner-friendly",
    "Target seasonal or current events",
  ];

  const currentNotes = formData.notes || "";

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <TextAreaInput
        ref={textareaRef}
        value={currentNotes}
        onChange={handleChange}
        placeholder="e.g., Focus on actionable tips, include real examples, make it beginner-friendly..."
        disabled={isLoading}
        error={error}
        maxLength={500}
        showCount
        rows={4}
        icon={<FileText className="w-5 h-5" />}
      />

      {/* Suggestions */}
      {!currentNotes && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            Need inspiration? Try these:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={`suggestion-${suggestion}`}
                type="button"
                onClick={() => handleChange(suggestion)}
                disabled={isLoading}
                className={cn(
                  "px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg",
                  "transition-colors duration-150 text-left cursor-pointer",
                  "hover:text-foreground text-muted-foreground",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Optional Label */}
      <motion.div
        variants={itemVariants}
        className="text-xs text-muted-foreground/80 text-center"
      >
        This step is optional. You can skip it if you don't have specific
        requirements.
      </motion.div>
    </motion.div>
  );
}
