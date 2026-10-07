// Content management types
import type { ContentChecklist, SchemaMarkup } from "./generate-content";

/**
 * The states a content row can hold: the backend's, from its transition table
 * (rext-backend `content_service.py` `_validate_status_transition`). The library
 * lists all but the trash (`CONTENT_LIST_STATUSES`).
 */
export const CONTENT_STATUSES = [
  "draft",
  "generating",
  "ready",
  "review",
  "scheduled",
  "published",
  "failed",
  "archived",
  "trashed",
  "deleted",
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export type WordPressPostStatus = "publish" | "draft" | "pending";

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Metadata schema for content
 */
export interface ContentMetadataSchema {
  content_summary?: string;
  content_type?: string;
  target_platform?: string;
  target_industry?: string;
  target_audience?: string[];
  audience_size?: string;
  complexity_level?: string;
  content_tone?: string[];
  target_region?: string;
  content_objectives?: string[];
  source_references?: string[];
  content_word_count?: number;
  reading_time_minutes?: number;
  content_quality_scores?: Record<string, unknown>;
  featured_image_prompt?: string;
  featured_image_alt_text?: string;
}

/**
 * SEO data schema for content
 */
export interface ContentSEODataSchema {
  meta_title?: string;
  meta_description?: string;
  focus_keyphrase?: string;
  keyphrase_density?: number;
  secondary_keywords?: string[];
  search_intent?: string[];
  seo_score?: number;
  readability_score?: number;
  trust_score?: number;
  seo_details?: string;
  content_primary_keywords?: string[];
  content_search_intent?: string[];
  content_meta_description?: string;

  // Frontend-enriched fields (computed client-side, not from backend)
  /** @deprecated Use seo_score directly */
  content_seo_score?: number;
  /** Parsed from seo_details JSON string */
  eeat_data?: import("./generate-content").EEATData | string;
}
/**
 * Request schema for creating content
 */
export interface CreateContentRequest {
  workspace_id?: string;
  title: string;
  introduction?: string;
  body_markdown?: string;
  body_html?: string;
  tags?: string[];
  category?: string;
  status?: ContentStatus;
  content_language?: string;
  content_format?: string;
  metadata?: ContentMetadataSchema;
  seo_data?: Omit<ContentSEODataSchema, "content_seo_score" | "eeat_data">;
  images_data?: Record<string, unknown>;
  links_data?: Record<string, unknown>;
  schema_markup?: Record<string, unknown>;
}
/**
 * Request schema for updating content
 */
export interface UpdateContentRequest {
  workspace_id?: string;
  title: string;
  slug?: string;
  introduction?: string;
  body_markdown?: string;
  body_html?: string;
  tags?: string[];
  category?: string;
  status?: ContentStatus;
  content_language?: string;
  assigned_to_user_id?: string;
  langgraph_thread_id?: string; // LangGraph workflow thread ID for content generation tracking
  metadata?: ContentMetadataSchema;
  seo_data?: Omit<ContentSEODataSchema, "content_seo_score" | "eeat_data">;
  images_data?: Record<string, unknown>;
  links_data?: Record<string, unknown>;
  schema_markup?: SchemaMarkup | Record<string, unknown>;
}

export interface PublishingResult {
  site_id: string;
  site_name?: string;
  status: string;
  external_url?: string;
  last_synced_at?: string;
}

/**
 * Content item schema
 */
export interface ContentItem {
  id: string;
  workspace_id: string;
  created_by_user_id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  content_language: string;

  // Core content fields
  introduction?: string;
  body_markdown?: string;
  body_html?: string;
  tags?: string[];
  category?: string;

  // Relations
  seo_data?: ContentSEODataSchema;
  /** The author persona chosen in the outline step; null when none was. */
  persona_id?: string | null;
  /** The type chosen in Generate's content-type step ("how-to-guide"), stored with the article
   * since D2c #468; null for one saved before. */
  content_type?: string | null;
  content_metadata?: ContentMetadataSchema;

  // Flow-generated structured data
  images_data?: Record<string, unknown>;
  links_data?: Record<string, unknown>;
  schema_markup?: Record<string, unknown>;

  // LangGraph workflow tracking
  langgraph_thread_id?: string;

  // WordPress publishing fields
  wordpress_post_id?: number;
  wordpress_url?: string;
  wordpress_published_at?: string;

  // CMS sync results per site
  publishing_results?: PublishingResult[];

  // What the dashboard's checklist shows beside the article (detail responses only)
  checklist?: ContentChecklist | null;

  // Timestamps
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

/**
 * Response schema for single content item
 */
export interface ContentResponse {
  content: ContentItem;
  id: string;
  operation_id?: string; // For SSE subscription during generation
  message?: string;
}

/**
 * Response schema for content list
 */
export interface ContentListResponse {
  content: ContentItem[];
  total_count: number;
  workspace_id: string;
  limit: number;
  offset: number;
}

/**
 * A single entry in the content calendar (published or scheduled)
 */
export interface CalendarEntry {
  id: string;
  title: string;
  status: ContentStatus;
  platform: string;
  date: string;
  url?: string;
}

/**
 * Response schema for the calendar endpoint
 */
export interface CalendarResponse {
  calendar: Record<string, CalendarEntry[]>;
  total_items: number;
  /** The account's timezone, the one the days are counted in (UTC from a backend before D9). */
  timezone?: string;
}
