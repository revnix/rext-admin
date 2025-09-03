"use client";

import {
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { GeneratedTopic } from "@/types/topic-builder";

interface TopicCardProps {
  topic: GeneratedTopic;
  isSelected: boolean;
  onSelect: (topicId: string, selected: boolean) => void;
  onSave: (topicId: string) => void;
  className?: string;
}

export function TopicCard({
  topic,
  isSelected,
  onSelect,
  onSave,
  className,
}: TopicCardProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(topic.id);
    } catch (error) {
      console.error("Failed to save topic:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectChange = (checked: boolean) => {
    onSelect(topic.id, checked);
  };

  // Convert scores to percentages for display
  const relevancePercent = Math.round(topic.scores.relevance * 100);
  const freshnessPercent = Math.round(topic.scores.freshness * 100);
  const noveltyPercent = Math.round(topic.scores.novelty * 100);

  // Get overall score (average of all scores)
  const overallScore = Math.round(
    ((topic.scores.relevance + topic.scores.freshness + topic.scores.novelty) /
      3) *
      100,
  );

  // Determine score color based on overall score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card
      className={cn(
        "group relative transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-primary ring-opacity-50",
        className,
      )}
    >
      {/* Selection Checkbox - Top Left */}
      <div className="absolute top-4 left-4 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleSelectChange}
          className="bg-background shadow-sm"
          aria-label={`Select topic: ${topic.title}`}
        />
      </div>

      {/* Save Button - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant={topic.is_saved ? "secondary" : "outline"}
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="shadow-sm bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          {topic.is_saved ? (
            <>
              <BookmarkCheck className="h-3 w-3 mr-1.5" />
              Saved
            </>
          ) : (
            <>
              <Bookmark className="h-3 w-3 mr-1.5" />
              {isSaving ? "Saving..." : "Save"}
            </>
          )}
        </Button>
      </div>

      <CardHeader className="pb-4 pt-12">
        <CardTitle className="text-lg leading-tight pr-20">
          {topic.title}
        </CardTitle>
        {topic.angle && (
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            {topic.angle}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {topic.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {topic.description}
          </p>
        )}

        {/* Scores Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Quality Scores
            </span>
            <span
              className={cn(
                "text-xs font-semibold",
                getScoreColor(overallScore),
              )}
            >
              {overallScore}% Overall
            </span>
          </div>

          <div className="space-y-2">
            {/* Relevance */}
            <div className="flex items-center gap-3">
              <Target className="h-3 w-3 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Relevance</span>
                  <span className="text-xs text-muted-foreground">
                    {relevancePercent}%
                  </span>
                </div>
                <Progress value={relevancePercent} className="h-1.5" />
              </div>
            </div>

            {/* Freshness */}
            <div className="flex items-center gap-3">
              <TrendingUp className="h-3 w-3 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Freshness</span>
                  <span className="text-xs text-muted-foreground">
                    {freshnessPercent}%
                  </span>
                </div>
                <Progress value={freshnessPercent} className="h-1.5" />
              </div>
            </div>

            {/* Novelty */}
            <div className="flex items-center gap-3">
              <Zap className="h-3 w-3 text-purple-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Novelty</span>
                  <span className="text-xs text-muted-foreground">
                    {noveltyPercent}%
                  </span>
                </div>
                <Progress value={noveltyPercent} className="h-1.5" />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Channel and Audience Fit */}
        <div className="space-y-3">
          {/* Channel Fit */}
          {topic.channel_fit && topic.channel_fit.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Best Channels
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {topic.channel_fit.map((channel) => (
                  <Badge key={channel} variant="secondary" className="text-xs">
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Audience Fit */}
          {topic.audience_fit && topic.audience_fit.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Target Audience
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {topic.audience_fit.map((audience) => (
                  <Badge key={audience} variant="outline" className="text-xs">
                    {audience}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {topic.tags && topic.tags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {topic.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-muted/50"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Why It Works */}
        {topic.why_it_works && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Why This Works
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-md">
              {topic.why_it_works}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
