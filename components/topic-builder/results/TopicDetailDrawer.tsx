"use client";

import { motion, type PanInfo } from "framer-motion";
import { Check, Copy, PenTool, Save, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [dragProgress, setDragProgress] = useState(0);
  const dragStartRef = useRef(0);

  // Calculate overall score for circular progress
  const overallScore = topic
    ? Math.round(
        ((topic.scores.relevance +
          topic.scores.freshness +
          topic.scores.novelty) /
          3) *
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

  // Handle swipe gestures for mobile
  const handleDragStart = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    dragStartRef.current = info.point.x;
  };

  const handleDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const deltaX = info.point.x - dragStartRef.current;
    const progress = Math.max(0, Math.min(1, deltaX / 200));
    setDragProgress(progress);
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const deltaX = info.point.x - dragStartRef.current;
    const velocity = info.velocity.x;

    // Close drawer if dragged more than 100px or fast swipe
    if (deltaX > 100 || velocity > 500) {
      onClose();
    }

    setDragProgress(0);
  };

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
          className={cn(
            "w-[90vw] sm:w-[70vw] lg:w-[60vw] max-w-none p-0 gap-0",
            "flex flex-col h-full overflow-hidden",
            className,
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <motion.div
            className="flex flex-col h-full"
            drag="x"
            dragConstraints={{ left: 0, right: 200 }}
            dragElastic={0.2}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            animate={{ x: dragProgress * 50 }}
            transition={{ type: "spring", damping: 20 }}
          >
            {/* Header */}
            <SheetHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Circular Progress Score */}
                  <div className="flex-shrink-0 mt-1">
                    <CircularProgress
                      value={overallScore}
                      size="lg"
                      className="text-primary"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-xl font-semibold line-clamp-2 text-left">
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
                  className="h-8 w-8 p-0 hover:bg-secondary"
                  aria-label="Close drawer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>

            {/* Action Buttons */}
            <div className="px-6 py-4 border-b bg-muted/30">
              <div className="flex items-center gap-3 flex-wrap">
                {onSave && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                        disabled={topic._isBeingSaved || topic.is_saved}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
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
                        size="sm"
                        onClick={handleWriteContent}
                        className="gap-2"
                      >
                        <PenTool className="h-4 w-4" />
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
                      size="sm"
                      onClick={handleCopy}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Topic
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy topic to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Description/Angle */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  Topic Overview
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {topic.description || topic.angle}
                </p>
              </div>

              {/* Why It Works */}
              {topic.why_it_works && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">
                    Why This Topic Works
                  </h3>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {topic.why_it_works}
                  </p>
                </div>
              )}

              {/* Detailed Scores */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">
                  Performance Scores
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {Math.round(topic.scores.relevance * 100)}%
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Relevance
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {Math.round(topic.scores.freshness * 100)}%
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Freshness
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {Math.round(topic.scores.novelty * 100)}%
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Novelty
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags/Keywords */}
              {topic.tags && topic.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">
                    Keywords & Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {topic.tags.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="text-sm px-3 py-1"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Channel and Audience Fit */}
              {(topic.channel_fit?.length > 0 ||
                topic.audience_fit?.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {topic.channel_fit?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-foreground">
                        Best Channels
                      </h3>
                      <div className="space-y-2">
                        {topic.channel_fit.map((channel) => (
                          <div
                            key={channel}
                            className="bg-muted/50 rounded-md px-3 py-2 text-sm"
                          >
                            {channel}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {topic.audience_fit?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-foreground">
                        Target Audience
                      </h3>
                      <div className="space-y-2">
                        {topic.audience_fit.map((audience) => (
                          <div
                            key={audience}
                            className="bg-muted/50 rounded-md px-3 py-2 text-sm"
                          >
                            {audience}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
