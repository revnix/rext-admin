/**
 * API Request/Response Type Interfaces for Topic Builder
 *
 * This module defines all TypeScript interfaces for API interactions in the Topic Builder,
 * extending the core TopicBuilderFormData with API-specific fields and providing
 * comprehensive request/response structures for topic generation operations.
 *
 * @see /types/schemas.ts for validation schemas and transformation helpers
 * @see /types/backend.ts for backend service interfaces
 * @see /types/topic-builder.ts for core data structures
 * @see /types/consistent-response.ts for new consistent response format
 */

import {
  type BackendErrorCode,
  type ConsistentApiResponse,
  type ConsistentErrorResponse,
  type ConsistentSuccessResponse,
  createLegacyAdapter,
  type ErrorSeverity,
} from "./consistent-response";
import type { GeneratedTopic, TopicBuilderFormData } from "./topic-builder";

// ============================================================================
// API STATUS AND STATE MANAGEMENT
// ============================================================================

/**
 * API request states for tracking operation progress
 */
export type ApiStatus = "idle" | "loading" | "success" | "error";

/**
 * HTTP status codes commonly used in API responses
 */
export type HttpStatusCode =
  | 200
  | 201
  | 400
  | 401
  | 403
  | 404
  | 429
  | 500
  | 503;

// ============================================================================
// TOPIC GENERATION API INTERFACES
// ============================================================================

/**
 * Request interface for topic generation API
 * Extends the base TopicBuilderFormData with API-specific fields
 */
export interface TopicGenerationRequest extends TopicBuilderFormData {
  /** Optional session ID for tracking related requests */
  session_id?: string;
  /** Client-generated request ID for deduplication */
  request_id?: string;
  /** Request timestamp (ISO string) */
  timestamp?: string;
  /** Client version for compatibility tracking */
  client_version?: string;
}

/**
 * Response interface for topic generation API
 * Contains generated topics and comprehensive metadata
 */
export interface TopicGenerationResponse {
  /** Array of AI-generated topics */
  topics: GeneratedTopic[];
  /** Metadata about the generation process */
  metadata: {
    /** Total number of topics generated */
    total_generated: number;
    /** Time taken for generation in milliseconds */
    generation_time: number;
    /** Model/service used for generation */
    model_used?: string;
    /** Quality score of the overall generation */
    quality_score?: number;
    /** Tokens used in the generation process */
    tokens_used?: number;
    /** Cost of the generation request */
    cost?: number;
  };
  /** Unique identifier for this generation request */
  request_id: string;
  /** ISO timestamp when topics were generated */
  generated_at: string;
  /** Optional session ID linking related requests */
  session_id?: string;
}

/**
 * Request interface for regenerating specific topics
 * Allows users to request new variations of existing topics
 */
export interface TopicRegenerationRequest {
  /** ID of the original generation request */
  original_request_id: string;
  /** IDs of specific topics to regenerate (empty array = regenerate all) */
  topic_ids: string[];
  /** Optional modifications to the original request parameters */
  modifications?: Partial<TopicBuilderFormData>;
  /** Number of new variations to generate per topic */
  variations_per_topic?: number;
  /** Session ID for tracking */
  session_id?: string;
  /** Client-generated request ID */
  request_id?: string;
}

/**
 * Response interface for topic regeneration
 */
export interface TopicRegenerationResponse {
  /** Newly generated topic variations */
  topics: GeneratedTopic[];
  /** Original topics that were regenerated */
  original_topics: GeneratedTopic[];
  /** Generation metadata */
  metadata: TopicGenerationResponse["metadata"];
  /** Request tracking information */
  request_id: string;
  generated_at: string;
  session_id?: string;
}

// ============================================================================
// ERROR HANDLING INTERFACES
// ============================================================================

/**
 * Standardized error response interface for all API endpoints
 */
export interface ErrorResponse {
  /** Human-readable error message */
  message: string;
  /** Machine-readable error code */
  error_code: string;
  /** HTTP status code */
  status_code: HttpStatusCode;
  /** Request ID for error tracking */
  request_id?: string;
  /** Additional error details */
  details?: {
    /** Field-specific validation errors */
    field_errors?: Record<string, string[]>;
    /** Additional context about the error */
    context?: Record<string, unknown>;
    /** Suggested actions for resolving the error */
    suggestions?: string[];
  };
  /** Timestamp when error occurred */
  timestamp: string;
  /** Error tracking/correlation ID */
  trace_id?: string;
}

/**
 * Client-side error interface for handling network and validation errors
 */
export interface ClientError {
  /** Type of error (network, validation, etc.) */
  type:
    | "network"
    | "validation"
    | "timeout"
    | "rate_limit"
    | "server"
    | "unknown";
  /** Error message */
  message: string;
  /** Original error object if available */
  original_error?: Error;
  /** Request that caused the error */
  request_data?: Partial<TopicGenerationRequest>;
  /** Timestamp when error occurred */
  occurred_at: string;
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

/**
 * Generic API response wrapper for consistent response handling
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data (present on success) */
  data?: T;
  /** Error information (present on failure) */
  error?: ErrorResponse;
  /** Response metadata */
  meta?: {
    /** Request processing time */
    processing_time?: number;
    /** Server version */
    server_version?: string;
    /** Rate limiting information */
    rate_limit?: {
      limit: number;
      remaining: number;
      reset_at: string;
    };
  };
}

/**
 * Paginated response interface for endpoints that return multiple items
 */
export interface PaginatedResponse<T> {
  /** Array of items for current page */
  items: T[];
  /** Pagination metadata */
  pagination: {
    /** Current page number (1-based) */
    page: number;
    /** Number of items per page */
    per_page: number;
    /** Total number of items across all pages */
    total_items: number;
    /** Total number of pages */
    total_pages: number;
    /** Whether there's a next page */
    has_next: boolean;
    /** Whether there's a previous page */
    has_previous: boolean;
  };
}

// ============================================================================
// TOPIC MANAGEMENT API INTERFACES
// ============================================================================

/**
 * Request to save topics to user's library
 */
export interface SaveTopicsRequest {
  /** Array of topic IDs to save */
  topic_ids: string[];
  /** Optional folder/category to save topics in */
  folder?: string;
  /** Optional tags to add to saved topics */
  tags?: string[];
  /** Session ID */
  session_id?: string;
}

/**
 * Response for save topics operation
 */
export interface SaveTopicsResponse {
  /** Number of topics successfully saved */
  saved_count: number;
  /** IDs of topics that were saved */
  saved_topic_ids: string[];
  /** IDs of topics that failed to save */
  failed_topic_ids?: string[];
  /** Error messages for failed saves */
  errors?: string[];
}

/**
 * Request to export topics in various formats
 */
export interface ExportTopicsRequest {
  /** Array of topic IDs to export */
  topic_ids: string[];
  /** Export format */
  format: "json" | "csv" | "xlsx" | "pdf";
  /** Additional export options */
  options?: {
    /** Whether to include metadata */
    include_metadata?: boolean;
    /** Whether to include scores */
    include_scores?: boolean;
    /** Custom filename */
    filename?: string;
  };
  /** Session ID */
  session_id?: string;
}

/**
 * Response for export operation
 */
export interface ExportTopicsResponse {
  /** Download URL for the exported file */
  download_url: string;
  /** Filename of the exported file */
  filename: string;
  /** File size in bytes */
  file_size: number;
  /** Export format used */
  format: string;
  /** Expiration time for the download URL */
  expires_at: string;
}

// ============================================================================
// SESSION MANAGEMENT INTERFACES
// ============================================================================

/**
 * Session information for tracking related requests
 */
export interface TopicSession {
  /** Unique session identifier */
  session_id: string;
  /** When the session was created */
  created_at: string;
  /** When the session was last accessed */
  last_accessed_at: string;
  /** User ID (if authenticated) */
  user_id?: string;
  /** Session metadata */
  metadata?: {
    /** User agent string */
    user_agent?: string;
    /** Client IP address */
    ip_address?: string;
    /** Referring page */
    referrer?: string;
  };
}

/**
 * Request to create a new session
 */
export interface CreateSessionRequest {
  /** Optional initial form data */
  initial_data?: Partial<TopicBuilderFormData>;
  /** Client metadata */
  client_info?: {
    user_agent?: string;
    referrer?: string;
    timezone?: string;
  };
}

/**
 * Response for session creation
 */
export interface CreateSessionResponse {
  /** Created session information */
  session: TopicSession;
  /** Session expiration time */
  expires_at: string;
}

// ============================================================================
// REQUEST/RESPONSE VALIDATION INTERFACES
// ============================================================================

/**
 * Validation result for API requests
 */
export interface ApiValidationResult {
  /** Whether the request is valid */
  is_valid: boolean;
  /** Array of validation errors */
  errors: ValidationError[];
  /** Array of warnings (non-blocking) */
  warnings?: ValidationWarning[];
}

/**
 * Individual validation error
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** Invalid value that caused the error */
  invalid_value?: unknown;
}

/**
 * Individual validation warning
 */
export interface ValidationWarning {
  /** Field name for the warning */
  field: string;
  /** Warning message */
  message: string;
  /** Warning code */
  code: string;
  /** Value that triggered the warning */
  value?: unknown;
}

// ============================================================================
// UTILITY TYPES FOR API OPERATIONS
// ============================================================================

/**
 * Request options for API calls
 */
export interface ApiRequestOptions {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts */
  retries?: number;
  /** Whether to cache the response */
  cache?: boolean;
  /** Cache duration in seconds */
  cache_duration?: number;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Request priority (for rate limiting) */
  priority?: "low" | "normal" | "high";
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  /** Base URL for API endpoints */
  base_url: string;
  /** API key or authentication token */
  api_key?: string;
  /** Default timeout for requests */
  default_timeout: number;
  /** Default retry configuration */
  retry_config: {
    attempts: number;
    delay: number;
    backoff_multiplier: number;
  };
  /** Rate limiting configuration */
  rate_limit?: {
    requests_per_minute: number;
    requests_per_hour: number;
  };
}

// ============================================================================
// TYPE GUARDS FOR RUNTIME VALIDATION
// ============================================================================

/**
 * Type guard to check if a value is a valid ApiStatus
 */
export const isValidApiStatus = (value: string): value is ApiStatus => {
  return ["idle", "loading", "success", "error"].includes(value);
};

/**
 * Type guard to check if a response is an error response
 */
export const isErrorResponse = (
  response: unknown,
): response is ErrorResponse => {
  return (
    typeof response === "object" &&
    response !== null &&
    "message" in response &&
    "error_code" in response &&
    "status_code" in response
  );
};

/**
 * Type guard to check if a response is a successful API response
 */
export const isSuccessfulApiResponse = <T>(
  response: ApiResponse<T>,
): response is ApiResponse<T> & { success: true; data: T } => {
  return response.success === true && response.data !== undefined;
};

/**
 * Type guard to check if a topic generation request is valid
 */
export const isValidTopicGenerationRequest = (
  request: unknown,
): request is TopicGenerationRequest => {
  return (
    typeof request === "object" &&
    request !== null &&
    "wizardMode" in request &&
    "industry" in request &&
    "content_type" in request
  );
};

// ============================================================================
// HELPER FUNCTIONS FOR API OPERATIONS
// ============================================================================

/**
 * Generate a unique request ID
 */
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Generate a unique session ID
 */
export const generateSessionId = (): string => {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Create a standardized timestamp
 */
export const createTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Create an error response
 */
export const createErrorResponse = (
  message: string,
  error_code: string,
  status_code: HttpStatusCode,
  details?: ErrorResponse["details"],
): ErrorResponse => {
  return {
    message,
    error_code,
    status_code,
    details,
    timestamp: createTimestamp(),
  };
};

// ============================================================================
// TOPIC SAVE API INTERFACES
// ============================================================================

/**
 * Request interface for saving topics to user's library
 * Based on the backend cURL example in the plan file
 */
export interface SaveTopicRequest {
  /** Array of topics to save */
  topics: SaveTopicItem[];
  /** Optional session ID for tracking */
  session_id?: string;
  /** Client-generated request ID */
  request_id?: string;
  /** Request timestamp */
  timestamp?: string;
}

/**
 * Individual topic item to be saved - Backend API format
 *
 * This represents the expected structure for topics when saving to the backend.
 * Differs from GeneratedTopic by:
 * - No 'id' field (backend assigns IDs)
 * - No 'description' field
 * - Required non-empty arrays for channel_fit, audience_fit, tags
 *
 * @see GeneratedTopic in /types/topic-builder.ts for frontend format
 * @see SaveTopicItemSchema in /types/schemas.ts for validation
 * @see transformTopicForSaving in /types/schemas.ts for conversion helper
 */
export interface SaveTopicItem {
  /** Topic title/headline */
  title: string;
  /** Specific angle or approach */
  angle: string;
  /** Channels/platforms this topic fits well */
  channel_fit: string[];
  /** Audience segments this topic appeals to */
  audience_fit: string[];
  /** AI-generated quality scores */
  scores: {
    relevance: number;
    seo_potential: number;
    trend_level: number;
    uniqueness: number;
    reader_interest: number;
    actionable_potential: number;
    brand_alignment: number;
    controversy: number;
  };
  /** Explanation of why this topic works well */
  why_it_works: string;
  /** Categorization tags for the topic */
  tags: string[];
}

/**
 * Response interface for save topics operation
 */
export interface SaveTopicResponse {
  /** Whether the save operation was successful */
  success: boolean;
  /** Number of topics successfully saved */
  saved_count: number;
  /** Optional success message for user feedback */
  message?: string;
  /** Saved topic IDs (if backend assigns IDs) */
  saved_topic_ids?: string[];
  /** Request ID for tracking */
  request_id: string;
  /** Save timestamp */
  saved_at: string;
}

// ============================================================================
// TOPIC RETRIEVAL API INTERFACES
// ============================================================================

/**
 * Request interface for retrieving saved topics
 * Based on the backend cURL example in the plan file
 */
export interface GetTopicsRequest {
  /** Optional pagination parameters */
  pagination?: {
    /** Page number (1-based) */
    page?: number;
    /** Number of items per page */
    per_page?: number;
  };
  /** Optional filters */
  filters?: {
    /** Filter by tags */
    tags?: string[];
    /** Filter by date range */
    date_range?: {
      start_date: string;
      end_date: string;
    };
    /** Filter by minimum score thresholds */
    min_scores?: {
      relevance?: number;
      seo_potential?: number;
      trend_level?: number;
      uniqueness?: number;
      reader_interest?: number;
      actionable_potential?: number;
      brand_alignment?: number;
      controversy?: number;
    };
  };
  /** Sort options */
  sort?: {
    /** Field to sort by */
    field:
      | "created_at"
      | "title"
      | "relevance"
      | "seo_potential"
      | "trend_level"
      | "uniqueness"
      | "reader_interest"
      | "actionable_potential"
      | "brand_alignment"
      | "controversy";
    /** Sort direction */
    direction: "asc" | "desc";
  };
  /** Session ID for tracking */
  session_id?: string;
  /** Request ID */
  request_id?: string;
}

/**
 * Individual saved topic with metadata
 */
export interface SavedTopic extends SaveTopicItem {
  /** Unique topic ID assigned by backend */
  id: string;
  /** When the topic was saved */
  created_at: string;
  /** Last modified timestamp */
  updated_at?: string;
  /** Whether topic is marked as favorite */
  is_favorite?: boolean;
  /** User notes on the topic */
  user_notes?: string;
}

/**
 * Response interface for get topics operation
 */
export interface GetTopicsResponse {
  /** Array of saved topics */
  topics: SavedTopic[];
  /** Pagination information (if applicable) */
  pagination?: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  /** Response metadata */
  metadata: {
    /** Total number of topics in user's library */
    total_saved_topics: number;
    /** When the data was last updated */
    last_updated: string;
    /** Response generation time */
    response_time_ms?: number;
  };
  /** Request tracking */
  request_id: string;
  /** Response timestamp */
  retrieved_at: string;
}

// ============================================================================
// TYPE GUARDS FOR NEW INTERFACES
// ============================================================================

/**
 * Type guard to validate SaveTopicRequest
 */
export const isValidSaveTopicRequest = (
  request: unknown,
): request is SaveTopicRequest => {
  return (
    typeof request === "object" &&
    request !== null &&
    "topics" in request &&
    Array.isArray((request as SaveTopicRequest).topics) &&
    (request as SaveTopicRequest).topics.length > 0
  );
};

/**
 * Type guard to validate SaveTopicItem
 */
export const isValidSaveTopicItem = (item: unknown): item is SaveTopicItem => {
  return (
    typeof item === "object" &&
    item !== null &&
    "title" in item &&
    "angle" in item &&
    "scores" in item &&
    typeof (item as SaveTopicItem).title === "string" &&
    typeof (item as SaveTopicItem).angle === "string" &&
    typeof (item as SaveTopicItem).scores === "object"
  );
};

/**
 * Type guard to validate GetTopicsRequest
 */
export const isValidGetTopicsRequest = (
  request: unknown,
): request is GetTopicsRequest => {
  if (typeof request !== "object" || request === null) {
    return true; // Empty request is valid for get-all-topics
  }
  // Add more specific validation as needed
  return true;
};

// ============================================================================
// CONSISTENT RESPONSE FORMAT INTEGRATION
// ============================================================================

/**
 * Topic Generation API Response in consistent format
 */
export type ConsistentTopicGenerationResponse =
  ConsistentApiResponse<TopicGenerationResponse>;

/**
 * Topic Regeneration API Response in consistent format
 */
export type ConsistentTopicRegenerationResponse =
  ConsistentApiResponse<TopicRegenerationResponse>;

/**
 * Topic Save API Response in consistent format
 */
export type ConsistentTopicSaveResponse = ConsistentApiResponse<{
  /** Number of topics successfully saved */
  saved_count: number;
  /** IDs of saved topics */
  saved_topic_ids: string[];
  /** Any topics that failed to save */
  failed_topics?: Array<{
    topic_id: string;
    reason: string;
  }>;
}>;

/**
 * Topic Delete API Response in consistent format
 */
export type ConsistentTopicDeleteResponse = ConsistentApiResponse<{
  /** Number of topics successfully deleted */
  deleted_count: number;
  /** IDs of deleted topics */
  deleted_topic_ids: string[];
  /** Any topics that failed to delete */
  failed_deletions?: Array<{
    topic_id: string;
    reason: string;
  }>;
}>;

/**
 * Get Topics API Response in consistent format
 */
export type ConsistentGetTopicsResponse = ConsistentApiResponse<{
  /** Array of saved topics */
  topics: GeneratedTopic[];
  /** Total count of topics (for pagination) */
  total_count: number;
  /** Pagination metadata */
  pagination?: {
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}>;

// ============================================================================
// LEGACY COMPATIBILITY ADAPTERS
// ============================================================================

/**
 * Creates a legacy adapter for Topic Generation responses
 * Maintains backward compatibility during migration period
 */
export const topicGenerationLegacyAdapter = createLegacyAdapter<
  TopicGenerationResponse,
  TopicGenerationResponse
>({
  toLegacy: (data) => data,
  fromLegacy: (legacy) => legacy,
});

/**
 * Creates a legacy adapter for Topic Save responses
 * Maps from consistent format to current frontend expectations
 */
export const topicSaveLegacyAdapter = createLegacyAdapter<
  { saved_count: number; saved_topic_ids: string[] },
  { success: boolean; message: string; saved_topics: number }
>({
  toLegacy: (data) => ({
    success: true,
    message: `Successfully saved ${data.saved_count} topics`,
    saved_topics: data.saved_count,
  }),
  fromLegacy: (legacy) => ({
    saved_count: legacy.saved_topics || 0,
    saved_topic_ids: [],
  }),
});

// ============================================================================
// ERROR CODE MAPPING
// ============================================================================

/**
 * Maps backend error codes to frontend-friendly error categories
 * for better user experience and error handling
 */
export const ERROR_CODE_MAPPING: Record<
  BackendErrorCode,
  {
    category: string;
    userMessage: string;
    retryable: boolean;
    severity: ErrorSeverity;
  }
> = {
  // Validation Errors
  validation_failed: {
    category: "validation",
    userMessage: "Please check your input and try again",
    retryable: false,
    severity: "medium",
  },
  missing_field: {
    category: "validation",
    userMessage: "Some required fields are missing",
    retryable: false,
    severity: "medium",
  },
  invalid_format: {
    category: "validation",
    userMessage: "The format of your input is not valid",
    retryable: false,
    severity: "medium",
  },
  invalid_value: {
    category: "validation",
    userMessage: "One or more values are not valid",
    retryable: false,
    severity: "medium",
  },
  field_too_long: {
    category: "validation",
    userMessage: "Some fields are too long",
    retryable: false,
    severity: "low",
  },
  field_too_short: {
    category: "validation",
    userMessage: "Some fields are too short",
    retryable: false,
    severity: "low",
  },
  invalid_email_format: {
    category: "validation",
    userMessage: "Email format is not valid",
    retryable: false,
    severity: "medium",
  },
  invalid_phone_format: {
    category: "validation",
    userMessage: "Phone number format is not valid",
    retryable: false,
    severity: "medium",
  },
  invalid_url_format: {
    category: "validation",
    userMessage: "URL format is not valid",
    retryable: false,
    severity: "medium",
  },
  invalid_date_format: {
    category: "validation",
    userMessage: "Date format is not valid",
    retryable: false,
    severity: "medium",
  },
  duplicate_value: {
    category: "validation",
    userMessage: "This value already exists",
    retryable: false,
    severity: "medium",
  },
  value_out_of_range: {
    category: "validation",
    userMessage: "Value is outside the allowed range",
    retryable: false,
    severity: "medium",
  },
  invalid_file_type: {
    category: "validation",
    userMessage: "File type is not supported",
    retryable: false,
    severity: "medium",
  },
  file_too_large: {
    category: "validation",
    userMessage: "File is too large",
    retryable: false,
    severity: "medium",
  },
  missing_required_field: {
    category: "validation",
    userMessage: "Please fill in all required fields",
    retryable: false,
    severity: "medium",
  },

  // Authentication & Authorization Errors
  unauthorized: {
    category: "auth",
    userMessage: "Please log in to continue",
    retryable: false,
    severity: "high",
  },
  forbidden: {
    category: "auth",
    userMessage: "You don't have permission to perform this action",
    retryable: false,
    severity: "high",
  },
  token_expired: {
    category: "auth",
    userMessage: "Your session has expired. Please log in again",
    retryable: false,
    severity: "high",
  },
  token_invalid: {
    category: "auth",
    userMessage: "Authentication failed. Please log in again",
    retryable: false,
    severity: "high",
  },
  insufficient_permissions: {
    category: "auth",
    userMessage: "You don't have sufficient permissions",
    retryable: false,
    severity: "high",
  },
  account_locked: {
    category: "auth",
    userMessage: "Your account has been locked. Please contact support",
    retryable: false,
    severity: "critical",
  },
  account_suspended: {
    category: "auth",
    userMessage: "Your account has been suspended. Please contact support",
    retryable: false,
    severity: "critical",
  },
  authentication_required: {
    category: "auth",
    userMessage: "Authentication is required for this action",
    retryable: false,
    severity: "high",
  },
  invalid_credentials: {
    category: "auth",
    userMessage: "Invalid username or password",
    retryable: false,
    severity: "high",
  },
  session_expired: {
    category: "auth",
    userMessage: "Your session has expired. Please log in again",
    retryable: false,
    severity: "high",
  },

  // Resource Errors
  resource_not_found: {
    category: "resource",
    userMessage: "The requested item could not be found",
    retryable: false,
    severity: "medium",
  },
  duplicate_resource: {
    category: "resource",
    userMessage: "This item already exists",
    retryable: false,
    severity: "medium",
  },
  resource_conflict: {
    category: "resource",
    userMessage: "There was a conflict with this resource",
    retryable: false,
    severity: "medium",
  },
  resource_locked: {
    category: "resource",
    userMessage: "This resource is currently locked",
    retryable: true,
    severity: "medium",
  },
  resource_unavailable: {
    category: "resource",
    userMessage: "This resource is temporarily unavailable",
    retryable: true,
    severity: "medium",
  },
  resource_limit_exceeded: {
    category: "resource",
    userMessage: "You have exceeded the limit for this resource",
    retryable: false,
    severity: "high",
  },

  // Business Logic Errors
  business_rule_violation: {
    category: "business",
    userMessage: "This action violates business rules",
    retryable: false,
    severity: "medium",
  },
  operation_not_allowed: {
    category: "business",
    userMessage: "This operation is not allowed",
    retryable: false,
    severity: "medium",
  },
  workflow_violation: {
    category: "business",
    userMessage: "This action violates the workflow",
    retryable: false,
    severity: "medium",
  },
  dependency_violation: {
    category: "business",
    userMessage: "Dependencies prevent this action",
    retryable: false,
    severity: "medium",
  },
  state_transition_error: {
    category: "business",
    userMessage: "Invalid state transition",
    retryable: false,
    severity: "medium",
  },

  // External Service Errors
  external_service_error: {
    category: "external",
    userMessage:
      "External service is experiencing issues. Please try again later",
    retryable: true,
    severity: "high",
  },
  external_service_unavailable: {
    category: "external",
    userMessage: "External service is currently unavailable",
    retryable: true,
    severity: "high",
  },
  api_rate_limit_exceeded: {
    category: "external",
    userMessage: "Rate limit exceeded. Please wait before trying again",
    retryable: true,
    severity: "medium",
  },
  third_party_service_error: {
    category: "external",
    userMessage: "Third-party service error. Please try again later",
    retryable: true,
    severity: "high",
  },

  // System Errors
  internal_server_error: {
    category: "system",
    userMessage: "An internal server error occurred. Please try again later",
    retryable: true,
    severity: "critical",
  },
  service_unavailable: {
    category: "system",
    userMessage: "Service is temporarily unavailable. Please try again later",
    retryable: true,
    severity: "high",
  },
  database_error: {
    category: "system",
    userMessage: "Database error. Please try again later",
    retryable: true,
    severity: "critical",
  },
  configuration_error: {
    category: "system",
    userMessage: "Configuration error. Please contact support",
    retryable: false,
    severity: "critical",
  },
  timeout_error: {
    category: "network",
    userMessage: "Request timed out. Please try again",
    retryable: true,
    severity: "medium",
  },
  network_error: {
    category: "network",
    userMessage: "Network error. Please check your connection and try again",
    retryable: true,
    severity: "medium",
  },
  storage_error: {
    category: "system",
    userMessage: "Storage error. Please try again later",
    retryable: true,
    severity: "high",
  },
  memory_error: {
    category: "system",
    userMessage: "Memory error. Please try again later",
    retryable: true,
    severity: "critical",
  },
  unknown_error: {
    category: "system",
    userMessage: "An unknown error occurred. Please try again later",
    retryable: true,
    severity: "medium",
  },
  invalid_response_format: {
    category: "system",
    userMessage: "Received unexpected response format. Please try again",
    retryable: true,
    severity: "medium",
  },
};

/**
 * Gets user-friendly error information for a backend error code
 * @param errorCode - Backend error code
 * @returns User-friendly error information
 */
export function getErrorInfo(errorCode: BackendErrorCode) {
  return ERROR_CODE_MAPPING[errorCode] || ERROR_CODE_MAPPING.unknown_error;
}
