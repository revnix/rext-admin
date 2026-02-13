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
     */
    ADMIN: {
        BASE: "/api/v1/admin",
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
