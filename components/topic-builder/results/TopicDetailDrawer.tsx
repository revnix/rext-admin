"use client";

import {
  Check,
  Copy,
  FileText,
  Globe,
  Hash,
  PenTool,
  Save,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { GeneratedTopic } from "@/types/topic-builder";

interface TopicDetailDrawerProps {
  topic: GeneratedTopic | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (topicId: string) => Promise<void> | void;
  onNavigateToContent?: (topicId: string) => void;
  onCopy?: (topicId: string) => void;
  className?: string;
}

export function TopicDetailDrawer({
  topic,
  isOpen,
  onClose,
  onSave,
  onNavigateToContent,
  onCopy,
  className,
}: TopicDetailDrawerProps) {
  // Calculate overall score for circular progress
  const overallScore = topic
    ? Math.round(
        ((topic.scores.relevance +
          topic.scores.seo_potential +
          topic.scores.trend_level +
          topic.scores.uniqueness +
          topic.scores.reader_interest +
          topic.scores.actionable_potential +
          topic.scores.brand_alignment +
          topic.scores.controversy) /
          8) *
          100,
      )
    : 0;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = async () => {
    if (!topic || !onSave) return;
    await onSave(topic.id);
  };

  const handleWriteContent = () => {
    if (!topic || !onNavigateToContent) return;
    onNavigateToContent(topic.id);
  };

  const handleCopy = async () => {
    if (!topic) return;

    if (onCopy) {
      onCopy(topic.id);
    } else {
      // Default copy behavior
      await navigator.clipboard.writeText(
        `${topic.title}\n${topic.description || topic.angle}`,
      );
    }
  };

  if (!topic) return null;

  return (
    <TooltipProvider>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          style={{
            width: "min(95vw, 1200px)",
            maxWidth: "none",
          }}
          className={cn(
            // Responsive width adjustments
            "sm:!w-[50vw] md:!w-[45vw] lg:!w-[40vw] xl:!w-[35vw] 2xl:!w-[30vw]",
            // Layout and spacing
            "p-0 gap-0 flex flex-col h-full overflow-hidden",
            // Hide built-in close button
            "[&>button]:hidden",
            className,
          )}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="px-6 py-5 border-b bg-gradient-to-r from-background/98 to-muted/30 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-5 min-w-0 flex-1">
                  {/* Circular Progress Score */}
                  <div className="flex-shrink-0">
                    <CircularProgress
                      value={overallScore}
                      size="lg"
                      className="text-primary"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-2xl font-bold line-clamp-2 text-left text-foreground leading-tight">
                      {topic.title}
                    </SheetTitle>

                    {/* Saved Indicator */}
                    {(topic._optimisticSaved || topic.is_saved) && (
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-medium shadow-sm",
                            topic._optimisticSaved && !topic.is_saved
                              ? "bg-amber-500"
                              : "bg-green-500",
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {topic._optimisticSaved && !topic.is_saved
                            ? "Saving..."
                            : "Saved to library"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-10 w-10 p-0 hover:bg-secondary"
                  aria-label="Close drawer"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </SheetHeader>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {/* Description/Angle */}
              <div className="bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-purple-50/60 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 rounded-xl p-6 border border-blue-200/60 dark:border-blue-800/60">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Topic Overview
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {topic.description || topic.angle}
                </p>
              </div>

              {/* Why It Works */}
              {topic.why_it_works && (
                <div className="bg-green-50/50 dark:bg-green-950/20 rounded-xl p-6 border border-green-200/50 dark:border-green-800/50">
                  <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-3">
                    <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Why This Topic Works
                  </h3>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {topic.why_it_works}
                  </p>
                </div>
              )}

              {/* Detailed Scores */}
              <div className="bg-blue-50/30 dark:bg-blue-950/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-start justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Performance Scores
                  </h3>
                  <div className="text-xs text-muted-foreground bg-white/60 dark:bg-background/60 px-2 py-1 rounded-md border border-blue-200/40 dark:border-blue-700/40">
                    Based on your configuration
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="w-5 h-5 text-primary mr-1" />
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(topic.scores.relevance * 100)}%
                      </div>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Relevance
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="w-5 h-5 text-primary mr-1" />
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(topic.scores.seo_potential * 100)}%
                      </div>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      SEO
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
                    <div className="flex items-center justify-center mb-2">
                      <Zap className="w-5 h-5 text-primary mr-1" />
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(topic.scores.trend_level * 100)}%
                      </div>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Trending
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
                    <div className="flex items-center justify-center mb-2">
                      <Sparkles className="w-5 h-5 text-primary mr-1" />
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(topic.scores.uniqueness * 100)}%
                      </div>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Unique
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-5 h-5 text-primary mr-1" />
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(topic.scores.reader_interest * 100)}%
                      </div>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Interest
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
                    <div className="flex items-center justify-center mb-2">
                      <PenTool className="w-5 h-5 text-primary mr-1" />
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(topic.scores.actionable_potential * 100)}%
                      </div>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Actionable
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
                    <div className="flex items-center justify-center mb-2">
                      <Check className="w-5 h-5 text-primary mr-1" />
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(topic.scores.brand_alignment * 100)}%
                      </div>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Brand Fit
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
                    <div className="flex items-center justify-center mb-2">
                      <Globe className="w-5 h-5 text-primary mr-1" />
                      <div className="text-2xl font-bold text-primary">
                        {Math.round((1 - topic.scores.controversy) * 100)}%
                      </div>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Safe
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags/Keywords */}
              {topic.tags && topic.tags.length > 0 && (
                <div className="bg-purple-50/30 dark:bg-purple-950/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-800/50">
                  <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-3">
                    <Hash className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Keywords & Tags
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {topic.tags.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="text-sm px-4 py-2 bg-gradient-to-r from-white/90 to-purple-50/90 dark:from-background/90 dark:to-purple-900/20 border border-purple-200/60 dark:border-purple-700/60 hover:border-purple-300/80 dark:hover:border-purple-600/80 hover:shadow-sm transition-all duration-200 font-medium"
                      >
                        <Hash className="w-3 h-3 mr-1.5 text-purple-500" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Channel and Audience Fit */}
              {(topic.channel_fit?.length > 0 ||
                topic.audience_fit?.length > 0) && (
                <div className="bg-gradient-to-br from-amber-50/40 via-orange-50/30 to-rose-50/40 dark:from-amber-950/20 dark:via-orange-950/15 dark:to-rose-950/20 rounded-xl p-6 border border-amber-200/60 dark:border-amber-800/60">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {topic.channel_fit?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-3">
                          <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          Best Channels
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {topic.channel_fit.map((channel) => (
                            <div
                              key={channel}
                              className="bg-white/90 dark:bg-background/90 rounded-lg px-3 py-2 text-sm border-2 border-slate-300/80 dark:border-slate-600/80 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200 font-medium text-foreground"
                            >
                              {channel}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {topic.audience_fit?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-3">
                          <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          Target Audience
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {topic.audience_fit.map((audience) => (
                            <div
                              key={audience}
                              className="bg-white/90 dark:bg-background/90 rounded-lg px-3 py-2 text-sm border-2 border-slate-300/80 dark:border-slate-600/80 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200 font-medium text-foreground"
                            >
                              {audience}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons - Moved to end of content */}
              <div className="flex justify-end pt-6 border-t border-muted/30">
                <div className="flex items-center gap-4 flex-wrap">
                  {onSave && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="default"
                          size="lg"
                          onClick={handleSave}
                          disabled={topic._isBeingSaved || topic.is_saved}
                          className="gap-3 px-6 py-3 text-base"
                        >
                          <Save className="h-5 w-5" />
                          {topic.is_saved ? "Saved" : "Save Topic"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {topic.is_saved
                            ? "Already saved to library"
                            : "Save to library"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {onNavigateToContent && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={handleWriteContent}
                          className="gap-3 px-6 py-3 text-base"
                        >
                          <PenTool className="h-5 w-5" />
                          Write Content
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Create content for this topic</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleCopy}
                        className="gap-3 px-6 py-3 text-base"
                      >
                        <Copy className="h-5 w-5" />
                        Copy Topic
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy topic to clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
