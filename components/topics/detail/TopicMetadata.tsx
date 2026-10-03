"use client";

import type { MetadataItem } from "@/types/detail-page";

interface TopicMetadataProps {
  metadata: MetadataItem[];
}

/**
 * Displays topic metadata in info boxes (created, updated, approved dates)
 */
export function TopicMetadata({ metadata }: TopicMetadataProps) {
  if (metadata.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metadata.map((item) => (
        <div
          key={item.label}
          className="bg-gradient-to-br from-muted/5 to-muted/10 border border-muted/20 rounded-md p-4 hover:border-muted/30 transition-all duration-200"
        >
          <div className="flex items-start gap-3">
            {/* Icon Column */}
            <div className="p-2 rounded-md bg-muted text-foreground flex-shrink-0">
              {item.icon}
            </div>
            {/* Key/Value Column */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {item.label}
              </div>
              <div className="text-sm font-semibold text-foreground leading-tight">
                {item.value}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
