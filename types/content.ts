// Content management types

export type ContentStatus =
  | "draft"
  | "generating"
  | "generated"
  | "failed"
  | "published"
  | "scheduled"
  | "review"
  | "cancelled";

export interface ContentStatusInfo {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
}

export const CONTENT_STATUS_CONFIG: Record<ContentStatus, ContentStatusInfo> = {
  draft: {
    label: "Draft",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
    icon: "Edit3",
    description: "Content is being created or edited",
  },
  generating: {
    label: "Generating",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200",
    icon: "Loader2",
    description: "AI is generating the content",
  },
  generated: {
    label: "Generated",
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-200",
    icon: "CheckCircle",
    description: "Content has been generated and is ready for review",
  },
  failed: {
    label: "Failed",
    color: "text-red-700",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
    icon: "AlertCircle",
    description: "Content generation failed",
  },
  published: {
    label: "Published",
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-200",
    icon: "Globe",
    description: "Content is live and published",
  },
  scheduled: {
    label: "Scheduled",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-200",
    icon: "Calendar",
    description: "Content is scheduled for future publication",
  },
  review: {
    label: "Review",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-200",
    icon: "Eye",
    description: "Content is under human review",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
    icon: "X",
    description: "Content generation was cancelled",
  },
};

export const STATUS_FILTER_OPTIONS = Object.keys(CONTENT_STATUS_CONFIG).map(
  (status) => ({
    value: status,
    label: CONTENT_STATUS_CONFIG[status as ContentStatus].label,
  }),
);

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
  /**
   * Primary SEO keywords for content optimization
   * @minLength 1 - At least one keyword is required by backend
   */
  content_primary_keywords: string[];

  /** Secondary/supporting keywords for SEO */
  content_secondary_keywords?: string[];

  /**
   * Meta description for SEO and social sharing
   * @minLength 1 - Cannot be empty (backend validation)
   * @maxLength 160 - Recommended SEO limit
   */
  content_meta_description: string;

  /** Search intent categories (informational, transactional, etc.) */
  content_search_intent?: string[];

  /** SEO quality score (0-100) */
  content_seo_score?: number;

  /** Content readability score */
  readability_score?: number;

  /** Meta title for SEO */
  meta_title?: string;

  /** Meta description for SEO (alternative to content_meta_description) */
  meta_description?: string;

  /** Focus keyphrase for SEO */
  focus_keyphrase?: string;

  /** Keyphrase density score */
  keyphrase_density?: number;

  /** Full SEO assessment details as JSON string */
  seo_details?: string;
}


/**
 * Request schema for creating content
 */
export interface CreateContentRequest {
  workspace_id?: string; // Optional - provided via query parameter
  topic_id?: string;
  title: string;
  content_format?: string;
  body_markdown?: string;
  status?: ContentStatus;
  content_language?: string;
  assigned_to_user_id?: string;
  langgraph_thread_id?: string; // LangGraph workflow thread ID for content generation tracking
  metadata?: ContentMetadataSchema;
  seo_data?: ContentSEODataSchema;
}

/**
 * Request schema for updating content
 */
export interface UpdateContentRequest {
  title?: string;
  body_markdown?: string;
  body_html?: string;
  status?: ContentStatus;
  content_language?: string;
  assigned_to_user_id?: string;
  topic_id?: string;
  langgraph_thread_id?: string; // LangGraph workflow thread ID for content generation tracking
  metadata?: ContentMetadataSchema;
  seo_data?: ContentSEODataSchema;
}

/**
 * Content item schema
 */
export interface ContentItem {
  id: string;
  workspace_id: string;
  topic_id?: string;
  created_by_user_id: string;
  assigned_to_user_id?: string;
  author_id?: string;
  title: string;
  slug: string;
  body_markdown?: string;
  body_html?: string;
  content_format: string;
  status: ContentStatus;
  content_language: string;
  langgraph_thread_id?: string; // LangGraph workflow thread ID for content generation tracking
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  tags?: string[];
  introduction?: string;
  content_metadata?: ContentMetadataSchema;
  seo_data?: ContentSEODataSchema;
}

/**
 * Response schema for single content item
 */
export interface ContentResponse {
  content: ContentItem;
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
