"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingIndicatorVariantsProps {
  step: string;
  isLoading: boolean;
  className?: string;
}

const STEP_DATA: Record<string, { title: string }> = {
  keyword: { title: "Analyzing Keyword..." },
  topic: { title: "Generating Topics..." },
  suggestions: { title: "Generating Suggestions..." },
  outline: { title: "Generating Content Outline..." },
  content: { title: "Generating Content..." },
  default: { title: "Loading..." },
};

export function LoadingIndicatorVariants({
  step,
  isLoading,
  className,
}: LoadingIndicatorVariantsProps) {
  const data = STEP_DATA[step] || STEP_DATA.default;
  const { title } = data;

  if (!isLoading) return null;

  // Selected Variant 7: Skeleton / Shimmer (as requested)
  return (
    <div className={cn("space-y-4 w-full", className)}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded-full w-full animate-pulse" />
          <div className="h-2 bg-gray-50 rounded-full w-1/2 animate-pulse" />
        </div>
      </div>
      <div className="border rounded-xl p-4 flex items-center justify-between border-slate-100 bg-slate-50/50">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> {title}
        </span>
      </div>
    </div>
  );
}
