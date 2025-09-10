/**
 * Topic Cell Formatters
 *
 * Custom cell rendering components for TopicData fields in DataTable.
 * Provides proper styling, formatting, and display logic for different
 * data types including status, priority, tags, scores, and dates.
 */

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatDate,
  formatRanking,
  formatScore,
  formatTagsArray,
  getContentTypeColorClass,
  getDescriptionPreview,
  getEffortColorClass,
  getPriorityColorClass,
  getScoreColorClass,
  truncateText,
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
      className =
        "bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse";
      break;
    case "saved":
      variant = "default";
      className = "bg-green-100 text-green-800 border-green-200";
      break;
    case "published":
      variant = "default";
      className = "bg-purple-100 text-purple-800 border-purple-200";
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

  const visibleTags = tags.slice(0, 2);
  const remainingCount = tags.length - visibleTags.length;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visibleTags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="text-xs bg-muted/50 text-muted-foreground border-0"
        >
          {tag}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-xs bg-muted text-muted-foreground border-0 cursor-help"
              >
                +{remainingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="flex flex-wrap gap-1">
                {tags.slice(2).map((tag, tagIndex) => (
                  <span key={`tag-${tagIndex}-${tag}`} className="text-xs">
                    {tag}
                    {tagIndex < tags.slice(2).length - 1 ? ", " : ""}
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
 * Date Display Cell Formatter
 */
export function DateDisplay({ value }: { value: unknown }): ReactNode {
  const formattedDate = formatDate(String(value || ""));

  return (
    <span className="text-sm text-muted-foreground font-mono">
      {formattedDate}
    </span>
  );
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
 * Title Display Cell Formatter
 */
export function TitleDisplay({
  value,
}: {
  value: unknown;
  row?: TopicData;
}): ReactNode {
  const title = String(value || "");
  const truncatedTitle = truncateText(title, 60);

  if (!title) {
    return <span className="text-muted-foreground">Untitled</span>;
  }

  const shouldTruncate = title.length > 60;

  if (!shouldTruncate) {
    return (
      <span className="font-medium text-foreground leading-tight">{title}</span>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help font-medium text-foreground leading-tight">
            {truncatedTitle}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <p className="text-sm">{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Category Display Cell Formatter
 */
export function CategoryDisplay({ value }: { value: unknown }): ReactNode {
  const category = String(value || "General");

  return (
    <Badge
      variant="secondary"
      className="bg-slate-100 text-slate-700 border-slate-200"
    >
      {category}
    </Badge>
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
