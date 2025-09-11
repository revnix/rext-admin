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
    "Focus on actionable tips and step-by-step advice that readers can immediately implement. Include specific examples, tools, or resources that add practical value to your content.",
    "Incorporate data-driven insights and compelling statistics to support your main points. Use recent research, surveys, or industry reports to build credibility and authority.",
    "Add personal stories, case studies, or real-world examples that illustrate your concepts. These help readers connect emotionally and understand practical applications better.",
    "Make the content beginner-friendly by explaining technical terms, providing context for industry concepts, and structuring information from basic to advanced levels.",
    "Include trending topics or seasonal themes relevant to your industry. Reference current events, popular discussions, or timely challenges your audience is facing.",
    "Optimize for your specific platform by including relevant hashtags, keywords, or formatting that performs well. Consider your audience's preferred content consumption style.",
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
        maxLength={800}
        showCount
        rows={6}
        icon={<FileText className="w-5 h-5" />}
      />

      {/* Suggestions */}
      {!currentNotes && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            Need inspiration? Try these:
          </div>
          <div className="grid grid-cols-1 gap-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.slice(0, 50)}
                type="button"
                onClick={() => handleChange(suggestion)}
                disabled={isLoading}
                className={cn(
                  "px-4 py-3 text-sm bg-muted hover:bg-muted/80 rounded-xl border border-muted/50",
                  "transition-all duration-150 text-left cursor-pointer",
                  "hover:text-foreground text-muted-foreground hover:shadow-sm",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "leading-relaxed break-words hyphens-auto",
                )}
                style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
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
