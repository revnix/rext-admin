/**
 * Tone Selection Question Component
 *
 * Multi-select for tone and voice preferences.
 */

"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  BookOpen,
  Briefcase,
  Heart,
  MessageCircle,
  Smile,
  Users,
  Zap,
} from "lucide-react";
import { MultiSelectCard } from "@/components/ui/typeform/multi-select-card";
import { TextInput } from "@/components/ui/typeform/text-input";
import {
  getMotionVariants,
  questionItemVariants,
  useReducedMotion,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { ToneType, TopicBuilderFormData } from "@/types/topic-builder";
import { TONE_OPTIONS } from "@/types/topic-builder";
import type { QuestionConfig } from "@/types/wizard";

export interface ToneQuestionProps {
  question: QuestionConfig;
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  error?: string;
  isLoading?: boolean;
}

export function ToneQuestion({
  question: _question,
  formData,
  updateFormData,
  error: _error,
  isLoading = false,
}: ToneQuestionProps) {
  const prefersReducedMotion = useReducedMotion();
  const itemVariants = getMotionVariants(
    questionItemVariants,
    prefersReducedMotion,
  );

  const handleToggle = (value: ToneType) => {
    const currentTones = formData.tone || [];
    const isSelected = currentTones.includes(value);

    let newTones: ToneType[];
    if (isSelected) {
      newTones = currentTones.filter((t) => t !== value);
    } else {
      newTones = [...currentTones, value];
    }

    updateFormData("tone", newTones);

    // Clear the custom tone when switching away from "other"
    if (value === "other" && isSelected) {
      updateFormData("tone_other", "");
    }
  };

  const handleCustomToneChange = (value: string) => {
    updateFormData("tone_other", value);
  };

  const getIcon = (value: string) => {
    switch (value) {
      case "professional-formal":
        return <Briefcase className="w-5 h-5" />;
      case "casual-conversational":
        return <MessageCircle className="w-5 h-5" />;
      case "friendly-warm":
        return <Heart className="w-5 h-5" />;
      case "humorous-playful":
        return <Smile className="w-5 h-5" />;
      case "serious-academic":
        return <BookOpen className="w-5 h-5" />;
      case "technical-analytical":
        return <BarChart className="w-5 h-5" />;
      case "simple-accessible":
        return <Users className="w-5 h-5" />;
      case "inspirational-uplifting":
        return <Zap className="w-5 h-5" />;
      default:
        return <MessageCircle className="w-5 h-5" />;
    }
  };

  const getDescription = (value: string) => {
    switch (value) {
      case "professional-formal":
        return "Business-like, polished, and authoritative";
      case "casual-conversational":
        return "Relaxed, natural, and approachable";
      case "friendly-warm":
        return "Welcoming, personable, and caring";
      case "humorous-playful":
        return "Light-hearted, fun, and entertaining";
      case "serious-academic":
        return "Scholarly, detailed, and research-focused";
      case "technical-analytical":
        return "Data-driven, precise, and logical";
      case "simple-accessible":
        return "Easy to understand for all audiences";
      case "inspirational-uplifting":
        return "Motivating, positive, and empowering";
      default:
        return "";
    }
  };

  const currentTones = formData.tone || [];
  const hasOtherSelected = currentTones.includes("other");

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* All tone options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TONE_OPTIONS.map((option, index) => {
          const isSelected = currentTones.includes(option.value as ToneType);
          return (
            <MultiSelectCard
              key={`tone-${option.value}-${index}`}
              label={option.label}
              description={getDescription(option.value)}
              value={option.value}
              selected={isSelected}
              onToggle={() => handleToggle(option.value as ToneType)}
              icon={getIcon(option.value)}
              disabled={isLoading}
              className={cn(
                "transition-all duration-200 h-auto p-4",
                isSelected && "ring-2 ring-primary shadow-lg",
              )}
              delay={index * 0.1}
            />
          );
        })}
      </div>

      {/* Custom Tone Input */}
      {hasOtherSelected && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mt-6"
        >
          <TextInput
            value={formData.tone_other || ""}
            onChange={handleCustomToneChange}
            placeholder="Please describe your desired tone..."
            disabled={isLoading}
            maxLength={100}
            className="w-full"
            autoFocus
          />
        </motion.div>
      )}

      {/* Selection Count */}
      {currentTones.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="text-sm text-muted-foreground"
        >
          {currentTones.length} tone{currentTones.length !== 1 ? "s" : ""}{" "}
          selected
          {currentTones.length >= 3 && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">
              (Consider focusing on 1-2 main tones for consistency)
            </span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
