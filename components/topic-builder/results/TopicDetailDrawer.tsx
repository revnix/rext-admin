"use client";

import { Check, FileText, Save, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
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

  const _handleCopy = async () => {
    if (!topic) return;

    if (onCopy) {
      onCopy(topic.id);
    } else {
      // Default copy behavior
      await navigator.clipboard.writeText(
        `${topic.topic_name || topic.title}\n${topic.description || ""}`,
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
            width: "min(95vw, 600px)",
            maxWidth: "none",
          }}
          className={cn(
            "p-0 gap-0 flex flex-col h-full overflow-hidden",
            "[&>button]:hidden",
            className,
          )}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="px-6 py-5 border-b bg-background shadow-sm">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-5 min-w-0 flex-1">
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-2xl font-bold line-clamp-2 text-left text-foreground leading-tight">
                      {topic.topic_name || topic.title}
                    </SheetTitle>

                    {/* Saved Status Indicator */}
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
              <div className="bg-muted/20 dark:bg-muted/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Topic Information
                </h3>

                <div className="space-y-4">
                  {/* Overview */}
                  <div className="bg-background rounded-lg p-4 border border-muted shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-medium text-foreground mb-2">
                          Description
                        </h4>
                        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {topic.description || "No description provided."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
