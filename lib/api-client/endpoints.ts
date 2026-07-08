/**
 * Centralized registry of all API endpoints.
 *
 * This file serves as the single source of truth for API paths, documenting
 * backend conventions, inconsistencies, and grouping resources logically.
 *
 * # API Path Convention Taxonomy
 *
 * 1. **Workspace-Scoped Resources**
 *    - Standard: `/api/v1/workspaces/{workspace_id}/{resource}`
 *    - Legacy (Query): `/api/v1/{resource}?workspace_id={id}`
 *      @see TOPICS, CONTENT
 *
 * 2. **User-Scoped Resources**
 *    - Standard: `/api/v1/user/{resource}`
 *    - Note: Uses singular `user` namespace unlike `workspaces`
 *
 * 3. **Platform-Level Resources**
 *    - Subscriptions: `/api/v1/subscriptions/{resource}`
 *    - Onboarding: `/api/v1/onboarding/{resource}`
 *    - Admin: `/api/v1/admin/{resource}`
 *
 * 4. **Public Resources**
 *    - Token-based access for invites, public content, etc.
 *
 * @note Many inconsistencies exist in the backend (e.g., singular vs plural namespaces).
 * These constants preserve existing behavior exactly. DO NOT correct paths here
 * without backend coordination.
 */

export const ENDPOINTS = {
  /**
   * Workspace Endpoints
   * Standard RESTful resource for workspace management.
   */
  WORKSPACES: {
    BASE: "/api/v1/workspaces/",
    BASE_ALL: "/api/v1/workspaces/all",
    byId: (id: string) => `/api/v1/workspaces/${id}` as const,
    bySlug: (slug: string) => `/api/v1/workspaces/slug/${slug}` as const,

    // Brand Voice
    brandVoice: (id: string) => `/api/v1/workspaces/${id}/brand-voice` as const,
    refreshBrandVoice: (id: string) =>
      `/api/v1/workspaces/${id}/brand-voice/refresh` as const,

    // Permissions
    permissions: {
      me: (id: string) => `/api/v1/workspaces/${id}/permissions/me` as const,
      check: (id: string) =>
        `/api/v1/workspaces/${id}/permissions/check` as const,
      refresh: (id: string) =>
        `/api/v1/workspaces/${id}/permissions/refresh` as const,
      member: (workspaceId: string, userId: string) =>
        `/api/v1/workspaces/${workspaceId}/members/${userId}/permissions` as const,
    },

    // Stats
    stats: (id: string) => `/api/v1/workspaces/${id}/stats` as const,

    // Roles
    availableRoles: "/api/v1/workspaces/available-roles",
  },

  /**
   * Members Endpoints
   * @note Workspace-scoped member management
   */
  MEMBERS: {
    list: (workspaceId: string) =>
      `/api/v1/workspaces/${workspaceId}/members` as const,
    add: (workspaceId: string) =>
      `/api/v1/workspaces/${workspaceId}/members` as const,
    remove: (workspaceId: string, memberId: string) =>
      `/api/v1/workspaces/${workspaceId}/members/${memberId}` as const,
    changeRole: (workspaceId: string, memberId: string) =>
      `/api/v1/workspaces/${workspaceId}/members/${memberId}/role` as const,
  },

  /**
   * Personas Endpoints
   * @note Workspace-scoped persona management
   */
  PERSONAS: {
    list: (workspaceId: string) =>
      `/api/v1/workspaces/${workspaceId}/personas` as const,
    create: (workspaceId: string) =>
      `/api/v1/workspaces/${workspaceId}/personas` as const,
    get: (workspaceId: string, personaId: string) =>
      `/api/v1/workspaces/${workspaceId}/personas/${personaId}` as const,
    update: (workspaceId: string, personaId: string) =>
      `/api/v1/workspaces/${workspaceId}/personas/${personaId}` as const,
    delete: (workspaceId: string, personaId: string) =>
      `/api/v1/workspaces/${workspaceId}/personas/${personaId}` as const,
  },

  /**
   * Invitations Endpoints
   * @note Mixed scoping: workspace-scoped and user-scoped endpoints
   * @note Uses inconsistent naming: /workspace/invitations (singular) vs /workspaces/{id}/invitations
   */
  INVITATIONS: {
    // Workspace-scoped invitations
    validate: (token: string) =>
      `/api/v1/invitations/${token}/validate` as const,
    accept: (token: string) => `/api/v1/invitations/${token}/accept` as const,
    create: (workspaceId: string) =>
      `/api/v1/workspaces/${workspaceId}/invitations` as const,
    createBulk: (workspaceId: string) =>
      `/api/v1/workspaces/${workspaceId}/invitations/bulk` as const,
    listSent: (workspaceId: string) =>
      `/api/v1/workspaces/${workspaceId}/invitations` as const,
    detail: (workspaceId: string, invitationId: string) =>
      `/api/v1/workspaces/${workspaceId}/invitations/${invitationId}` as const,
    revoke: (workspaceId: string, invitationId: string) =>
      `/api/v1/workspaces/${workspaceId}/invitations/${invitationId}` as const,
    resend: (workspaceId: string, invitationId: string) =>
      `/api/v1/workspaces/${workspaceId}/invitations/${invitationId}/resend` as const,

    // User-scoped invitations (uses singular "workspace" - inconsistent)
    listReceived: "/api/v1/workspace/invitations/received",
    pending: "/api/v1/user/invitations/pending",
  },

  /**
   * Topic Endpoints
   * @note Uses singular `topic` namespace (Inconsistent)
   * @note Uses verb-based paths like `get-topics`, `save-topic` (RPC-style)
   * @note Uses query parameter for workspace scoping
   */
  TOPICS: {
    BASE: "/api/v1/topic",
    list: "/api/v1/topic/get-topics",
    get: (id: string) => `/api/v1/topic/get-topic/${id}` as const,
    generate: "/api/v1/topic/generate-topic",
    save: "/api/v1/topic/save-topic",
    update: "/api/v1/topic/update-topic",
    delete: "/api/v1/topic/delete-topic",
  },

  /**
   * Content Endpoints
   * @note Uses singular `content` namespace
   * @note Mixed REST and verb-based paths (`save`, `publish`, `retry`)
   * @note Uses query parameter for workspace scoping
   */
  CONTENT: {
    base: "/api/v1/content/",
    detail: (id: string) => `/api/v1/content/${id}` as const,
    save: "/api/v1/content/save",
    save_publish: "/api/v1/content/publish",
    publish: (id: string) => `/api/v1/content/${id}/publish` as const,
    retry: (id: string) => `/api/v1/content/${id}/retry` as const,
    cancel_schedule: (id: string) => `/api/v1/content/${id}/schedule` as const,
    calendar: "/api/v1/content/calendar",
  },

  /**
   * User Endpoints
   * @note Uses singular `user` namespace
   */
  USERS: {
    list: "/api/v1/user/users", // Inconsistent: /user/users
    byId: (id: string) => `/api/v1/user/${id}` as const,
    register: "/api/v1/user/register",
    registerWithInvitation: "/api/v1/user/register-with-invitation",

    // Sessions
    sessions: {
      list: "/api/v1/user/sessions",
      detail: (id: string) => `/api/v1/user/sessions/${id}` as const,
      revokeAll: "/api/v1/user/sessions",
    },
  },

  /**
   * Profile Endpoints
   * @note User profile management
   */
  PROFILE: {
    get: "/api/v1/user/profile",
    update: "/api/v1/user/profile",
    changePassword: "/api/v1/user/change-password",
    avatar: {
      upload: "/api/v1/user/avatar/upload",
      delete: "/api/v1/user/avatar",
    },
    resendVerification: "/api/v1/user/resend-verification",
  },

  /**
   * Account Endpoints
   * @note User account operations (data export, deactivation)
   */
  ACCOUNT: {
    exportData: "/api/v1/user/export-data",
    deactivate: "/api/v1/user/deactivate",
  },

  /**
   * Settings Endpoints
   * @note User settings and preferences (notifications, sessions, security, preferences)
   */
  SETTINGS: {
    notifications: {
      getPreferences: "/api/v1/user/preferences/notifications",
      updatePreferences: "/api/v1/user/preferences/notifications",
    },
    sessions: {
      list: "/api/v1/user/sessions",
      revoke: (sessionId: string) =>
        `/api/v1/user/sessions/${sessionId}` as const,
      revokeAll: "/api/v1/user/sessions",
    },
    security: {
      stats: "/api/v1/security/stats",
      loginHistory: "/api/v1/user/security/login-history",
      activeSessionsCount: "/api/v1/user/security/active-sessions-count",
    },
    preferences: {
      get: "/api/v1/user/preferences",
      update: "/api/v1/user/preferences",
    },
  },

  /**
   * Subscription Endpoints
   * @note Uses plural `subscriptions` namespace
   */
  SUBSCRIPTIONS: {
    BASE: "/api/v1/subscriptions",
    mySubscription: "/api/v1/subscriptions/my-subscription",
    plans: "/api/v1/subscriptions/plans",
    checkout: "/api/v1/subscriptions/checkout",
    portal: "/api/v1/subscriptions/portal",
    upgrade: "/api/v1/subscriptions/upgrade",
    downgrade: "/api/v1/subscriptions/downgrade",
    cancel: "/api/v1/subscriptions/cancel",
    invoices: "/api/v1/subscriptions/invoices",
    history: "/api/v1/subscriptions/history",
    usage: "/api/v1/subscriptions/usage",
    credits: "/api/v1/subscriptions/credits",
    trialStatus: "/api/v1/subscriptions/trial-status",
  },

  /**
   * Onboarding Endpoints
   * Managed via dedicated namespace
   */
  ONBOARDING: {
    BASE: "/api/v1/onboarding",
    update: "/api/v1/onboarding/update",
    marketing: "/api/v1/onboarding/marketing",
    complete: "/api/v1/onboarding/complete",
    reset: "/api/v1/onboarding/reset",
    shouldShow: "/api/v1/onboarding/should-show",
  },
  /**
   * Dashboard Endpoints
   * @note Non-standard workspace scoping: uses `/api/v1/dashboard/{id}` instead of `/api/v1/workspaces/{id}/dashboard`
   * @note Workspace ID in path but not a nested resource under workspaces
   */
  DASHBOARD: {
    stats: (workspaceId: string) => `/api/v1/dashboard/${workspaceId}` as const,
    recentActivities: (workspaceId: string) =>
      `/api/v1/recent-activities/${workspaceId}` as const,
  },
  /**
   * Admin Endpoints
   * @note Standard admin prefix
   * @note Email templates use singular "workspace" (Inconsistent)
   */
  ADMIN: {
    BASE: "/api/v1/admin",

    // Impersonation
    impersonation: {
      start: "/api/v1/user/impersonate/start",
      stop: "/api/v1/user/impersonate/stop",
      status: "/api/v1/user/impersonate/status",
    },

    // Audit Logs
    audit: {
      myLogs: "/api/v1/audit-logs/user/my-logs",
      allLogs: "/api/v1/audit-logs/",
      detail: (id: string) => `/api/v1/audit/${id}` as const,
    },

    // Email Templates (uses singular "workspace" - backend inconsistency)
    emailTemplates: {
      list: (workspaceId: string) =>
        `/api/v1/workspace/email-templates/${workspaceId}` as const,
      variables: (templateType: string) =>
        `/api/v1/workspace/email-templates/variables/${templateType}` as const,
      defaults: (templateType: string) =>
        `/api/v1/workspace/email-templates/defaults/${templateType}` as const,
      preview: "/api/v1/workspace/email-templates/preview",
      create: "/api/v1/workspace/email-templates/",
      update: (templateId: string) =>
        `/api/v1/workspace/email-templates/${templateId}` as const,
      delete: (templateId: string) =>
        `/api/v1/workspace/email-templates/${templateId}` as const,
    },

    // Analytics
    analytics: "/api/v1/admin/analytics",
    // Users
    users: "/api/v1/admin/users",
    // Workspaces
    workspaces: "/api/v1/admin/workspaces",
    // Invitations
    invitations: "/api/v1/admin/invitations",
    // Refunds
    refunds: "/api/v1/admin/refunds",
    // Webhooks
    webhooks: "/api/v1/admin/webhooks",
  },

  /**
   * Admin Analytics Endpoints
   * @note Platform-level analytics for subscriptions and invitations
   * @note Requires super admin role
   */
  ADMIN_ANALYTICS: {
    subscriptions: {
      overview: "/api/v1/admin/subscriptions/stats/overview",
      revenue: "/api/v1/admin/subscriptions/stats/revenue",
      churn: "/api/v1/admin/subscriptions/stats/churn",
      trialConversion: "/api/v1/admin/subscriptions/stats/trial-conversion",
    },
    invitations: {
      analytics: "/api/v1/admin/analytics/invitations/analytics",
    },
  },

  /**
   * Admin Refunds Endpoints
   * @note Platform-level refund management
   * @note Requires super admin role
   */
  ADMIN_REFUNDS: {
    list: "/api/v1/admin/subscriptions/refunds",
    get: (refundId: string) =>
      `/api/v1/admin/subscriptions/refunds/${refundId}` as const,
    create: "/api/v1/admin/subscriptions/refunds/create",
  },

  /**
   * Admin Webhooks Endpoints
   * @note Platform-level webhook event monitoring
   * @note Requires super admin role
   */
  ADMIN_WEBHOOKS: {
    events: "/api/v1/admin/subscriptions/webhooks/events",
    failed: "/api/v1/admin/subscriptions/webhooks/failed",
    retry: (eventId: string) =>
      `/api/v1/admin/subscriptions/webhooks/${eventId}/retry` as const,
    stats: "/api/v1/admin/subscriptions/webhooks/stats",
  },

  /**
   * Admin Invitations Endpoints
   * @note Platform-level admin invitation management
   * @note Path mismatch: CRUD uses `/admin/platform/invitations` vs token ops use `/admin-invitations/{token}`
   * @note Only accessible to super_admin users
   */
  ADMIN_INVITATIONS: {
    // CRUD operations (admin only)
    base: "/api/v1/admin/platform/invitations",
    create: "/api/v1/admin/platform/invitations",
    list: "/api/v1/admin/platform/invitations",
    detail: (invitationId: string) =>
      `/api/v1/admin/platform/invitations/${invitationId}` as const,
    resend: (invitationId: string) =>
      `/api/v1/admin/platform/invitations/${invitationId}/resend` as const,
    revoke: (invitationId: string) =>
      `/api/v1/admin/platform/invitations/${invitationId}` as const,

    // Token-based operations (public)
    validate: (token: string) =>
      `/api/v1/admin-invitations/${token}/validate` as const,
    accept: (token: string) =>
      `/api/v1/admin-invitations/${token}/accept` as const,
    decline: (token: string) =>
      `/api/v1/admin-invitations/${token}/decline` as const,
  },

  /**
   * License Endpoints
   * @note Manages license activation and validation
   */
  LICENSES: {
    BASE: "/api/v1/licenses",
    list: "/api/v1/licenses",
    detail: (licenseId: string) => `/api/v1/licenses/${licenseId}` as const,
    activations: (licenseId: string) =>
      `/api/v1/licenses/${licenseId}/activations` as const,
    activate: "/api/v1/licenses/activate",
    deactivate: (licenseId: string) =>
      `/api/v1/licenses/${licenseId}/deactivate` as const,
    validate: "/api/v1/licenses/validate",
  },
  /**
   * Media Endpoints
   * @note Workspace-scoped media/file management
   * @note Handles file uploads, storage, and usage tracking
   */
  MEDIA: {
    base: (workspaceId: string) =>
      `/api/v1/workspaces/${workspaceId}/media` as const,
    upload: (workspaceId: string) =>
      `/api/v1/workspaces/${workspaceId}/media/upload` as const,
    detail: (workspaceId: string, mediaId: string) =>
      `/api/v1/workspaces/${workspaceId}/media/${mediaId}` as const,
    bulkDelete: (workspaceId: string) =>
      `/api/v1/workspaces/${workspaceId}/media/bulk-delete` as const,
    usage: {
      stats: (workspaceId: string) =>
        `/api/v1/workspaces/${workspaceId}/media/usage/stats` as const,
      detail: (workspaceId: string, mediaId: string) =>
        `/api/v1/workspaces/${workspaceId}/media/${mediaId}/usage` as const,
    },
  },

  /**
   * Roles Endpoints
   * @note Platform-level role management
   */
  ROLES: {
    list: "/api/v1/roles/",
    get: (roleId: string) => `/api/v1/roles/${roleId}` as const,
    create: "/api/v1/roles/",
    update: (roleId: string) => `/api/v1/roles/${roleId}` as const,
    delete: (roleId: string) => `/api/v1/roles/${roleId}` as const,
    permissions: {
      assign: (roleId: string) =>
        `/api/v1/roles/${roleId}/permissions` as const,
      revoke: (roleId: string, permissionId: string) =>
        `/api/v1/roles/${roleId}/permissions/${permissionId}` as const,
    },
  },

  /**
   * Permissions Endpoints
   * @note Platform-level permission management
   */
  PERMISSIONS: {
    list: "/api/v1/permissions/",
    get: (permissionId: string) =>
      `/api/v1/permissions/${permissionId}` as const,
    create: "/api/v1/permissions/",
    update: (permissionId: string) =>
      `/api/v1/permissions/${permissionId}` as const,
    delete: (permissionId: string) =>
      `/api/v1/permissions/${permissionId}` as const,
  },

  /**
   * Public Endpoints
   * Accessible without session authentication (usually via token)
   */
  PUBLIC: {
    // Shared content, public profiles, etc.
    // Placeholders for future use patterns
    HEALTH: "/api/health",
  },

  /**
   * Keyword Library Endpoints
   * @note Workspace-scoped keyword storage management
   */
  KEYWORD_LIBRARY: {
    base: "/store/items",
  },

  /**
   * Google Search Console / GA4 Integration Endpoints
   * @note Uses query parameter for workspace scoping (`?workspace_id=`),
   * matching CONTENT/DASHBOARD/TOPICS' existing convention for this backend.
   * Covers connection setup, per-site GSC/GA4 mapping, and Modules 1-4
   * (Dashboard, Content Inventory, Content Health Score, Opportunity Score).
   */
  GOOGLE_INTEGRATION: {
    status: "/api/v1/integrations/google/",
    connect: "/api/v1/integrations/google/connect",
    disconnect: "/api/v1/integrations/google/",
    searchConsoleSites: "/api/v1/integrations/google/search-console/sites",
    siteMapping: (siteId: string) =>
      `/api/v1/integrations/google/sites/${siteId}/mapping` as const,

    dashboard: "/api/v1/integrations/google/dashboard/",
    contentInventory: "/api/v1/integrations/google/content-inventory/",
    contentPerformance: (contentId: string) =>
      `/api/v1/integrations/google/content/${contentId}/performance` as const,
    healthScore: (contentId: string) =>
      `/api/v1/integrations/google/content/${contentId}/health-score` as const,
    opportunityScore: (contentId: string) =>
      `/api/v1/integrations/google/content/${contentId}/opportunity-score` as const,
    opportunities: "/api/v1/integrations/google/opportunities",
  },
} as const;
