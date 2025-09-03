import type { GeneratedTopic } from "./topic-builder";

/**
 * Backend API payload structure for topic generation request
 */
export interface BackendTopicGenerationPayload {
  /** Industry or domain */
  industry: string;
  /** Subject for subject-first mode */
  subject?: string;
  /** Content type */
  content_type: string;
  /** Platform for content distribution */
  platform?: string;
  /** Target audience list */
  audience?: string[];
  /** Content purposes */
  purpose: string[];
  /** Tone preferences */
  tone: string[];
  /** Keywords to focus on */
  keywords?: string;
  /** Topics to exclude */
  exclude?: string;
  /** Number of ideas to generate */
  num_ideas: number;
  /** Industry-specific focus area */
  industry_specific_focus?: string;
  /** Additional notes */
  additional_notes?: string;
  /** Content timing preference */
  content_timing_preference?: string;
  /** Content originality preference */
  content_originality_preference?: string;
  /** Geographic/demographic location */
  demographic_location: string[];
  /** Request timestamp */
  timestamp: string;
  /** Wizard mode */
  wizard_mode: string;
}

/**
 * Backend API response structure for topic generation
 */
export interface BackendTopicGenerationResponse {
  /** Generated topics */
  topics: GeneratedTopic[];
  /** Unique request identifier */
  request_id: string;
  /** Model used for generation */
  model_used?: string;
  /** Generation time in milliseconds */
  generation_time_ms?: number;
}

/**
 * Backend API configuration
 */
export interface BackendConfig {
  /** Base URL for backend API */
  baseUrl: string;
  /** Timeout for requests in milliseconds */
  timeout?: number;
  /** Retry attempts for failed requests */
  retryAttempts?: number;
}

/**
 * Backend API error types
 */
export type BackendErrorType =
  | "network_error"
  | "timeout_error"
  | "validation_error"
  | "server_error"
  | "configuration_error"
  | "parsing_error";

/**
 * Backend API error structure
 */
export interface BackendError {
  /** Error type */
  type: BackendErrorType;
  /** Error message */
  message: string;
  /** HTTP status code if applicable */
  statusCode?: number;
  /** Original error object */
  originalError?: Error;
}
