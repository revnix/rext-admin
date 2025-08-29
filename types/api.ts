/**
 * API Request/Response Type Interfaces for Topic Builder
 *
 * This module defines all TypeScript interfaces for API interactions in the Topic Builder,
 * extending the core TopicBuilderFormData with API-specific fields and providing
 * comprehensive request/response structures for topic generation operations.
 */

import { TopicBuilderFormData, GeneratedTopic } from "./topic-builder";

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
  /** Array of AI-generated topic ideas */
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
    "flowType" in request &&
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
