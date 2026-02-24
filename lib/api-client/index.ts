/**
 * Unified API Client
 *
 * Single source of truth for all API interactions across the frontend.
 * Replaces BackendService, ContentApiService, WorkspaceApiService, etc.
 *
 * Usage:
 *   import { apiClient } from '@/lib/api-client';
 *
 *   const topics = await apiClient.topics.list(workspaceId);
 *   const workspace = await apiClient.workspaces.get(workspaceId);
 */

/**
 * Workspace ID Parameter Convention
 *
 * The backend uses two patterns for workspace-scoped endpoints:
 *
 * 1. Path parameter: /api/v1/workspaces/{workspaceId}/...
 *    Used by: workspaces, members, media, knowledge, personas
 *
 * 2. Query parameter: ?workspace_id={workspaceId}
 *    Used by: content, topics, users (list), admin-analytics
 *
 * Convention for NEW endpoints: Prefer path parameters for workspace scoping
 * (Pattern 1) as it follows REST resource hierarchy best practices.
 *
 * A future migration to standardize all endpoints on path parameters
 * requires backend coordination. See TASK-037 for the full inventory.
 */

import {
  createAuditLogsNamespace,
  createEmailTemplatesNamespace,
  createImpersonationNamespace,
  type EmailTemplate,
} from "./admin";
import { createAdminAnalyticsNamespace } from "./admin-analytics";
import { createAdminInvitationsNamespace } from "./admin-invitations";
import { createAdminRefundsNamespace } from "./admin-refunds";
import { createAdminWebhooksNamespace } from "./admin-webhooks";

// Re-export types for convenience
export type { EmailTemplate };

import { createContentNamespace } from "./content";
import { ApiClient } from "./core";
import { createDashboardNamespace } from "./dashboard";
import { createKnowledgeNamespace } from "./knowledge";
import { createLicensesClient } from "./licenses";
import { createMediaNamespace } from "./media";
import { createInvitationsNamespace, createMembersNamespace } from "./members";
import { createOnboardingNamespace } from "./onboarding";
import { createPersonasNamespace } from "./personas";
import { createAccountNamespace, createProfileNamespace } from "./profile";
import { createRolesNamespace } from "./roles";
import {
  createNotificationsNamespace,
  createPreferencesNamespace,
  createSecurityNamespace,
  createSessionsNamespace,
} from "./settings";
import { createSubscriptionsNamespace } from "./subscriptions";
import { createTopicsNamespace } from "./topics";
import { createUsersNamespace } from "./users";
import { createWorkspacesNamespace } from "./workspaces";

// ============================================================================
// UNIFIED API CLIENT INSTANCE
// ============================================================================

/**
 * Create and configure the unified API client
 */
function createApiClient() {
  const client = new ApiClient();

  return {
    // Core request method (for custom requests if needed)
    request: client.request.bind(client),

    // Feature namespaces
    topics: createTopicsNamespace(client),
    content: createContentNamespace(client),
    dashboard: createDashboardNamespace(client),
    workspaces: createWorkspacesNamespace(client),
    knowledge: createKnowledgeNamespace(client),
    media: createMediaNamespace(client),
    members: createMembersNamespace(client),
    invitations: createInvitationsNamespace(client),
    roles: createRolesNamespace(client),
    subscriptions: createSubscriptionsNamespace(client),
    licenses: createLicensesClient(client),
    profile: createProfileNamespace(client),
    account: createAccountNamespace(client),
    onboarding: createOnboardingNamespace(client),
    personas: createPersonasNamespace(client),

    // Admin namespaces
    users: createUsersNamespace(client),
    impersonation: createImpersonationNamespace(client),
    auditLogs: createAuditLogsNamespace(client),
    emailTemplates: createEmailTemplatesNamespace(client),
    adminAnalytics: createAdminAnalyticsNamespace(client),
    adminWebhooks: createAdminWebhooksNamespace(client),
    adminRefunds: createAdminRefundsNamespace(client),
    adminInvitations: createAdminInvitationsNamespace(client),

    // Settings namespaces
    notifications: createNotificationsNamespace(client),
    sessions: createSessionsNamespace(client),
    security: createSecurityNamespace(client),
    preferences: createPreferencesNamespace(client),

    // Utility methods
    cancelAllRequests: () => client.cancelAllRequests(),
    getActiveRequestsCount: () => client.getActiveRequestsCount(),
  };
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Unified API Client - Single instance for the entire application
 *
 * @example
 * ```typescript
 * // Topics
 * const topics = await apiClient.topics.list(workspaceId);
 * await apiClient.topics.generate(formData);
 *
 * // Content
 * const content = await apiClient.content.list(workspaceId);
 * await apiClient.content.create(workspaceId, data);
 *
 * // Workspaces
 * const workspaces = await apiClient.workspaces.list();
 * await apiClient.workspaces.update(workspaceId, data);
 *
 * // Knowledge
 * const webKnowledge = await apiClient.knowledge.listWeb(workspaceId);
 * await apiClient.knowledge.addFile(data);
 *
 * // Members & Invitations
 * const members = await apiClient.members.list(workspaceId);
 * await apiClient.invitations.create(data);
 *
 * // Profile & Account
 * const profile = await apiClient.profile.get();
 * await apiClient.account.requestDataExport();
 *
 * // Admin
 * await apiClient.impersonation.start(userId);
 * const logs = await apiClient.auditLogs.getMyLogs();
 * const templates = await apiClient.emailTemplates.list(workspaceId);
 *
 * // Settings
 * const prefs = await apiClient.notifications.getPreferences();
 * const sessions = await apiClient.sessions.list();
 * const stats = await apiClient.security.getStats();
 * ```
 */
export const apiClient = createApiClient();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ApiClientInstance = ReturnType<typeof createApiClient>;

// Re-export core types
export { ApiError } from "./core";
