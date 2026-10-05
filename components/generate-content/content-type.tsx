"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { getContentTypeConfig } from "@/config/content-types";

interface ContentTypeProps {
  recommendedContentType?: string | null;
  instruction: string;
  contentTypes: string[];
  intent?: string;
  keyword?: string | null;
  handleContentTypeSelect: (type: string) => void;
}

export default function ContentType({
  recommendedContentType,
  instruction,
  contentTypes,
  intent,
  keyword,
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
          className="text-2xl font-semibold text-foreground tracking-tight"
        >
          {instruction}
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contentTypes.map((type: string, index: number) => {
          const { icon: Icon, description } = getContentTypeConfig(type);

          const keywordDescription = description
            .replace(/\{keyword\}/g, keyword?.trim() || "this topic")
            .replace(/\{intent\}/g, intent?.trim() || "relevant");

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
                "group cursor-pointer relative flex flex-col items-start text-left p-4 rounded-md border transition-colors w-full outline-none h-full focus-visible:ring-2 focus-visible:ring-foreground/20",
                isSelected
                  ? "border-foreground bg-card"
                  : "bg-card border-border hover:border-foreground/40 active:scale-[0.98]",
              )}
            >
              {isRecommended && (
                <span className="absolute top-3 right-3 rounded-md border border-foreground px-2 py-0.5 text-xs font-medium text-foreground">
                  Recommended
                </span>
              )}

              <div
                className={cn(
                  "mb-1 p-3.5 rounded-md transition-colors",
                  isSelected ? "bg-foreground" : "bg-muted",
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 transition-colors",
                    isSelected ? "text-background" : "text-foreground",
                  )}
                />
              </div>

              <div className="flex-1 w-full mb-2">
                <h3
                  className={cn(
                    "text-md font-semibold mb-3 capitalize transition-colors",
                    isSelected ? "text-foreground" : "text-foreground",
                  )}
                >
                  {type.replace(/[_-]/g, " ")}
                </h3>

                <p className="text-xs text-muted-foreground leading-[1.6]">
                  {keywordDescription}
                </p>
              </div>
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
            "px-6 py-2.5 rounded-md font-medium transition-all cursor-pointer",
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
