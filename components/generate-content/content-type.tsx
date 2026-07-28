"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getContentTypeConfig } from "@/config/content-types";

interface ContentTypeProps {
  recommendedContentType?: string | null;
  instruction: string;
  contentTypes: string[];
  handleContentTypeSelect: (type: string) => void;
}

export default function ContentType({
  recommendedContentType,
  instruction,
  contentTypes,
  handleContentTypeSelect,
}: ContentTypeProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    if (
      recommendedContentType &&
      contentTypes.includes(recommendedContentType)
    ) {
      setSelectedType(recommendedContentType);
    }
  }, [recommendedContentType, contentTypes]);

  return (
    <div className="w-full py-3">
      <div className="mb-4">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-foreground tracking-tight"
        >
          {instruction}
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contentTypes.map((type: string, index: number) => {
          const { icon: Icon, description } = getContentTypeConfig(type);

          const isSelected = selectedType === type;
          const isRecommended = recommendedContentType === type;

          return (
            <motion.button
              key={type}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedType(type)}
              className={cn(
                "group cursor-pointer relative flex flex-col items-start text-left p-4 rounded-xl border transition-all duration-300 w-full outline-none h-full",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "bg-card border-border hover:border-primary active:scale-[0.98]",
              )}
            >
              {isRecommended && (
                <span className="absolute top-3 right-3 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Recommended
                </span>
              )}

              <div
                className={cn(
                  "mb-1 p-3.5 rounded-xl transition-colors",
                  isSelected
                    ? "bg-primary/10"
                    : "bg-muted group-hover:bg-accent",
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 transition-colors",
                    isSelected
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-primary",
                  )}
                />
              </div>

              <div className="flex-1 w-full mb-2">
                <h3
                  className={cn(
                    "text-md font-bold mb-3 capitalize transition-colors",
                    isSelected
                      ? "text-primary"
                      : "text-foreground group-hover:text-primary",
                  )}
                >
                  {type.replace(/[_-]/g, " ")}
                </h3>

                <p className="text-xs text-muted-foreground leading-[1.6]">
                  {description}
                </p>
              </div>

              {isSelected && (
                <div className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none" />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={!selectedType}
          onClick={() => selectedType && handleContentTypeSelect(selectedType)}
          className={cn(
            "px-6 py-2.5 rounded-lg font-medium transition-all cursor-pointer",
            selectedType
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
