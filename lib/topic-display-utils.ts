/**
 * Topic Display Utilities
 *
 * This module provides utility functions for formatting and displaying topic data
 * in DataTable and other UI components. Includes formatters for dates, scores,
 * arrays, and other TopicData fields with proper styling and sorting support.
 */

/**
 * Format a date string to a user-friendly format
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "--";

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "--";
  }
}

/**
 * Format a score value with optional styling
 */
export function formatScore(score: number | undefined): string {
  if (score === undefined || score === null) return "--";
  if (typeof score !== "number" || Number.isNaN(score)) return "--";

  return Math.round(score).toString();
}

/**
 * Get score color class based on value
 */
export function getScoreColorClass(score: number | undefined): string {
  if (score === undefined || score === null || Number.isNaN(score))
    return "text-muted-foreground";

  if (score >= 80) return "text-green-600 font-semibold";
  if (score >= 60) return "text-blue-600 font-medium";
  if (score >= 40) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Get status variant for badges
 */
export function getStatusVariant(
  status: string,
): "default" | "secondary" | "outline" {
  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    case "generated":
      return "outline";
    case "saving":
      return "secondary";
    case "saved":
      return "default";
    case "published":
      return "default";
    case "archived":
      return "secondary";
    default:
      return "outline";
  }
}

/**
 * Get priority variant and color for badges
 */
export function getPriorityVariant(
  priority: string,
): "default" | "secondary" | "outline" {
  const normalizedPriority = priority.toLowerCase();

  switch (normalizedPriority) {
    case "high":
      return "default";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "outline";
  }
}

/**
 * Get priority color class
 */
export function getPriorityColorClass(priority: string): string {
  const normalizedPriority = priority.toLowerCase();

  switch (normalizedPriority) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "";
  }
}

/**
 * Format tags array for display
 */
export function formatTagsArray(tags: string[] | undefined): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter(Boolean).slice(0, 5); // Limit to 5 tags for display
}

/**
 * Get content type color class
 */
export function getContentTypeColorClass(
  contentType: string | undefined,
): string {
  if (!contentType) return "";

  const normalized = contentType.toLowerCase();

  if (normalized.includes("blog"))
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (normalized.includes("social"))
    return "bg-purple-100 text-purple-800 border-purple-200";
  if (normalized.includes("video"))
    return "bg-pink-100 text-pink-800 border-pink-200";
  if (normalized.includes("email"))
    return "bg-green-100 text-green-800 border-green-200";
  if (normalized.includes("newsletter"))
    return "bg-cyan-100 text-cyan-800 border-cyan-200";
  if (normalized.includes("podcast"))
    return "bg-orange-100 text-orange-800 border-orange-200";

  return "bg-gray-100 text-gray-800 border-gray-200";
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(
  text: string | undefined,
  maxLength: number = 50,
): string {
  if (!text) return "--";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Check if a value matches a search query (including array fields)
 */
export function matchesSearchQuery(value: unknown, query: string): boolean {
  if (!query) return true;

  const normalizedQuery = query.toLowerCase();

  if (Array.isArray(value)) {
    return value.some((item) =>
      String(item || "")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }

  return String(value || "")
    .toLowerCase()
    .includes(normalizedQuery);
}

/**
 * Get display text for a field value
 */
export function getDisplayText(value: unknown): string {
  if (value === null || value === undefined) return "--";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

/**
 * Get estimated effort color class
 */
export function getEffortColorClass(effort: string | undefined): string {
  if (!effort) return "";

  const normalized = effort.toLowerCase();

  switch (normalized) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

/**
 * Format ranking display
 */
export function formatRanking(ranking: string | undefined): string {
  if (!ranking) return "--";
  // Ensure ranking starts with # if it doesn't already
  if (ranking.startsWith("#")) return ranking;
  return `#${ranking}`;
}

/**
 * Get a short preview of description
 */
export function getDescriptionPreview(description: string | undefined): string {
  if (!description) return "--";

  // Split by bullet separator and take first part
  const firstPart = description.split(" • ")[0];
  return truncateText(firstPart, 80);
}
