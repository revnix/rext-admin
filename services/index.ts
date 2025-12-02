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

// Export API error handling
export {
  ApiErrorHandler,
  apiErrorHandler,
  handleApiError,
  useApiErrorHandler,
  withApiErrorHandling,
  withErrorHandling,
} from "@/lib/api-error-middleware";
// Export authentication utilities (AuthJS-based)
export { authenticatedFetch, getAuthHeaders } from "@/lib/auth-utils";
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
// Export security monitoring types
export type {
  FailedLoginAttempt,
  FailedLoginsResponse,
  LockedAccount,
  LockedAccountsResponse,
  LoginEvent,
  LoginHistory,
  ResetFailedAttemptsRequest,
  SecurityStats,
  TopFailedLoginIP,
  TopFailedLoginUser,
  UnlockAccountRequest,
} from "@/types/security";
// Export subscription types
export type {
  BillingPeriod,
  SubscriptionCancelRequest,
  SubscriptionCreateRequest,
  SubscriptionHistoryEntry,
  SubscriptionHistoryResponse,
  SubscriptionListResponse,
  SubscriptionPlan,
  SubscriptionPlanCreate,
  SubscriptionPlanUpdate,
  SubscriptionStatus,
  SubscriptionUpgradeRequest,
  SubscriptionWithPlan,
  TrialStatus,
  UsageStats,
  UserSubscription,
} from "@/types/subscription";
// Re-export topic builder types that are commonly used with services
export type {
  GeneratedTopic,
  TopicBuilderFormData,
  TopicGenerationRequest,
  TopicGenerationResponse,
} from "@/types/topic-builder";
// Export session types
export type {
  RevokeAllSessionsResponse,
  RevokeSessionResponse,
  SessionListResponse,
  UserSession,
} from "@/types/user-session";
// Export audit log API functions
export {
  AuditLogApiService,
  getAllAuditLogs,
  getAuditLogById,
  getMyAuditLogs,
} from "./audit-log-api";
// Export notification API service
export {
  NotificationApiService,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
} from "./notification-api";
// Export the main service class and default instance
// Export legacy compatibility function (marked as deprecated)
export {
  BackendService,
  backendService,
  generateTopicsWithBackend,
} from "./backend";
export type {
  ImpersonationStartRequest,
  ImpersonationStartResponse,
  ImpersonationStatus,
  ImpersonationStopResponse,
} from "./impersonation-api";
// Export impersonation API service
export {
  ImpersonationApiService,
  impersonationApiService,
} from "./impersonation-api";
// Knowledge API services have been migrated to apiClient
// Use: import { apiClient } from '@/lib/api-client'; apiClient.knowledge.*
export type {
  Permission,
  PermissionListResponse,
  Role,
  RoleListResponse,
} from "./role-api";
// Export role API service
export {
  RoleApiService,
  roleApiService,
} from "./role-api";
// Security monitoring API has been migrated to apiClient
// Use: import { apiClient } from '@/lib/api-client'; apiClient.security.*
// Session API has been migrated to apiClient
// Use: import { apiClient } from '@/lib/api-client'; apiClient.sessions.*
// Subscription API has been migrated to apiClient
// Use: import { apiClient } from '@/lib/api-client'; apiClient.subscriptions.*
// Workspace API has been migrated to apiClient
// Use: import { apiClient } from '@/lib/api-client'; apiClient.workspaces.*
// Note: WorkspaceApiError is now WorkspaceServiceError from "./workspace/workspace-service"
