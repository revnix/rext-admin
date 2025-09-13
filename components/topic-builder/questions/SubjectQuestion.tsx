/**
 * Subject Input Question Component
 *
 * Text input for users to specify their topic/subject.
 */

"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { useEffect, useRef } from "react";
import { TextInput } from "@/components/ui/typeform/text-input";
import {
  getMotionVariants,
  questionItemVariants,
  useReducedMotion,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import type { QuestionConfig } from "@/types/wizard";

export interface SubjectQuestionProps {
  question: QuestionConfig;
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  error?: string;
  isLoading?: boolean;
}

export function SubjectQuestion({
  question: _question,
  formData,
  updateFormData,
  error,
  isLoading = false,
}: SubjectQuestionProps) {
  const prefersReducedMotion = useReducedMotion();
  const itemVariants = getMotionVariants(
    questionItemVariants,
    prefersReducedMotion,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (value: string) => {
    updateFormData("subject", value);
  };

  const suggestions = [
    "AI and machine learning in healthcare",
    "Sustainable business practices",
    "Remote work productivity tips",
    "Digital marketing trends",
    "Personal finance management",
    "Health and wellness routines",
  ];

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <TextInput
        ref={inputRef}
        value={formData.subject || ""}
        onChange={handleChange}
        placeholder="e.g., Digital marketing strategies for small businesses"
        disabled={isLoading}
        error={error}
        className="text-lg"
        maxLength={200}
        showCount
        icon={<Lightbulb className="w-5 h-5" />}
      />

      {/* Suggestions */}
      {!formData.subject && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            Popular topics (click to use):
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={`subject-suggestion-${suggestion}`}
                type="button"
                onClick={() => handleChange(suggestion)}
                disabled={isLoading}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg border transition-all duration-200",
                  "border-border hover:border-primary/50 cursor-pointer",
                  "bg-background hover:bg-primary/5 text-foreground",
                  "hover:text-primary shadow-sm hover:shadow-md",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                )}
              >
                <span className="flex items-center gap-1">
                  <span className="text-primary">+</span>
                  {suggestion}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
