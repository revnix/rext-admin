/**
 * Admin API Namespace
 *
 * Handles admin-only features: impersonation, audit logs, email templates
 */

import { buildUrl } from "../url-utils";
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
      }>("/api/v1/user/impersonate/start", {
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
      }>("/api/v1/user/impersonate/status", {
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

      const endpoint = buildUrl("/api/v1/audit/user/my-logs", {
        action: filters?.action,
        start_date: filters?.start_date,
        end_date: filters?.end_date,
        limit: filters?.limit,
        offset: filters?.offset,
      });

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
     * Get all audit logs (admin)
     */
    getAllLogs: async (filters?: {
      user_id?: string;
      username?: string;
      user_email?: string;
      action?: string;
      resource_type?: string;
      resource_id?: string;
      workspace_id?: string;
      status_filter?: string;
      date_from?: string;
      date_to?: string;
      limit?: number;
      offset?: number;
    }) => {

      const endpoint = buildUrl("/api/v1/audit", {
        user_id: filters?.user_id,
        username: filters?.username,
        user_email: filters?.user_email,
        action: filters?.action,
        resource_type: filters?.resource_type,
        resource_id: filters?.resource_id,
        workspace_id: filters?.workspace_id,
        status_filter: filters?.status_filter,
        date_from: filters?.date_from,
        date_to: filters?.date_to,
        limit: filters?.limit,
        offset: filters?.offset,
      });

      return client.request<{
        logs: Array<{
          id: string;
          user_id: string;
          workspace_id?: string;
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
     * Get single audit log by ID (admin)
     */
    getLog: async (logId: string) => {
      return client.request<{
        id: string;
        user_id: string;
        workspace_id?: string;
        action: string;
        resource_type: string;
        resource_id: string;
        details: Record<string, unknown>;
        old_values?: Record<string, unknown>;
        new_values?: Record<string, unknown>;
        ip_address: string;
        user_agent: string;
        created_at: string;
        status?: string;
      }>(`/api/v1/audit/${logId}`, {
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
      }>(`/api/v1/workspace/email-templates/${workspaceId}`, {
        method: "GET",
      });
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
      }>(`/api/v1/workspace/email-templates/variables/${templateType}`, {
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
      }>(`/api/v1/workspace/email-templates/defaults/${templateType}`, {
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
      }>("/api/v1/workspace/email-templates/preview", {
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
      return client.request<EmailTemplate>(
        "/api/v1/workspace/email-templates/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
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
        `/api/v1/workspace/email-templates/${templateId}`,
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
      return client.request<void>(
        `/api/v1/workspace/email-templates/${templateId}`,
        {
          method: "DELETE",
        },
      );
    },
  };
}
