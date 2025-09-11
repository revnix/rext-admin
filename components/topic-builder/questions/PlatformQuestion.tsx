/**
 * Platform Selection Question Component
 *
 * Single-select for platform/channel selection (shown conditionally).
 */

"use client";

import { motion } from "framer-motion";
import {
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react";
import { SingleSelectCard } from "@/components/ui/typeform/single-select-card";
import { TextInput } from "@/components/ui/typeform/text-input";
import {
  getMotionVariants,
  questionItemVariants,
  useReducedMotion,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { Platform, TopicBuilderFormData } from "@/types/topic-builder";
import { PLATFORM_OPTIONS } from "@/types/topic-builder";
import type { QuestionConfig } from "@/types/wizard";

export interface PlatformQuestionProps {
  question: QuestionConfig;
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: TopicBuilderFormData[keyof TopicBuilderFormData],
  ) => void;
  error?: string;
  isLoading?: boolean;
}

export function PlatformQuestion({
  question: _question,
  formData,
  updateFormData,
  error: _error,
  isLoading = false,
}: PlatformQuestionProps) {
  const prefersReducedMotion = useReducedMotion();
  const itemVariants = getMotionVariants(
    questionItemVariants,
    prefersReducedMotion,
  );

  const handleSelect = (value: Platform) => {
    updateFormData("platform", value);
    // Clear the custom platform when switching away from "other"
    if (value !== "other") {
      updateFormData("platform_other", "");
    }
  };

  const handleCustomPlatformChange = (value: string) => {
    updateFormData("platform_other", value);
  };

  const getIcon = (value: string) => {
    switch (value) {
      case "facebook":
        return <Facebook className="w-5 h-5" />;
      case "instagram":
        return <Instagram className="w-5 h-5" />;
      case "twitter":
        return <Twitter className="w-5 h-5" />;
      case "linkedin":
        return <Linkedin className="w-5 h-5" />;
      case "youtube":
        return <Youtube className="w-5 h-5" />;
      case "website":
      case "blog":
        return <Globe className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  const getDescription = (value: string) => {
    switch (value) {
      case "facebook":
        return "Professional and personal networking";
      case "instagram":
        return "Visual content and stories";
      case "twitter":
        return "Short-form updates and conversations";
      case "linkedin":
        return "Professional networking and B2B content";
      case "tiktok":
        return "Short-form video content";
      case "youtube":
        return "Long-form video content";
      default:
        return "";
    }
  };

  // Extended options for platform selection
  const allPlatformOptions = [
    ...PLATFORM_OPTIONS,
    { label: "TikTok", value: "tiktok" },
    { label: "Website/Blog", value: "website" },
    { label: "Other", value: "other" },
  ];

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {allPlatformOptions.map((option, index) => (
          <SingleSelectCard
            key={`platform-${option.value}-${index}`}
            label={option.label}
            description={getDescription(option.value)}
            value={option.value}
            selected={formData.platform === option.value}
            onSelect={() => handleSelect(option.value as Platform)}
            icon={getIcon(option.value)}
            disabled={isLoading}
            className={cn(
              "transition-all duration-150 h-auto",
              formData.platform === option.value && "shadow-lg",
            )}
            delay={index * 0.05}
          />
        ))}
      </div>

      {/* Custom Platform Input */}
      {formData.platform === "other" && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mt-6"
        >
          <TextInput
            value={formData.platform_other || ""}
            onChange={handleCustomPlatformChange}
            placeholder="Please specify your platform..."
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
