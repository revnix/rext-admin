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
      trigger={<span className="cursor-help text-sm leading-tight">{preview}</span>}
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

  // Use enhanced fields if available, otherwise fall back to parsing description
  const angle = row?.angle || "";
  const whyItWorks = row?.why_it_works || "";
  let displayAngle = angle;
  let displayDescription = row?.description || "";

  // If angle is not available, try to extract from description (fallback for basic transformation)
  if (!angle && displayDescription.includes(" • ")) {
    const parts = displayDescription.split(" • ");
    displayAngle = parts[0] || "";
    displayDescription = parts[1] || "";
  }

  // If we have additional details, show them in tooltip
  const hasDetails = displayAngle || displayDescription || whyItWorks;

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
          {displayAngle && (
            <div>
              <div className="font-medium text-xs text-muted-foreground mb-1">
                Angle:
              </div>
              <div className="text-sm italic">{displayAngle}</div>
            </div>
          )}
          {displayDescription && (
            <div>
              <div className="font-medium text-xs text-muted-foreground mb-1">
                Description:
              </div>
              <div className="text-sm">{displayDescription}</div>
            </div>
          )}
          {whyItWorks && (
            <div>
              <div className="font-medium text-xs text-muted-foreground mb-1">
                Why it works:
              </div>
              <div className="text-sm">{whyItWorks}</div>
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
  row,
}: {
  value: unknown;
  row?: TopicData;
}): ReactNode {
  const tags = row?.tags || [];

  // Use only tags as categories, excluding channel and audience prefixes
  // Don't duplicate the primary category since it's derived from the first tag
  const filteredTags = tags.filter(
    (tag) => !tag.startsWith("channel:") && !tag.startsWith("audience:"),
  );

  // Just use the tags directly as categories, properly formatted and deduplicated
  const allCategories =
    filteredTags.length > 0
      ? [...new Set(filteredTags)]
          .map(
            (category) =>
              String(category).charAt(0).toUpperCase() +
              String(category).slice(1).toLowerCase(),
          )
          .slice(0, 2) // Limit to 2 categories for cleaner look
      : ["General"]; // Fallback when no tags available

  const remainingCount = Math.max(0, filteredTags.length - 2);

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {allCategories.map((category) => (
        <span
          key={String(category)}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
        >
          {category}
        </span>
      ))}
      <OverflowCountTooltip
        count={remainingCount}
        badgeClassName="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 cursor-help"
        content={
          <div className="text-xs">
            {filteredTags
              .slice(2)
              .map(
                (category) =>
                  String(category).charAt(0).toUpperCase() +
                  String(category).slice(1).toLowerCase(),
              )
              .join(", ")}
          </div>
        }
      />
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
    status.toLowerCase() === "approved" ||
    status.toLowerCase() === "saved" ||
    (row && "approved" in row && row.approved === true);

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
 * Enhanced Score Display with 8-point breakdown tooltip
 */
export function EnhancedScoreDisplay({
  value,
  row,
}: {
  value: unknown;
  row?: TopicData;
}): ReactNode {
  const progressTitleId = useId();
  const score =
    typeof value === "number" ? value : parseFloat(String(value || "0"));
  const formattedScore = formatScore(score);
  const colorClass = getScoreColorClass(score);

  if (formattedScore === "--") {
    return <span className="text-muted-foreground">--</span>;
  }

  // Use the preserved scores data from TopicData
  const scoreBreakdown = row?.scores;

  if (!scoreBreakdown) {
    // Fallback to basic score display
    return (
      <span className={`font-mono text-sm ${colorClass}`}>
        {formattedScore}
      </span>
    );
  }

  return (
    <TruncatedTooltipText
      trigger={
        <div className="flex items-center gap-2 cursor-help">
          {/* Circular Progress - Larger size */}
          <div className="relative w-12 h-12">
            <svg
              className="w-12 h-12 transform -rotate-90"
              viewBox="0 0 48 48"
              role="img"
              aria-labelledby={progressTitleId}
            >
              <title id={progressTitleId}>Score progress</title>
              {/* Background circle */}
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-muted-foreground/20"
              />
              {/* Progress circle */}
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - score / 100)}`}
                className={colorClass}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium">{Math.round(score)}</span>
            </div>
          </div>
        </div>
      }
      content={
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Relevance:
              </span>
              <span className="text-sm">
                {Math.round(scoreBreakdown.relevance * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                SEO Potential:
              </span>
              <span className="text-sm">
                {Math.round(scoreBreakdown.seo_potential * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Trend Level:
              </span>
              <span className="text-sm">
                {Math.round(scoreBreakdown.trend_level * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Uniqueness:
              </span>
              <span className="text-sm">
                {Math.round(scoreBreakdown.uniqueness * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Reader Interest:
              </span>
              <span className="text-sm">
                {Math.round(scoreBreakdown.reader_interest * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Actionable Potential:
              </span>
              <span className="text-sm">
                {Math.round(scoreBreakdown.actionable_potential * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Brand Alignment:
              </span>
              <span className="text-sm">
                {Math.round(scoreBreakdown.brand_alignment * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Controversy:
              </span>
              <span className="text-sm">
                {Math.round(scoreBreakdown.controversy * 100)}%
              </span>
            </div>
          </div>
        </div>
      }
      side="bottom"
      className="max-w-md p-4"
    />
  );
}
