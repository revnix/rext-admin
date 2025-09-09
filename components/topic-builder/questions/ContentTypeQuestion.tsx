/**
 * Content Type Selection Question Component
 *
 * Single-select for content format/type selection.
 */

"use client";

import { motion } from "framer-motion";
import { BookOpen, FileText, Image, Mic, Share2, Video } from "lucide-react";
import { SingleSelectCard } from "@/components/ui/typeform/single-select-card";
import { TextInput } from "@/components/ui/typeform/text-input";
import {
  getMotionVariants,
  questionItemVariants,
  useReducedMotion,
} from "@/lib/animations";
import type { ContentType, TopicBuilderFormData } from "@/types/topic-builder";
import { CONTENT_TYPE_OPTIONS } from "@/types/topic-builder";
import type { QuestionConfig } from "@/types/wizard";

export interface ContentTypeQuestionProps {
  question: QuestionConfig;
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  error?: string;
  isLoading?: boolean;
}

export function ContentTypeQuestion({
  question: _question,
  formData,
  updateFormData,
  error: _error,
  isLoading = false,
}: ContentTypeQuestionProps) {
  const prefersReducedMotion = useReducedMotion();
  const itemVariants = getMotionVariants(
    questionItemVariants,
    prefersReducedMotion,
  );

  const handleSelect = (value: ContentType) => {
    updateFormData("content_type", value);
    // Clear the custom content type when switching away from "other"
    if (value !== "other") {
      updateFormData("content_type_other", "");
    }
    // Clear platform when switching content types
    updateFormData("platform", undefined);
    updateFormData("platform_other", "");
  };

  const handleCustomContentTypeChange = (value: string) => {
    updateFormData("content_type_other", value);
  };

  const getIcon = (value: string) => {
    switch (value) {
      case "blog-post":
        return <FileText className="w-5 h-5" />;
      case "social-media":
        return <Share2 className="w-5 h-5" />;
      case "video-content":
        return <Video className="w-5 h-5" />;
      case "podcast":
        return <Mic className="w-5 h-5" />;
      case "infographic":
        return <Image className="w-5 h-5" />;
      case "ebook-guide":
        return <BookOpen className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getDescription = (value: string) => {
    switch (value) {
      case "blog-post":
        return "Long-form written content for websites and blogs";
      case "social-media":
        return "Short-form content for social platforms";
      case "video-content":
        return "Video content for YouTube, TikTok, and other platforms";
      case "podcast":
        return "Audio content and show episodes";
      case "infographic":
        return "Visual content with data and graphics";
      case "ebook-guide":
        return "Comprehensive guides and downloadable resources";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CONTENT_TYPE_OPTIONS.map((option, index) => (
          <SingleSelectCard
            key={`content-type-${option.value}-${index}`}
            label={option.label}
            description={getDescription(option.value)}
            value={option.value}
            selected={formData.content_type === option.value}
            onSelect={() => handleSelect(option.value as ContentType)}
            icon={getIcon(option.value)}
            disabled={isLoading}
            className="transition-all duration-200 h-auto p-4"
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Custom Content Type Input */}
      {formData.content_type === "other" && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mt-6"
        >
          <TextInput
            value={formData.content_type_other || ""}
            onChange={handleCustomContentTypeChange}
            placeholder="Please specify your content type..."
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
