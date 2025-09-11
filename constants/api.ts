/**
 * API Constants
 *
 * Centralized API endpoints, status codes, and configuration
 */

// API Endpoints
export const API_ENDPOINTS = {
  GENERATE_TOPICS: "/api/topics/generate",
  TASKS: "/api/tasks",
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Error Codes
export const ERROR_CODES = {
  VALIDATION_FAILED: "validation_failed",
  BACKEND_UNAVAILABLE: "backend_unavailable",
  CONFIGURATION_ERROR: "configuration_error",
  INVALID_RESPONSE: "invalid_response",
  TIMEOUT_ERROR: "timeout_error",
  GENERATION_FAILED: "generation_failed",
} as const;

// Request/Response Configuration
export const API_CONFIG = {
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  STALE_TIME: 2 * 60 * 1000, // 2 minutes
} as const;
