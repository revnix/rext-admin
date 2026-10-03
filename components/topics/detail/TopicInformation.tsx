"use client";

import { FileText, Sparkles, Target } from "lucide-react";
import { DetailCard } from "@/components/ui/detail-card";
import { SectionHeader } from "@/components/ui/section-header";
import type { GeneratedTopic } from "@/types/topic-builder";

interface TopicInformationProps {
  topic: GeneratedTopic;
}

/**
 * Displays topic information including overview, angle, and why it works
 */
export function TopicInformation({ topic }: TopicInformationProps) {
  return (
    <DetailCard variant="highlight">
      <SectionHeader
        title="Topic Information"
        icon={<FileText className="w-5 h-5" />}
        variant="spacious"
        className="mb-6"
      />

      <div className="space-y-6">
        {/* Overview - Most Prominent */}
        <div className="bg-background rounded-md p-6 border-2 border-muted/40 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center mt-1">
              <FileText className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-foreground mb-3">
                Overview
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {topic.description ||
                  "No description available for this topic."}
              </p>
            </div>
          </div>
        </div>

        {/* Secondary Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Angle */}
          {topic.angle && (
            <div className="bg-background rounded-md p-5 border-2 border-muted/50 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-md flex items-center justify-center mt-0.5">
                  <Sparkles className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-medium text-foreground mb-2">
                    Angle
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {topic.angle}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Why This Works */}
          {topic.why_it_works && (
            <div className="bg-background rounded-md p-5 border-2 border-muted/50 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-md flex items-center justify-center mt-0.5">
                  <Target className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-medium text-foreground mb-2">
                    Why This Works
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {topic.why_it_works}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DetailCard>
  );
}
