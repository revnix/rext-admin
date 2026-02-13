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
        BASE: "/api/v1/workspaces",
        byId: (id: string) => `/api/v1/workspaces/${id}` as const,
        bySlug: (slug: string) => `/api/v1/workspaces/slug/${slug}` as const,

        // Brand Voice
        brandVoice: (id: string) => `/api/v1/workspaces/${id}/brand-voice` as const,
        refreshBrandVoice: (id: string) => `/api/v1/workspaces/${id}/brand-voice/refresh` as const,

        // Permissions
        permissions: {
            me: (id: string) => `/api/v1/workspaces/${id}/permissions/me` as const,
            check: (id: string) => `/api/v1/workspaces/${id}/permissions/check` as const,
            refresh: (id: string) => `/api/v1/workspaces/${id}/permissions/refresh` as const,
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
        list: (workspaceId: string) => `/api/v1/workspaces/${workspaceId}/members` as const,
        add: (workspaceId: string) => `/api/v1/workspaces/${workspaceId}/members` as const,
        remove: (workspaceId: string, memberId: string) =>
            `/api/v1/workspaces/${workspaceId}/members/${memberId}` as const,
        changeRole: (workspaceId: string, memberId: string) =>
            `/api/v1/workspaces/${workspaceId}/members/${memberId}/role` as const,
    },

    /**
     * Invitations Endpoints
     * @note Mixed scoping: workspace-scoped and user-scoped endpoints
     * @note Uses inconsistent naming: /workspace/invitations (singular) vs /workspaces/{id}/invitations
     */
    INVITATIONS: {
        // Workspace-scoped invitations
        validate: (token: string) => `/api/v1/invitations/${token}/validate` as const,
        accept: (token: string) => `/api/v1/invitations/${token}/accept` as const,
        create: (workspaceId: string) => `/api/v1/workspaces/${workspaceId}/invitations` as const,
        createBulk: (workspaceId: string) => `/api/v1/workspaces/${workspaceId}/invitations/bulk` as const,
        listSent: (workspaceId: string) => `/api/v1/workspaces/${workspaceId}/invitations` as const,
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
        base: "/api/v1/content",
        detail: (id: string) => `/api/v1/content/${id}` as const,
        save: "/api/v1/content/save",
        publish: "/api/v1/content/publish",
        retry: (id: string) => `/api/v1/content/${id}/retry` as const,
    },

    /**
     * User Endpoints
     * @note Uses singular `user` namespace
     */
    USERS: {
        list: "/api/v1/user/users", // Inconsistent: /user/users
        byId: (id: string) => `/api/v1/user/${id}` as const,

        // Sessions
        SESSIONS: {
            list: "/api/v1/user/sessions",
            byId: (id: string) => `/api/v1/user/sessions/${id}` as const,
            revokeAll: "/api/v1/user/sessions/revoke-all",
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
            myLogs: "/api/v1/audit/user/my-logs",
            allLogs: "/api/v1/audit",
            detail: (id: string) => `/api/v1/audit/${id}` as const,
        },

        // Email Templates (uses singular "workspace" - backend inconsistency)
        emailTemplates: {
            list: (workspaceId: string) => `/api/v1/workspace/email-templates/${workspaceId}` as const,
            variables: (templateType: string) => `/api/v1/workspace/email-templates/variables/${templateType}` as const,
            defaults: (templateType: string) => `/api/v1/workspace/email-templates/defaults/${templateType}` as const,
            preview: "/api/v1/workspace/email-templates/preview",
            create: "/api/v1/workspace/email-templates/",
            update: (templateId: string) => `/api/v1/workspace/email-templates/${templateId}` as const,
            delete: (templateId: string) => `/api/v1/workspace/email-templates/${templateId}` as const,
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
        validate: (token: string) => `/api/v1/admin-invitations/${token}/validate` as const,
        accept: (token: string) => `/api/v1/admin-invitations/${token}/accept` as const,
        decline: (token: string) => `/api/v1/admin-invitations/${token}/decline` as const,
    },

    /**
     * License Endpoints
     */
    LICENSES: {
        BASE: "/api/v1/licenses",
        validate: "/api/v1/licenses/validate",
        activate: "/api/v1/licenses/activate",
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
} as const;
