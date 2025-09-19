/**
 * Topic Cell Formatters
 *
 * Custom cell rendering components for TopicData fields in DataTable.
 * Provides proper styling, formatting, and display logic for different
 * data types including status, priority, tags, scores, and dates.
 */

import { FolderOpen, Tag, Users } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useId } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatRanking,
  formatScore,
  formatTagsArray,
  getContentTypeColorClass,
  getDescriptionPreview,
  getEffortColorClass,
  getPriorityColorClass,
  getScoreColorClass,
} from "@/lib/topic-display-utils";
import type { TopicData } from "@/types/data-table";

/**
 * Status Badge Cell Formatter
 */
export function StatusBadge({ value }: { value: unknown }): ReactNode {
  const status = String(value || "unknown");
  const displayText = status.charAt(0).toUpperCase() + status.slice(1);

  let variant: "default" | "secondary" | "outline" = "outline";
  let className = "";

  switch (status.toLowerCase()) {
    case "generated":
      variant = "outline";
      className = "border-blue-200 text-blue-800";
      break;
    case "saving":
      variant = "secondary";
      className = "text-yellow-800 border-yellow-200 animate-pulse";
      break;
    case "saved":
      variant = "default";
      className = "text-green-800 border-green-200";
      break;
    case "published":
      variant = "default";
      className = "text-purple-800 border-purple-200";
      break;
    case "archived":
      variant = "secondary";
      className = "text-muted-foreground";
      break;
    default:
      className = "text-muted-foreground";
  }

  return (
    <Badge variant={variant} className={className}>
      {displayText}
    </Badge>
  );
}

/**
 * Priority Badge Cell Formatter
 */
export function PriorityBadge({ value }: { value: unknown }): ReactNode {
  const priority = String(value || "medium");
  const displayText = priority.charAt(0).toUpperCase() + priority.slice(1);
  const colorClass = getPriorityColorClass(priority);

  return (
    <Badge variant="outline" className={colorClass}>
      {displayText}
    </Badge>
  );
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
    return <span className="text-muted-foreground">--</span>;
  }

  // Show first 3 tags as chips and remaining count
  const visibleTags = tags.slice(0, 3);
  const remainingCount = Math.max(0, tags.length - 3);

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visibleTags.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className="text-xs border-purple-200 text-purple-700"
        >
          <Tag className="h-3 w-3 mr-1" />
          {tag}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-xs border-purple-200 text-purple-600 cursor-help"
              >
                +{remainingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="flex flex-wrap gap-1">
                {tags.slice(2).map((tag, index) => (
                  <span key={tag} className="text-xs">
                    {tag}
                    {index < tags.slice(2).length - 1 ? " " : ""}
                  </span>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
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
 * Date Display Cell Formatter with full date/time
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help text-sm leading-tight">{preview}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <p className="text-sm whitespace-pre-wrap">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
          href={href}
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">
            <TitleContent>{title}</TitleContent>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-md p-4">
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
  const primaryCategory = String(value || "General");
  const tags = row?.tags || [];

  // Get all categories from tags, excluding channel and audience prefixes
  const additionalCategories = tags.filter(
    (tag) => !tag.startsWith("channel:") && !tag.startsWith("audience:"),
  );

  // Combine primary category with additional tags
  const allCategories = [primaryCategory, ...additionalCategories]
    .map(
      (category) =>
        String(category).charAt(0).toUpperCase() +
        String(category).slice(1).toLowerCase(),
    )
    .slice(0, 3); // Limit to 3 categories to avoid clutter

  const remainingCount = Math.max(
    0,
    [primaryCategory, ...additionalCategories].length - 3,
  );

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {allCategories.map((category) => (
        <Badge
          key={String(category)}
          variant="outline"
          className="text-xs border-blue-200 text-blue-700"
        >
          <FolderOpen className="h-3 w-3 mr-1" />
          {category}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-xs border-blue-200 text-blue-600 cursor-help"
              >
                +{remainingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="flex flex-wrap gap-1">
                {[primaryCategory, ...additionalCategories]
                  .slice(3)
                  .map((category, idx) => (
                    <span key={String(category)} className="text-xs">
                      {String(category).charAt(0).toUpperCase() +
                        String(category).slice(1).toLowerCase()}
                      {idx <
                      [primaryCategory, ...additionalCategories].slice(3)
                        .length -
                        1
                        ? ", "
                        : ""}
                    </span>
                  ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
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
  const audiences = Array.isArray(value) ? value : [];

  if (audiences.length === 0) {
    return <span className="text-muted-foreground text-sm">--</span>;
  }

  const visibleAudiences = audiences.slice(0, 3);
  const remainingCount = audiences.length - visibleAudiences.length;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visibleAudiences.map((audience) => (
        <Badge
          key={String(audience)}
          variant="outline"
          className="text-xs border-green-200 text-green-700"
        >
          <Users className="h-3 w-3 mr-1" />
          {String(audience)}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-xs border-green-200 text-green-600 cursor-help"
              >
                +{remainingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="flex flex-wrap gap-1">
                {audiences.slice(2).map((audience, idx) => (
                  <span key={String(audience)} className="text-xs">
                    {String(audience)}
                    {idx < audiences.slice(2).length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

/**
 * Status Display Cell Formatter
 */
export function StatusDisplay({ value }: { value: unknown }): ReactNode {
  const status = String(value || "pending");

  // Determine if status is approved or pending
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            {/* Circular Progress */}
            <div className="relative w-8 h-8">
              <svg
                className="w-8 h-8 transform -rotate-90"
                viewBox="0 0 32 32"
                role="img"
                aria-labelledby={progressTitleId}
              >
                <title id={progressTitleId}>Score progress</title>
                {/* Background circle */}
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-muted-foreground/20"
                />
                {/* Progress circle */}
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 12}`}
                  strokeDashoffset={`${2 * Math.PI * 12 * (1 - score / 100)}`}
                  className={colorClass}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium">{Math.round(score)}</span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-md p-4">
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
