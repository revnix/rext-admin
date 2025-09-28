/**
 * @fileoverview Centralized export point for all service layer functions and classes.
 *
 * This module provides a single entry point for importing all backend service
 * functionality, making it easy to consume throughout the application.
 *
 * @example
 * ```typescript
 * // Import the default service instance
 * import { backendService } from '@/services';
 *
 * // Import specific types
 * import type { BackendConfig, SaveTopicResponse } from '@/services';
 *
 * // Use the service
 * const response = await backendService.generateTopics(formData);
 *
 * // Import error utilities
 * import { classifyError, DEFAULT_RETRY_CONFIG } from '@/services';
 * ```
 */

// Export authentication services
export {
  AuthenticatedFetch,
  AuthManager,
  authenticatedFetch,
  authManager,
  useAuth,
  useAuthenticatedFetch,
  useAuthStore,
} from "@/lib/api-auth";
// Export API error handling
export {
  ApiErrorHandler,
  apiErrorHandler,
  handleApiError,
  useApiErrorHandler,
  withApiErrorHandling,
  withErrorHandling,
} from "@/lib/api-error-middleware";
// Export error handling utilities for advanced use cases
export {
  calculateRetryDelay,
  classifyError,
  DEFAULT_RETRY_CONFIG,
  generateRequestId,
  sanitizeErrorForLogging,
  shouldRetry,
} from "@/lib/error-utils";
// Export transformation utilities
export { transformTopicsForDisplay } from "@/lib/simple-topic-transformer";
// Re-export all backend-related types for convenience
export type {
  APIErrorResponse,
  // Service configuration types
  BackendConfig,
  // Error handling types
  BackendError,
  BackendErrorType,
  // API payload and response types
  BackendTopicGenerationPayload,
  BackendTopicGenerationResponse,
  ErrorRecoveryAction,
  RetryConfig,
  SaveTopicRequest,
  SaveTopicResponse,
} from "@/types/backend";
// Re-export ErrorSeverity from consistent-response
export type { ErrorSeverity } from "@/types/consistent-response";
// Re-export topic builder types that are commonly used with services
export type {
  GeneratedTopic,
  TopicBuilderFormData,
  TopicGenerationRequest,
  TopicGenerationResponse,
} from "@/types/topic-builder";
// Export the main service class and default instance
// Export legacy compatibility function (marked as deprecated)
export {
  BackendService,
  backendService,
  generateTopicsWithBackend,
} from "./backend";
// Export knowledge API services
export {
  FileKnowledgeService,
  fileKnowledgeService,
  KnowledgeService,
  knowledgeService,
  TextKnowledgeService,
  textKnowledgeService,
  WebKnowledgeService,
  webKnowledgeService,
} from "./knowledge-api";
// Export workspace API service
export {
  WorkspaceApiError,
  WorkspaceApiService,
  workspaceApiService,
} from "./workspace-api";
