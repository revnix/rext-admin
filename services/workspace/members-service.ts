/**
 * Members Service - Workspace Member Management
 *
 * Handles workspace member and invitation operations
 */

import { apiErrorHandler } from "@/lib/api-error-middleware";
import { authenticatedFetch } from "@/lib/auth-utils";
import { generateRequestId, sanitizeErrorForLogging } from "@/lib/error-utils";
import type {
  WorkspaceApiConfig,
  WorkspaceApiContext,
} from "@/types/workspace";
import {
  BaseWorkspaceService,
  WorkspaceApiError,
} from "./base-workspace-service";

export { WorkspaceApiError as MembersServiceError };

export class MembersService extends BaseWorkspaceService {
  constructor(config: Partial<WorkspaceApiConfig> = {}) {
    super("MembersService", config);
  }

  // ============================================================================
  // WORKSPACE MEMBERS OPERATIONS
  // ============================================================================

  async getWorkspaceMembers(workspaceId: string): Promise<{
    members: Array<{
      id: string;
      user_id: string;
      workspace_id: string;
      status: string;
      is_default: boolean;
      joined_at: string | null;
      last_activity_at: string | null;
      user: {
        id: string;
        email: string;
        display_name: string;
        is_verified: boolean;
      };
    }>;
    total_count: number;
  }> {
    this.validateUuid(workspaceId, "workspace_id");
    return this.makeRequest("GET", `/api/v1/workspaces/${workspaceId}/members`);
  }

  async addWorkspaceMember(
    workspaceId: string,
    email: string,
  ): Promise<{
    member: {
      id: string;
      user_id: string;
      email: string;
      display_name: string;
      status: string;
    };
  }> {
    this.validateUuid(workspaceId, "workspace_id");
    if (!email || !this.isValidEmail(email)) {
      throw new WorkspaceApiError("INVALID_REQUEST", "Valid email is required");
    }

    return this.makeRequest(
      "POST",
      `/api/v1/workspaces/${workspaceId}/members`,
      { email },
    );
  }

  async removeWorkspaceMember(
    workspaceId: string,
    memberId: string,
  ): Promise<{ member_id: string }> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateUuid(memberId, "member_id");

    return this.makeRequest(
      "DELETE",
      `/api/v1/workspaces/${workspaceId}/members/${memberId}`,
    );
  }

  async changeMemberRole(
    workspaceId: string,
    memberId: string,
    roleId: string,
  ): Promise<{
    member_id: string;
    user_id: string;
    workspace_id: string;
    role_id: string;
    role_name: string;
    updated_by: string;
    updated_at: string;
  }> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateUuid(memberId, "member_id");
    this.validateUuid(roleId, "role_id");

    return this.makeRequest(
      "PATCH",
      `/api/v1/workspaces/${workspaceId}/members/${memberId}/role`,
      { role_id: roleId },
    );
  }

  // ============================================================================
  // WORKSPACE INVITATIONS OPERATIONS
  // ============================================================================

  async createInvitation(data: {
    workspace_id: string;
    email: string;
    role_id: string;
    expires_in_days?: number;
  }): Promise<{
    invitation: {
      id: string;
      workspace_id: string;
      email: string;
      role_id: string;
      status: string;
      expires_at: string;
      created_at: string;
    };
  }> {
    this.validateUuid(data.workspace_id, "workspace_id");
    this.validateUuid(data.role_id, "role_id");
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new WorkspaceApiError("INVALID_REQUEST", "Valid email is required");
    }

    return this.makeRequest(
      "POST",
      `/api/v1/workspaces/${data.workspace_id}/invitations`,
      {
        email: data.email,
        role_id: data.role_id,
        expiry_days: data.expires_in_days,
      },
    );
  }

  async acceptInvitation(token: string): Promise<{
    workspace_member: {
      id: string;
      workspace_id: string;
      user_id: string;
      role_id: string;
      status: string;
    };
  }> {
    if (!token || token.trim().length === 0) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        "Invitation token is required",
      );
    }

    return this.makeRequest("POST", "/api/v1/workspace/invitations/accept", {
      token,
    });
  }

  async revokeInvitation(
    workspaceId: string,
    invitationId: string,
    reason?: string,
  ): Promise<{
    invitation_id: string;
    status: string;
  }> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateUuid(invitationId, "invitation_id");

    return this.makeRequest(
      "DELETE",
      `/api/v1/workspaces/${workspaceId}/invitations/${invitationId}`,
      reason ? { reason } : undefined,
    );
  }

  async listSentInvitations(workspaceId: string): Promise<{
    invitations: Array<{
      id: string;
      workspace_id: string;
      email: string;
      role_id: string;
      status: string;
      expires_at: string;
      created_at: string;
      workspace_name?: string;
      role_name?: string;
    }>;
    total_count: number;
  }> {
    this.validateUuid(workspaceId, "workspace_id");
    return this.makeRequest(
      "GET",
      `/api/v1/workspaces/${workspaceId}/invitations`,
    );
  }

  async listReceivedInvitations(): Promise<{
    invitations: Array<{
      id: string;
      workspace_id: string;
      email: string;
      role_id: string;
      status: string;
      expires_at: string;
      created_at: string;
      workspace_name?: string;
      role_name?: string;
      invitation_token?: string;
    }>;
    total_count: number;
  }> {
    return this.makeRequest("GET", "/api/v1/workspace/invitations/received");
  }

  async createBulkInvitations(data: {
    workspace_id: string;
    emails: string[];
    role_id: string;
    expires_in_days?: number;
  }): Promise<{
    total_requested: number;
    successful: number;
    failed: number;
    results: Array<{
      email: string;
      success: boolean;
      invitation_id?: string;
      error_message?: string;
    }>;
  }> {
    this.validateUuid(data.workspace_id, "workspace_id");
    this.validateUuid(data.role_id, "role_id");

    if (!data.emails || data.emails.length === 0) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        "At least one email is required",
      );
    }

    if (data.emails.length > 50) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        "Maximum 50 emails allowed per request",
      );
    }

    return this.makeRequest(
      "POST",
      `/api/v1/workspaces/${data.workspace_id}/invitations/bulk`,
      {
        emails: data.emails,
        role_id: data.role_id,
        expiry_days: data.expires_in_days,
      },
    );
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  protected async makeRequest<T>(
    method: string,
    endpoint: string,
    body?: unknown,
  ): Promise<T> {
    const requestId = generateRequestId();
    const context = this.createRequestContext(requestId);
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    try {
      return await this.executeRequest<T>(
        method,
        endpoint,
        body,
        controller.signal,
        context,
      );
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  protected async executeRequest<T>(
    method: string,
    endpoint: string,
    body: unknown,
    signal: AbortSignal,
    context: WorkspaceApiContext,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Request-ID": context.requestId,
        "X-Timestamp": context.timestamp,
      };

      const signals = [signal];
      if (this.config.timeout) {
        signals.push(AbortSignal.timeout(this.config.timeout));
      }
      const combinedSignal =
        signals.length > 1 ? AbortSignal.any(signals) : signal;

      const response = await authenticatedFetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: combinedSignal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, context, 0);
      }

      let data: unknown;
      if (
        response.status === 204 ||
        response.headers.get("content-length") === "0"
      ) {
        data = {};
      } else {
        data = await response.json();
      }

      const responseData = data as { success?: boolean; data?: T };
      if (responseData?.success && responseData.data) {
        return responseData.data;
      }

      return data as T;
    } catch (error) {
      await this.handleRequestError(error, context, 0);
      throw error;
    }
  }

  protected async handleErrorResponse(
    response: Response,
    context: WorkspaceApiContext,
    duration: number,
  ): Promise<never> {
    const errorData = await response.json().catch(() => ({}));

    this.log.error("Members request failed", {
      requestId: context.requestId,
      status: response.status,
      statusText: response.statusText,
      duration,
      errorData: sanitizeErrorForLogging(errorData),
    });

    throw WorkspaceApiError.fromResponse(errorData, response.status);
  }

  protected async handleRequestError(
    error: unknown,
    context: WorkspaceApiContext,
    duration: number,
  ): Promise<never> {
    await apiErrorHandler.handleError(error, {
      showToast: true,
      logError: true,
      throwError: true,
      context: {
        requestId: context.requestId,
        duration,
        timestamp: context.timestamp,
      },
    });

    throw error;
  }

  protected createRequestContext(requestId: string): WorkspaceApiContext {
    return {
      requestId,
      timestamp: new Date().toISOString(),
      userId: undefined,
    };
  }

  protected validateUuid(id: string, fieldName: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw new WorkspaceApiError(
        "INVALID_REQUEST",
        `Invalid ${fieldName}: must be a valid UUID`,
      );
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public cancelAllRequests(): void {
    for (const [_requestId, controller] of this.activeRequests) {
      controller.abort();
    }
    this.activeRequests.clear();
  }
}

export const membersService = new MembersService();
