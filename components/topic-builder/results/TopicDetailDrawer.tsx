"use client";

import {
  Check,
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
  onSave: (topicId: string) => Promise<{ success: boolean; message?: string }>;
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
  // Calculate overall score using same weighted formula as topics table
  const calculateOverallScore = (scores: GeneratedTopic["scores"]): number => {
    if (!scores) return 0;
    const {
      relevance = 0,
      seo_potential = 0,
      trend_level = 0,
      uniqueness = 0,
      reader_interest = 0,
      actionable_potential = 0,
      brand_alignment = 0,
      controversy = 0,
    } = scores;

    // Weighted average of all score components (same as simple-topic-transformer.ts)
    // Note: controversy is inverted (lower controversy = higher score)
    const totalScore =
      relevance * 0.2 +
      seo_potential * 0.15 +
      trend_level * 0.15 +
      uniqueness * 0.1 +
      reader_interest * 0.15 +
      actionable_potential * 0.1 +
      brand_alignment * 0.1 +
      (1 - controversy) * 0.05;

    return Math.round(totalScore * 100);
  };

  const overallScore = topic ? calculateOverallScore(topic.scores) : 0;

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

  const _handleWriteContent = () => {
    if (!topic || !onNavigateToContent) return;
    onNavigateToContent(topic.id);
  };

  const _handleCopy = async () => {
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
            <SheetHeader className="px-6 py-5 border-b bg-surface-raised">
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

                    {/* Saved Status Indicator */}
                    {(topic._optimisticSaved || topic.is_saved) && (
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded-full text-primary-foreground text-xs font-medium",
                            topic._optimisticSaved && !topic.is_saved
                              ? "bg-warning-600"
                              : "bg-success-600",
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
                  className="h-10 w-10 p-0 hover:bg-secondary cursor-pointer"
                  aria-label="Close drawer"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </SheetHeader>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {/* Topic Information */}
              <div className="bg-muted/20 rounded-md p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-foreground" />
                  Topic Information
                </h3>

                <div className="space-y-4">
                  {/* Overview - Most Prominent */}
                  <div className="bg-background rounded-md p-4 border-2 border-muted/40">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-muted rounded-md flex items-center justify-center mt-1">
                        <FileText className="w-3.5 h-3.5 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-medium text-foreground mb-2">
                          Overview
                        </h4>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {topic.description || topic.angle}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Angle (if different from description) */}
                  {topic.angle &&
                    topic.description &&
                    topic.angle !== topic.description && (
                      <div className="bg-background rounded-md p-4 border-2 border-muted/50">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-7 h-7 bg-muted rounded-md flex items-center justify-center mt-0.5">
                            <Sparkles className="w-3.5 h-3.5 text-foreground" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-foreground mb-2">
                              Angle
                            </h4>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {topic.angle}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Why This Works */}
                  {topic.why_it_works && (
                    <div className="bg-background rounded-md p-4 border-2 border-muted/50">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 bg-muted rounded-md flex items-center justify-center mt-0.5">
                          <Target className="w-3.5 h-3.5 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-foreground mb-2">
                            Why This Works
                          </h4>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {topic.why_it_works}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Scores - Minimal Design */}
              <div className="bg-muted/20 rounded-md p-6 border border-muted/30">
                <div className="flex items-start justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    Performance Scores
                  </h3>
                  <div className="text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded-md border border-muted/30">
                    Based on your configuration
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Relevance",
                      value: Math.round(topic.scores.relevance * 100),
                      icon: Target,
                    },
                    {
                      label: "SEO",
                      value: Math.round(topic.scores.seo_potential * 100),
                      icon: TrendingUp,
                    },
                    {
                      label: "Trending",
                      value: Math.round(topic.scores.trend_level * 100),
                      icon: Zap,
                    },
                    {
                      label: "Unique",
                      value: Math.round(topic.scores.uniqueness * 100),
                      icon: Sparkles,
                    },
                    {
                      label: "Interest",
                      value: Math.round(topic.scores.reader_interest * 100),
                      icon: Users,
                    },
                    {
                      label: "Actionable",
                      value: Math.round(
                        topic.scores.actionable_potential * 100,
                      ),
                      icon: PenTool,
                    },
                    {
                      label: "Brand Fit",
                      value: Math.round(topic.scores.brand_alignment * 100),
                      icon: Check,
                    },
                    {
                      label: "Safe",
                      value: Math.round((1 - topic.scores.controversy) * 100),
                      icon: Globe,
                    },
                  ].map((score) => {
                    const IconComponent = score.icon;
                    const getScoreColor = (value: number) => {
                      if (value >= 80) return "text-success-600";
                      if (value >= 60) return "text-info-600";
                      if (value >= 40) return "text-warning-600";
                      return "text-danger-600";
                    };
                    const getProgressColor = (value: number) => {
                      if (value >= 80) return "bg-success-600";
                      if (value >= 60) return "bg-info-600";
                      if (value >= 40) return "bg-warning-600";
                      return "bg-danger-600";
                    };

                    return (
                      <div
                        key={score.label}
                        className="bg-background/50 rounded-md p-3 border border-muted/40 hover:border-muted/60 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <IconComponent
                            className={`w-4 h-4 ${getScoreColor(score.value)}`}
                          />
                          <span
                            className={`text-sm font-bold ${getScoreColor(score.value)}`}
                          >
                            {score.value}%
                          </span>
                        </div>
                        <div className="w-full bg-muted/30 rounded-full h-1.5 mb-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getProgressColor(score.value)}`}
                            style={{ width: `${score.value}%` }}
                          />
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">
                          {score.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tags/Keywords */}
              {topic.tags && topic.tags.length > 0 && (
                <div className="bg-surface-inset rounded-md p-6 border border-border">
                  <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-3">
                    <Hash className="w-5 h-5 text-foreground" />
                    Keywords & Tags
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {topic.tags.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="text-sm px-4 py-2 bg-background border border-border hover:border-foreground/30 transition-colors font-medium"
                      >
                        <Hash className="w-3 h-3 mr-1.5 text-foreground" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Channel and Audience Fit */}
              {(topic.channel_fit?.length > 0 ||
                topic.audience_fit?.length > 0) && (
                <div className="bg-muted/40 rounded-md p-6 border border-border">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {topic.channel_fit?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-3">
                          <Globe className="w-5 h-5 text-foreground" />
                          Best Channels
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {topic.channel_fit.map((channel) => (
                            <div
                              key={channel}
                              className="rounded-sm border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-foreground"
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
                          <Users className="w-5 h-5 text-foreground" />
                          Target Audience
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {topic.audience_fit.map((audience) => (
                            <div
                              key={audience}
                              className="rounded-sm border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-foreground"
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
                  {onSave != null && (
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
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
