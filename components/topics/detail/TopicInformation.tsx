"use client";

import { FileText } from "lucide-react";
import { DetailCard } from "@/components/ui/detail-card";
import { SectionHeader } from "@/components/ui/section-header";
import type { GeneratedTopic } from "@/types/topic-builder";

interface TopicInformationProps {
  topic: GeneratedTopic;
}

/**
 * Displays basic topic information including description
 */
export function TopicInformation({ topic }: TopicInformationProps) {
  return (
    <DetailCard variant="highlight" className="bg-muted/20 dark:bg-muted/10">
      <SectionHeader
        title="Topic Information"
        icon={<FileText className="w-5 h-5" />}
        variant="spacious"
        className="mb-6"
      />

      <div className="space-y-6">
        {/* Description - Primary Content */}
        <div className="bg-background rounded-lg p-6 border-2 border-muted/40 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-foreground mb-3">
                Description
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {topic.description ||
                  "No description available for this topic."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DetailCard>
  );
}
