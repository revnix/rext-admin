"use client";

import { ChevronDown, FileText, Repeat } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { GeneratedTopic } from "@/types/topic-builder";

interface SelectedTopicDisplayProps {
  topic: GeneratedTopic;
  onChangeClick: () => void;
}

/**
 * Component that displays a selected topic with all its details
 * and provides a "Change Topic" action button
 */
export function SelectedTopicDisplay({
  topic,
  onChangeClick,
}: SelectedTopicDisplayProps) {
  const [showWhyItWorks, setShowWhyItWorks] = useState(false);

  // Format scores for display (convert 0-1 to percentage)
  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  // Get key scores to display
  const keyScores = [
    { label: "Relevance", value: topic.scores.relevance },
    { label: "SEO Potential", value: topic.scores.seo_potential },
    { label: "Trending", value: topic.scores.trend_level },
  ];

  return (
    <Card className="wizard-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="wizard-field-label">
            <FileText className="h-5 w-5 text-primary" />
            Selected Topic
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onChangeClick}
            className="flex items-center gap-2"
          >
            <Repeat className="h-4 w-4" />
            Change Topic
          </Button>
        </div>
        <CardDescription className="wizard-field-description">
          Your chosen topic with all the details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Topic Information */}
        <div className="space-y-4">
          {/* Title and Angle */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {topic.title}
            </h3>
            {topic.angle && (
              <p className="text-sm font-medium text-muted-foreground">
                Angle: {topic.angle}
              </p>
            )}
          </div>

          {/* Description */}
          {topic.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {topic.description}
            </p>
          )}

          {/* Tags */}
          {topic.tags && topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topic.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Channel and Audience Fit */}
        <div className="space-y-3">
          {topic.channel_fit && topic.channel_fit.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Best Channels:
              </p>
              <div className="flex flex-wrap gap-2">
                {topic.channel_fit.slice(0, 3).map((channel) => (
                  <Badge key={channel} variant="outline" className="text-xs">
                    {channel}
                  </Badge>
                ))}
                {topic.channel_fit.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{topic.channel_fit.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {topic.audience_fit && topic.audience_fit.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Target Audience:
              </p>
              <div className="flex flex-wrap gap-2">
                {topic.audience_fit.slice(0, 3).map((audience) => (
                  <Badge key={audience} variant="secondary" className="text-xs">
                    {audience}
                  </Badge>
                ))}
                {topic.audience_fit.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{topic.audience_fit.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Key Scores */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            Topic Scores:
          </p>
          <div className="grid grid-cols-3 gap-4">
            {keyScores.map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-lg font-semibold text-primary">
                  {formatScore(value)}
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Why It Works Section (Collapsible) */}
        {topic.why_it_works && (
          <Collapsible open={showWhyItWorks} onOpenChange={setShowWhyItWorks}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between p-0 h-auto font-normal"
              >
                <span className="text-sm font-medium text-foreground">
                  Why This Topic Works
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    showWhyItWorks ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {topic.why_it_works}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
