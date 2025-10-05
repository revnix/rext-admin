"use client";

import { Globe, Hash, Target, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DetailCard } from "@/components/ui/detail-card";
import { DetailGrid, DetailGridItem } from "@/components/ui/detail-grid";
import { SectionHeader } from "@/components/ui/section-header";
import type { GeneratedTopic } from "@/types/topic-builder";

interface TopicTagsProps {
  topic: GeneratedTopic;
}

/**
 * Displays topic tags, channel fit, and audience fit in a grid layout
 */
export function TopicTags({ topic }: TopicTagsProps) {
  const hasTags = (topic.tags?.length ?? 0) > 0;
  const hasChannelFit = (topic.channel_fit?.length ?? 0) > 0;
  const hasAudienceFit = (topic.audience_fit?.length ?? 0) > 0;

  // Don't render if no data
  if (!hasTags && !hasChannelFit && !hasAudienceFit) return null;

  return (
    <DetailGrid columns={3} gap="lg" responsive={{ sm: 1, md: 2, lg: 3 }}>
      {/* Keywords & Tags - Takes 1 column */}
      <DetailGridItem span={1} className="flex">
        {hasTags ? (
          <DetailCard variant="accent" gradient className="flex-1 flex flex-col">
            <SectionHeader
              title="Keywords & Tags"
              icon={<Hash className="w-5 h-5" />}
              variant="compact"
              className="mb-4"
            />
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {topic.tags?.slice(0, 6).map((keyword: string) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="text-sm px-4 py-2 bg-gradient-to-r from-white/90 to-purple-50/90 dark:from-background/90 dark:to-purple-900/20 border border-purple-200/60 dark:border-purple-700/60 hover:border-purple-300/80 dark:hover:border-purple-600/80 hover:shadow-sm transition-all duration-200 font-medium"
                  >
                    <Hash className="w-3 h-3 mr-1.5 text-purple-500" />
                    {keyword}
                  </Badge>
                ))}
                {(topic.tags?.length ?? 0) > 6 && (
                  <Badge variant="outline" className="text-sm">
                    +{(topic.tags?.length ?? 0) - 6} more
                  </Badge>
                )}
              </div>
            </div>
          </DetailCard>
        ) : (
          <DetailCard variant="default" className="flex-1 flex flex-col">
            <SectionHeader
              title="Keywords & Tags"
              icon={<Hash className="w-5 h-5" />}
              variant="compact"
              className="mb-4"
            />
            <div className="flex-1 flex items-start">
              <p className="text-sm text-muted-foreground">
                No keywords available.
              </p>
            </div>
          </DetailCard>
        )}
      </DetailGridItem>

      {/* Channel Fit - Takes 1 column */}
      <DetailGridItem span={1} className="flex">
        {hasChannelFit ? (
          <DetailCard variant="info" gradient className="flex-1 flex flex-col">
            <SectionHeader
              title="Best Channels"
              icon={<Globe className="w-5 h-5" />}
              variant="compact"
              className="mb-4"
            />
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {topic.channel_fit?.slice(0, 4).map((channel: string) => (
                  <Badge
                    key={channel}
                    variant="secondary"
                    className="text-sm px-4 py-2 bg-gradient-to-r from-blue-50/90 to-sky-50/90 dark:from-blue-950/30 dark:to-sky-950/30 border border-blue-200/60 dark:border-blue-700/60 hover:border-blue-300/80 dark:hover:border-blue-600/80 hover:shadow-sm transition-all duration-200 font-medium"
                  >
                    <Zap className="w-3 h-3 mr-1.5 text-blue-600 dark:text-blue-400" />
                    {channel}
                  </Badge>
                ))}
                {(topic.channel_fit?.length ?? 0) > 4 && (
                  <Badge variant="outline" className="text-sm">
                    +{(topic.channel_fit?.length ?? 0) - 4} more
                  </Badge>
                )}
              </div>
            </div>
          </DetailCard>
        ) : (
          <DetailCard variant="default" className="flex-1 flex flex-col">
            <SectionHeader
              title="Best Channels"
              icon={<Globe className="w-5 h-5" />}
              variant="compact"
              className="mb-4"
            />
            <div className="flex-1 flex items-start">
              <p className="text-sm text-muted-foreground">
                No channel data available.
              </p>
            </div>
          </DetailCard>
        )}
      </DetailGridItem>

      {/* Audience Fit - Takes 1 column */}
      <DetailGridItem span={1} className="flex">
        {hasAudienceFit ? (
          <DetailCard variant="default" className="flex-1 flex flex-col">
            <SectionHeader
              title="Target Audience"
              icon={<Users className="w-5 h-5" />}
              variant="compact"
              className="mb-4"
            />
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {topic.audience_fit?.slice(0, 4).map((audience: string) => (
                  <Badge
                    key={audience}
                    variant="secondary"
                    className="text-sm px-4 py-2 bg-gradient-to-r from-emerald-50/90 to-green-50/90 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200/60 dark:border-emerald-700/60 hover:border-emerald-300/80 dark:hover:border-emerald-600/80 hover:shadow-sm transition-all duration-200 font-medium"
                  >
                    <Target className="w-3 h-3 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                    {audience}
                  </Badge>
                ))}
                {(topic.audience_fit?.length ?? 0) > 4 && (
                  <Badge variant="outline" className="text-sm">
                    +{(topic.audience_fit?.length ?? 0) - 4} more
                  </Badge>
                )}
              </div>
            </div>
          </DetailCard>
        ) : (
          <DetailCard variant="default" className="flex-1 flex flex-col">
            <SectionHeader
              title="Target Audience"
              icon={<Users className="w-5 h-5" />}
              variant="compact"
              className="mb-4"
            />
            <div className="flex-1 flex items-start">
              <p className="text-sm text-muted-foreground">
                No audience data available.
              </p>
            </div>
          </DetailCard>
        )}
      </DetailGridItem>
    </DetailGrid>
  );
}
