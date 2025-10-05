/**
 * Unified Knowledge Component Types
 *
 * Shared type definitions and constants for the unified knowledge list
 * components. These complement the domain types in types/knowledge.ts
 * and provide component-specific configuration.
 */

import type {
  UnifiedKnowledgeStatus,
  KnowledgeDuplicateReason,
} from "@/types/knowledge";
import type { KnowledgeType } from "@/types/workspace";

/**
 * Display labels for knowledge types in the UI
 */
export const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeType, string> = {
  web: "Web",
  file: "Files",
  text: "Text",
};

/**
 * Display labels for knowledge status in the UI
 */
export const STATUS_LABELS: Record<UnifiedKnowledgeStatus, string> = {
  pending: "Pending",
  scraping: "Scraping",
  processing: "Processing",
  uploading: "Uploading",
  completed: "Completed",
  failed: "Failed",
};

/**
 * Tailwind CSS classes for status badges
 */
export const STATUS_CLASSES: Record<UnifiedKnowledgeStatus, string> = {
  pending:
    "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-200",
  scraping:
    "border-sky-300 text-sky-700 bg-sky-50 dark:bg-sky-900/30 dark:text-sky-200",
  processing:
    "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-200",
  uploading:
    "border-indigo-300 text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-200",
  completed:
    "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-200",
  failed:
    "border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-200",
};

/**
 * Tailwind CSS classes for type badges
 */
export const TYPE_COLORS: Record<KnowledgeType, string> = {
  web: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
  file: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
  text: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800",
};

/**
 * Display labels for duplicate detection reasons
 */
export const DUPLICATE_REASON_LABELS: Record<KnowledgeDuplicateReason, string> =
  {
    url: "Matching URL",
    title: "Matching Title",
    content: "Similar Content",
  };

/**
 * Maximum length for preview text snippets
 */
export const MAX_PREVIEW_LENGTH = 160;

/**
 * Skeleton loading keys for grid view
 */
export const GRID_SKELETON_KEYS = [
  "knowledge-grid-1",
  "knowledge-grid-2",
  "knowledge-grid-3",
  "knowledge-grid-4",
  "knowledge-grid-5",
  "knowledge-grid-6",
] as const;

/**
 * Skeleton loading keys for list view
 */
export const LIST_SKELETON_KEYS = [
  "knowledge-list-1",
  "knowledge-list-2",
  "knowledge-list-3",
  "knowledge-list-4",
  "knowledge-list-5",
] as const;
