/**
 * Topic Cell Formatters
 *
 * Custom cell rendering components for TopicData fields in DataTable.
 * Provides proper styling, formatting, and display logic for different
 * data types including status, priority, tags, scores, and dates.
 */

import Link from "next/link";
import { type ReactNode, useId } from "react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge as SharedStatusBadge } from "@/components/ui/status-badge";
import { OverflowCountTooltip } from "@/components/ui/overflow-count-tooltip";
import { TruncatedTooltipText } from "@/components/ui/truncated-tooltip-text";
import {
  formatRanking,
  formatScore,
  formatTagsArray,
  getContentTypeColorClass,
  getDescriptionPreview,
  getEffortColorClass,
  getScoreColorClass,
} from "@/lib/topic-display-utils";
import type { TopicData } from "@/types/data-table";
import type { Route } from "next";

/**
 * Status Badge Cell Formatter
 * Uses the shared StatusBadge component for consistency
 */
export function StatusBadge({ value }: { value: unknown }): ReactNode {
  const status = String(value || "unknown");
  return <SharedStatusBadge status={status} size="sm" />;
}

/**
 * Priority Badge Cell Formatter
 * Uses the shared StatusBadge component for consistency
 */
export function PriorityBadge({ value }: { value: unknown }): ReactNode {
  const priority = String(value || "medium");
  return <SharedStatusBadge status={priority} size="sm" />;
}

/**
 * Tags List Cell Formatter
 */
export function TagsList({
  value,
}: {
  value: unknown;
  row?: TopicData;
}): ReactNode {
  const tags = formatTagsArray(value as string[]);

  if (tags.length === 0) {
    return <span className="text-muted-foreground text-xs">--</span>;
  }

  // Show first 2 tags and remaining count for cleaner look
  const visibleTags = tags.slice(0, 2);
  const remainingCount = Math.max(0, tags.length - 2);

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visibleTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
        >
          {tag}
        </span>
      ))}
      <OverflowCountTooltip
        count={remainingCount}
        badgeClassName="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200 cursor-help"
        content={<div className="text-xs">{tags.slice(2).join(", ")}</div>}
      />
    </div>
  );
}

/**
 * Score Display Cell Formatter
 */
export function ScoreDisplay({ value }: { value: unknown }): ReactNode {
  const score =
    typeof value === "number" ? value : parseFloat(String(value || "0"));
  const formattedScore = formatScore(score);
  const colorClass = getScoreColorClass(score);

  if (formattedScore === "--") {
    return <span className="text-muted-foreground">--</span>;
  }

  return (
    <span className={`font-mono text-sm ${colorClass}`}>{formattedScore}</span>
  );
}

/**
 * Content Type Badge Cell Formatter
 */
export function ContentTypeBadge({ value }: { value: unknown }): ReactNode {
  const contentType = String(value || "General");
  const colorClass = getContentTypeColorClass(contentType);

  return (
    <Badge variant="outline" className={colorClass}>
      {contentType}
    </Badge>
  );
}

/**
 * Dynamic Date Display Cell Formatter - shows relative time for recent dates
 */
export function DateDisplay({ value }: { value: unknown }): ReactNode {
  const dateString = String(value || "");

  if (!dateString || dateString === "--") {
    return <span className="text-muted-foreground text-sm">--</span>;
  }

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return <span className="text-muted-foreground text-sm">--</span>;
    }

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Show relative time for recent dates
    if (diffInMinutes < 60) {
      const minutes = Math.max(1, diffInMinutes);
      return (
        <div className="text-xs">
          <div className="text-foreground font-medium">{minutes}m ago</div>
          <div className="text-muted-foreground">Just now</div>
        </div>
      );
    } else if (diffInHours < 24) {
      return (
        <div className="text-xs">
          <div className="text-foreground font-medium">{diffInHours}h ago</div>
          <div className="text-muted-foreground">Today</div>
        </div>
      );
    } else if (diffInDays === 1) {
      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return (
        <div className="text-xs">
          <div className="text-foreground font-medium">Yesterday</div>
          <div className="text-muted-foreground">{formattedTime}</div>
        </div>
      );
    } else if (diffInDays <= 7) {
      const formattedDay = date.toLocaleDateString("en-US", {
        weekday: "short",
      });
      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return (
        <div className="text-xs">
          <div className="text-foreground font-medium">{diffInDays}d ago</div>
          <div className="text-muted-foreground">
            {formattedDay} {formattedTime}
          </div>
        </div>
      );
    } else {
      // Show full date for older items
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return (
        <div className="text-xs font-mono">
          <div className="text-foreground">{formattedDate}</div>
          <div className="text-muted-foreground">{formattedTime}</div>
        </div>
      );
    }
  } catch {
    return <span className="text-muted-foreground text-sm">--</span>;
  }
}

/**
 * Ranking Display Cell Formatter
 */
export function RankingDisplay({ value }: { value: unknown }): ReactNode {
  const ranking = formatRanking(String(value || ""));

  if (ranking === "--") {
    return <span className="text-muted-foreground">--</span>;
  }

  return (
    <span className="font-mono text-sm font-medium text-primary">
      {ranking}
    </span>
  );
}

/**
 * Description Preview Cell Formatter
 */
export function DescriptionPreview({ value }: { value: unknown }): ReactNode {
  const description = String(value || "");
  const preview = getDescriptionPreview(description);

  if (preview === "--") {
    return <span className="text-muted-foreground">--</span>;
  }

  return (
    <TruncatedTooltipText
      trigger={
        <span className="cursor-help text-sm leading-tight">{preview}</span>
      }
      content={<p className="text-sm whitespace-pre-wrap">{description}</p>}
      side="bottom"
      className="max-w-sm"
    />
  );
}

/**
 * Enhanced Title Display Cell Formatter with hover tooltip for details
 */
export function TitleDisplay({
  value,
  row,
  onClick,
  href,
}: {
  value: unknown;
  row?: TopicData;
  onClick?: () => void;
  href?: string;
}): ReactNode {
  const title = String(value || "");

  if (!title) {
    return <span className="text-muted-foreground">Untitled</span>;
  }

  // Use description if available
  const displayDescription = row?.description || "";
  const hasDetails = !!displayDescription;

  const TitleContent = ({ children }: { children: ReactNode }) => {
    if (href) {
      return (
        <Link
          href={href as Route}
          className="font-medium text-foreground leading-tight hover:text-primary transition-colors"
        >
          {children}
        </Link>
      );
    }

    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          className="font-medium text-foreground leading-tight cursor-pointer hover:text-primary transition-colors"
        >
          {children}
        </button>
      );
    }

    return (
      <span className="font-medium text-foreground leading-tight">
        {children}
      </span>
    );
  };

  if (!hasDetails) {
    return <TitleContent>{title}</TitleContent>;
  }

  return (
    <TruncatedTooltipText
      trigger={
        <span className="cursor-help">
          <TitleContent>{title}</TitleContent>
        </span>
      }
      content={
        <div className="space-y-3">
          {displayDescription && (
            <div>
              <div className="font-medium text-xs text-muted-foreground mb-1">
                Description:
              </div>
              <div className="text-sm">{displayDescription}</div>
            </div>
          )}
        </div>
      }
      side="bottom"
      className="max-w-md p-4"
    />
  );
}

/**
 * Enhanced Category Display Cell Formatter - shows all relevant categories
 */
export function CategoryDisplay({
  value,
  row,
}: {
  value: unknown;
  row?: TopicData;
}): ReactNode {
  const category = String(value || "General");

  return (
    <div className="flex flex-wrap gap-1 items-center">
      <span
        key={category}
        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
      >
        {category}
      </span>
    </div>
  );
}

/**
 * Estimated Effort Badge Cell Formatter
 */
export function EstimatedEffortBadge({ value }: { value: unknown }): ReactNode {
  const effort = String(value || "Medium");
  const colorClass = getEffortColorClass(effort);

  return (
    <Badge variant="outline" className={colorClass}>
      {effort}
    </Badge>
  );
}

/**
 * Author Display Cell Formatter
 */
export function AuthorDisplay({ value }: { value: unknown }): ReactNode {
  const author = String(value || "");

  if (!author || author === "AI Assistant") {
    return (
      <span className="text-sm text-muted-foreground italic">AI Generated</span>
    );
  }

  return <span className="text-sm font-medium">{author}</span>;
}

/**
 * Audience Fit Display Cell Formatter
 */
export function AudienceFitDisplay({ value }: { value: unknown }): ReactNode {
  const rawAudiences = Array.isArray(value) ? value : [];
  const audiences = [...new Set(rawAudiences.filter(Boolean))]; // Deduplicate audiences

  if (audiences.length === 0) {
    return <span className="text-muted-foreground text-xs">--</span>;
  }

  const visibleAudiences = audiences.slice(0, 2);
  const remainingCount = audiences.length - visibleAudiences.length;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visibleAudiences.map((audience) => (
        <span
          key={String(audience)}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200"
        >
          {String(audience)}
        </span>
      ))}
      <OverflowCountTooltip
        count={remainingCount}
        badgeClassName="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-600 border border-green-200 cursor-help"
        content={
          <div className="text-xs">
            {audiences
              .slice(2)
              .map((audience) => String(audience))
              .join(", ")}
          </div>
        }
      />
    </div>
  );
}

/**
 * Status Display Cell Formatter
 */
export function StatusDisplay({
  value,
  row,
}: {
  value: unknown;
  row?: TopicData;
}): ReactNode {
  const status = String(value || "pending");

  // Determine if status is approved - check both status string and approved field
  const isApproved =
    status.toLowerCase() === "approved" || status.toLowerCase() === "saved";

  return (
    <Badge
      variant="outline"
      className={
        isApproved
          ? "text-green-700 border-green-200"
          : "text-yellow-700 border-yellow-200"
      }
    >
      {isApproved ? "Approved" : "Pending Approval"}
    </Badge>
  );
}

/**
 * Enhanced Score Display with basic display
 */
export function EnhancedScoreDisplay({
  value,
  row,
}: {
  value: unknown;
  row?: TopicData;
}): ReactNode {
  const score =
    typeof value === "number" ? value : parseFloat(String(value || "0"));
  const formattedScore = formatScore(score);
  const colorClass = getScoreColorClass(score);

  if (formattedScore === "--") {
    return <span className="text-muted-foreground">--</span>;
  }

  return (
    <span className={`font-mono text-sm ${colorClass}`}>{formattedScore}</span>
  );
}
