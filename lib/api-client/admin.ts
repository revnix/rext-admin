/**
 * Admin API Namespace
 *
 * Handles admin-only features: impersonation, audit logs, email templates
 */

import type { ApiClient } from "./core";

export interface EmailTemplate {
  id: string;
  workspace_id: string;
  template_type: string;
  subject: string;
  body: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// IMPERSONATION
// ============================================================================

export function createImpersonationNamespace(client: ApiClient) {
  return {
    /**
     * Start impersonating a user
     */
    start: async (userId: string) => {
      return client.request<{
        success: boolean;
        message: string;
        impersonated_user_id: string;
        access_token: string;
        refresh_token: string;
        impersonated_user_name?: string;
      }>("/api/v1/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
    },

    /**
     * Stop impersonation
     */
    stop: async () => {
      return client.request<{
        original_user_id: string;
        access_token: string;
        refresh_token: string;
        stopped_at: string;
      }>("/api/v1/user/impersonate/stop", {
        method: "POST",
      });
    },

    /**
     * Get impersonation status
     */
    getStatus: async () => {
      return client.request<{
        is_impersonating: boolean;
        impersonated_user_id?: string;
        impersonated_user_email?: string;
        impersonated_user_name?: string;
        started_at?: string;
      }>("/api/v1/admin/impersonate/status", {
        method: "GET",
      });
    },
  };
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export function createAuditLogsNamespace(client: ApiClient) {
  return {
    /**
     * Get my audit logs
     */
    getMyLogs: async (filters?: {
      action?: string;
      start_date?: string;
      end_date?: string;
      limit?: number;
      offset?: number;
    }) => {
      const params = new URLSearchParams();
      if (filters?.action) params.append("action", filters.action);
      if (filters?.start_date) params.append("start_date", filters.start_date);
      if (filters?.end_date) params.append("end_date", filters.end_date);
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.offset) params.append("offset", filters.offset.toString());

      const queryString = params.toString();
      const endpoint = `/api/v1/audit-logs/me${queryString ? `?${queryString}` : ""}`;

      return client.request<{
        logs: Array<{
          id: string;
          user_id: string;
          action: string;
          resource_type: string;
          resource_id: string;
          details: Record<string, unknown>;
          ip_address: string;
          user_agent: string;
          created_at: string;
          status?: string;
        }>;
        total: number;
        has_more: boolean;
      }>(endpoint, {
        method: "GET",
      });
    },

    /**
     * Get workspace audit logs (admin)
     */
    getWorkspaceLogs: async (
      workspaceId: string,
      filters?: {
        action?: string;
        user_id?: string;
        start_date?: string;
        end_date?: string;
        limit?: number;
        offset?: number;
      },
    ) => {
      const params = new URLSearchParams();
      if (filters?.action) params.append("action", filters.action);
      if (filters?.user_id) params.append("user_id", filters.user_id);
      if (filters?.start_date) params.append("start_date", filters.start_date);
      if (filters?.end_date) params.append("end_date", filters.end_date);
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.offset) params.append("offset", filters.offset.toString());

      const queryString = params.toString();
      const endpoint = `/api/v1/audit-logs/workspace/${workspaceId}${queryString ? `?${queryString}` : ""}`;

      return client.request<{
        logs: Array<{
          id: string;
          user_id: string;
          workspace_id: string;
          action: string;
          resource_type: string;
          resource_id: string;
          details: Record<string, unknown>;
          ip_address: string;
          user_agent: string;
          created_at: string;
          status?: string;
        }>;
        total: number;
        has_more: boolean;
      }>(endpoint, {
        method: "GET",
      });
    },
  };
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export function createEmailTemplatesNamespace(client: ApiClient) {
  return {
    /**
     * List email templates
     */
    list: async (workspaceId: string) => {
      return client.request<{
        templates: EmailTemplate[];
      }>(
        `/api/v1/email-templates?workspace_id=${encodeURIComponent(workspaceId)}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get template variables
     */
    getVariables: async (templateType: string) => {
      return client.request<{
        variables: Array<{
          name: string;
          description: string;
          example: string;
        }>;
      }>(`/api/v1/email-templates/variables/${templateType}`, {
        method: "GET",
      });
    },

    /**
     * Get default template
     */
    getDefault: async (templateType: string) => {
      return client.request<{
        subject: string;
        body: string;
      }>(`/api/v1/email-templates/default/${templateType}`, {
        method: "GET",
      });
    },

    /**
     * Preview template
     */
    preview: async (data: {
      template_type: string;
      subject: string;
      body: string;
      variables?: Record<string, string>;
    }) => {
      return client.request<{
        rendered_subject: string;
        rendered_body: string;
      }>("/api/v1/email-templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Create template
     */
    create: async (data: {
      workspace_id: string;
      template_type: string;
      subject: string;
      body: string;
    }) => {
      return client.request<EmailTemplate>("/api/v1/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Update template
     */
    update: async (
      templateId: string,
      data: {
        subject?: string;
        body?: string;
        is_active?: boolean;
      },
    ) => {
      return client.request<EmailTemplate>(
        `/api/v1/email-templates/${templateId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Delete template
     */
    delete: async (templateId: string) => {
      return client.request<void>(`/api/v1/email-templates/${templateId}`, {
        method: "DELETE",
      });
    },
  };
}
