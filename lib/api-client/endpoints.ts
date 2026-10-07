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
 *      @see CONTENT
 *
 * 2. **User-Scoped Resources**
 *    - Standard: `/api/v1/user/{resource}`
 *    - Note: Uses singular `user` namespace unlike `workspaces`
 *
 * 3. **Platform-Level Resources**
 *    - Subscriptions: `/api/v1/subscriptions/{resource}`
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
    deleted: () => "/api/v1/workspaces/deleted" as const,
    restore: (id: string) => `/api/v1/workspaces/${id}/restore` as const,
    transferOwnership: (id: string) =>
      `/api/v1/workspaces/${id}/transfer-ownership` as const,
    permanentDelete: (id: string) =>
      `/api/v1/workspaces/${id}/permanent` as const,

    // Brand Voice
    brandVoice: (id: string) => `/api/v1/workspaces/${id}/brand-voice` as const,
    refreshBrandVoice: (id: string) =>
      `/api/v1/workspaces/${id}/brand-voice/refresh` as const,
    // The website's pipeline again, after a run that failed or was interrupted (G20)
    retryPipeline: (id: string) =>
      `/api/v1/workspaces/${id}/pipeline/retry` as const,

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
    uploadAvatar: (workspaceId: string, personaId: string) =>
      `/api/v1/workspaces/${workspaceId}/personas/${personaId}/avatar` as const,
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
    // DELETE cancels a scheduled publish, PATCH moves it to another day.
    schedule: (id: string) => `/api/v1/content/${id}/schedule` as const,
    calendar: "/api/v1/content/calendar",
    uploadBlogImage: (workspaceId: string) =>
      `/api/v1/workspaces/${workspaceId}/media/blog-images/upload` as const,
  },

  /**
   * Integration Endpoints
   * @note Legacy (Query): workspace scoped by `?workspace_id=`
   * WordPress sites; Shopify is not offered yet.
   */
  INTEGRATIONS: {
    WORDPRESS: {
      base: "/api/v1/integrations/wordpress/",
      byId: (id: string) => `/api/v1/integrations/wordpress/${id}` as const,
      activate: (id: string) =>
        `/api/v1/integrations/wordpress/${id}/activate` as const,
      deactivate: (id: string) =>
        `/api/v1/integrations/wordpress/${id}/deactivate` as const,
      test: (id: string) =>
        `/api/v1/integrations/wordpress/${id}/test` as const,
    },
  },

  /**
   * User Endpoints
   * @note Uses singular `user` namespace
   */
  USERS: {
    list: "/api/v1/user/users", // Inconsistent: /user/users
    stats: "/api/v1/user/users/stats",
    byId: (id: string) => `/api/v1/user/${id}` as const,
    register: "/api/v1/user/register",
    registerWithInvitation: "/api/v1/user/register-with-invitation",
    logout: "/api/v1/user/logout",

    // Sessions
    sessions: {
      list: "/api/v1/user/sessions",
      detail: (id: string) => `/api/v1/user/sessions/${id}` as const,
      revokeAll: "/api/v1/user/sessions",
    },

    // Admin status actions (require user.update)
    suspend: (id: string) => `/api/v1/user/${id}/suspend` as const,
    activate: (id: string) => `/api/v1/user/${id}/activate` as const,
    ban: (id: string) => `/api/v1/user/${id}/ban` as const,

    // Admin user operations
    delete: (id: string) => `/api/v1/user/delete/${id}` as const,
    update: (id: string) => `/api/v1/user/update/${id}` as const,

    // Soft Deleted Users tab
    deleted: "/api/v1/user/deleted",
    restore: (id: string) => `/api/v1/user/restore/${id}` as const,
    // Permanent deletion — Super Admin only
    permanentDelete: (id: string) => `/api/v1/user/permanent/${id}` as const,

    // Admin role assignment (require user.manage_roles)
    roles: {
      list: (userId: string) => `/api/v1/user/${userId}/roles` as const,
      assign: (userId: string) => `/api/v1/user/${userId}/roles` as const,
      revoke: (userId: string, roleId: string) =>
        `/api/v1/user/${userId}/roles/${roleId}` as const,
      // Workspaces this user belongs to, usable as an assignment scope.
      workspaces: (userId: string) =>
        `/api/v1/user/${userId}/workspaces` as const,
    },
  },

  /**
   * Onboarding Endpoints
   * @note The questions asked once at first login (rext-backend src/api/routes/users/onboarding.py)
   */
  ONBOARDING: {
    shouldShow: "/api/v1/onboarding/should-show",
    marketing: "/api/v1/onboarding/marketing",
    complete: "/api/v1/onboarding/complete",
  },

  /**
   * Admin Account Recovery Endpoints
   * @note Admin-reviewed account recovery queue (Account Recovery tab)
   */
  ACCOUNT_RECOVERY: {
    requests: "/api/v1/admin/account-recovery/requests",
    approve: (id: string) =>
      `/api/v1/admin/account-recovery/requests/${id}/approve` as const,
    reject: (id: string) =>
      `/api/v1/admin/account-recovery/requests/${id}/reject` as const,
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
    recoveryRequest: "/api/v1/user/account-recovery/request",
    recoveryVerify: "/api/v1/user/account-recovery/verify",
  },

  /**
   * Settings Endpoints
   * @note User settings and preferences (notifications, sessions, security, preferences)
   */
  SETTINGS: {
    notifications: {
      getPreferences: "/api/v1/user/preferences/notifications",
      updatePreferences: "/api/v1/user/preferences/notifications",
      /** Needs no sign-in: the token in an email's unsubscribe link is the proof. */
      unsubscribe: "/api/v1/user/email-preferences/unsubscribe",
    },
    sessions: {
      list: "/api/v1/user/sessions",
      revoke: (sessionId: string) =>
        `/api/v1/user/sessions/${sessionId}` as const,
      revokeAll: "/api/v1/user/sessions",
    },
    security: {
      loginHistory: "/api/v1/user/security/login-history",
      activeSessionsCount: "/api/v1/user/security/active-sessions-count",
    },
  },

  /**
   * Subscription Endpoints
   * @note Uses plural `subscriptions` namespace
   */
  SUBSCRIPTIONS: {
    BASE: "/api/v1/subscriptions",
    /** The public plan catalogue (F1): plans, the trial, an article's cost, the offer. */
    catalog: "/api/v1/plans",
    current: "/api/v1/subscriptions/current",
    plans: "/api/v1/subscriptions/plans",
    checkout: "/api/v1/subscriptions/checkout",
    portal: "/api/v1/subscriptions/portal",
    upgrade: "/api/v1/subscriptions/upgrade",
    downgrade: "/api/v1/subscriptions/downgrade",
    cancel: "/api/v1/subscriptions/cancel",
    invoices: "/api/v1/subscriptions/invoices",
    orders: "/api/v1/subscriptions/orders",
    refundRequests: "/api/v1/subscriptions/refund-requests",
    billingUrls: "/api/v1/subscriptions/billing-urls",
    /** What to do about an unfinished subscription (F11): update the card or resume. */
    billingAction: "/api/v1/subscriptions/billing-action",
    pause: "/api/v1/subscriptions/pause",
    resume: "/api/v1/subscriptions/resume",
    history: "/api/v1/subscriptions/history",
    usage: "/api/v1/subscriptions/usage",
    credits: "/api/v1/subscriptions/credits",
    trialStatus: "/api/v1/subscriptions/trial-status",
  },

  /**
   * Dashboard Endpoints
   * @note Non-standard workspace scoping: uses `/api/v1/dashboard/{id}` instead of `/api/v1/workspaces/{id}/dashboard`
   * @note Workspace ID in path but not a nested resource under workspaces
   */
  DASHBOARD: {
    stats: (workspaceId: string) => `/api/v1/dashboard/${workspaceId}` as const,
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
      detail: (id: string) => `/api/v1/audit-logs/${id}` as const,
      exportDownload: "/api/v1/audit-logs/export/download",
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
   * Account-Creation IP Allowlist
   * @note Requires admin / super_admin role
   */
  ADMIN_ACCOUNT_ALLOWLIST: {
    base: "/api/v1/admin/account-creation-allowlist",
    list: "/api/v1/admin/account-creation-allowlist",
    create: "/api/v1/admin/account-creation-allowlist",
    detail: (id: string) =>
      `/api/v1/admin/account-creation-allowlist/${id}` as const,
  },

  /**
   * Admin Analytics Endpoints
   * @note Platform-level analytics for subscriptions and invitations
   * @note Requires super admin role
   */
  ADMIN_ANALYTICS: {
    subscriptions: {
      revenue: "/api/v1/admin/subscriptions/stats/revenue",
      churn: "/api/v1/admin/subscriptions/stats/churn",
      trialConversion: "/api/v1/admin/subscriptions/stats/trial-conversion",
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
    orders: "/api/v1/admin/subscriptions/refunds/orders",
    requests: "/api/v1/admin/subscriptions/refunds/requests",
    /** POST: log a refund a customer asked for by email. */
    createRequest: "/api/v1/admin/subscriptions/refunds/requests",
    /** POST: take back an approval, returning the request to pending. */
    unapproveRequest: (id: string) =>
      `/api/v1/admin/subscriptions/refunds/requests/${id}/unapprove` as const,
    approveRequest: (id: string) =>
      `/api/v1/admin/subscriptions/refunds/requests/${id}/approve` as const,
    rejectRequest: (id: string) =>
      `/api/v1/admin/subscriptions/refunds/requests/${id}/reject` as const,
    /** Issues the money for an already-approved request. */
    processRequest: (id: string) =>
      `/api/v1/admin/subscriptions/refunds/requests/${id}/process` as const,
  },

  /**
   * Admin Webhooks Endpoints
   * @note Platform-level webhook event monitoring
   * @note Requires super admin role
   */
  ADMIN_WEBHOOKS: {
    events: "/api/v1/admin/subscriptions/webhooks/events",
    failed: "/api/v1/admin/subscriptions/webhooks/failed",
    // `webhookId` is the database id (webhook_events.id, a UUID) - the same
    // `id` returned by the list endpoints, NOT the LemonSqueezy event_id.
    detail: (webhookId: string) =>
      `/api/v1/admin/subscriptions/webhooks/detail/${webhookId}` as const,
    retry: (webhookId: string) =>
      `/api/v1/admin/subscriptions/webhooks/${webhookId}/retry` as const,
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
      update: (roleId: string) =>
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
    update: (permissionId: string) =>
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
   * @note The caller's own library in a workspace (rext-backend G78). Reads go to LangGraph's store,
   * which answers only searches and gets; a removal goes through this app route.
   */
  KEYWORD_LIBRARY: {
    items: (workspaceId: string) =>
      `/api/v1/workspaces/${workspaceId}/keyword-library/items` as const,
  },
} as const;
