/**
 * @deprecated Use `apiClient.workspaces` from `@/lib/api-client` instead.
 * This service uses legacy `/api/v1/workspace/*` endpoints that may be removed.
 * The API Client uses the canonical RESTful `/api/v1/workspaces/*` endpoints.
 *
 * Migration: Replace `workspaceService.listWorkspaces()` with `apiClient.workspaces.list()`, etc.
 */

/**
 * Workspace Service - Core CRUD Operations
 *
 * Handles core workspace management operations including:
 * - Create, read, update, delete workspaces
 * - Workspace duplication
 * - Brand voice refresh
 */

import { apiClient } from "@/lib/api-client";
import type {
  WorkspaceListResponse,
  BrandVoiceRefreshResponse,
  WorkspaceStatsResponse as WorkspaceStats,
} from "@/types/generated/types.gen";
import type { Workspace } from "@/types/workspace";
import {
  BaseWorkspaceService,
  WorkspaceApiError as WorkspaceServiceError,
} from "./base-workspace-service";
import { VALIDATION_MESSAGES } from "./validation-messages";

export { WorkspaceServiceError };

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================
export class WorkspaceService extends BaseWorkspaceService {
  constructor() {
    super("WorkspaceService");
  }

  // ============================================================================
  // CORE WORKSPACE OPERATIONS
  // ============================================================================

  /**
   * Health check for workspace API
   */
  async healthCheck(): Promise<{ status: string }> {
    return apiClient.request<{ status: string }>("/api/v1/workspace/", {
      method: "GET",
    });
  }

  /**
   * List all workspaces with metadata
   */
  async listWorkspaces(): Promise<WorkspaceListResponse> {
    return apiClient.workspaces.list();
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(workspaceId: string): Promise<Workspace> {
    this.validateUuid(workspaceId, "workspace_id");
    return apiClient.workspaces.get(workspaceId);
  }

  /**
   * Get workspace by slug
   */
  async getWorkspaceBySlug(workspaceSlug: string): Promise<Workspace> {
    if (!/^[a-z0-9-]+$/.test(workspaceSlug)) {
      throw new WorkspaceServiceError(
        "INVALID_REQUEST",
        VALIDATION_MESSAGES.INVALID_SLUG_FORMAT,
        { slug: workspaceSlug },
      );
    }

    return apiClient.workspaces.getBySlug(workspaceSlug);
  }

  /**
   * Create new workspace
   */
  async createWorkspace(data: {
    name: string;
    timezone?: string;
    url: string;
  }): Promise<Workspace> {
    this.validateWorkspaceData(data);
    return apiClient.workspaces.create(data);
  }

  /**
   * Update workspace details
   */
  async updateWorkspace(
    workspaceId: string,
    data: { title?: string; name?: string; timezone?: string; url?: string },
  ): Promise<Workspace> {
    this.validateUuid(workspaceId, "workspace_id");
    this.validateWorkspaceUpdateData(data);
    return apiClient.workspaces.update(workspaceId, data);
  }

  /**
   * Delete workspace with vector store cleanup
   */
  async deleteWorkspace(workspaceId: string): Promise<Workspace> {
    this.validateUuid(workspaceId, "workspace_id");
    return apiClient.workspaces.delete(workspaceId);
  }

  /**
   * Duplicate workspace
   */
  async duplicateWorkspace(sourceWorkspaceId: string): Promise<Workspace> {
    this.validateUuid(sourceWorkspaceId, "workspace_id");

    const sourceWorkspace = await this.getWorkspace(sourceWorkspaceId);
    const duplicateName = this.generateDuplicateName(sourceWorkspace.name);

    const duplicateData = {
      name: duplicateName,
      timezone: sourceWorkspace.timezone ?? undefined,
      url: sourceWorkspace.url ?? "",
    };

    return this.createWorkspace(duplicateData);
  }

  /**
   * Refresh brand voice analysis for workspace
   */
  async refreshBrandVoice(
    workspaceId: string,
  ): Promise<BrandVoiceRefreshResponse> {
    this.validateUuid(workspaceId, "workspace_id");
    return apiClient.workspaces.refreshBrandVoice(workspaceId);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  protected generateDuplicateName(originalName: string): string {
    const copyPattern = / \(Copy( \d+)?\)$/;
    const match = originalName.match(copyPattern);

    if (match) {
      const copyNumber = match[1] ? parseInt(match[1].trim(), 10) + 1 : 2;
      return originalName.replace(copyPattern, ` (Copy ${copyNumber})`);
    } else {
      return `${originalName} (Copy)`;
    }
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  protected validateWorkspaceData(data: { name: string; url: string }): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new WorkspaceServiceError(
        "INVALID_REQUEST",
        VALIDATION_MESSAGES.TITLE_REQUIRED,
      );
    }

    if (data.name.length > 200) {
      throw new WorkspaceServiceError(
        "INVALID_REQUEST",
        VALIDATION_MESSAGES.TITLE_MAX_LENGTH(200),
      );
    }

    if (!data.url || !this.isValidUrl(data.url)) {
      throw new WorkspaceServiceError(
        "INVALID_URL",
        VALIDATION_MESSAGES.URL_REQUIRED,
      );
    }
  }

  protected validateWorkspaceUpdateData(data: {
    name?: string;
    url?: string;
  }): void {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new WorkspaceServiceError(
          "INVALID_REQUEST",
          VALIDATION_MESSAGES.TITLE_REQUIRED,
        );
      }
      if (data.name.length > 200) {
        throw new WorkspaceServiceError(
          "INVALID_REQUEST",
          VALIDATION_MESSAGES.TITLE_MAX_LENGTH(200),
        );
      }
    }

    if (data.url !== undefined && !this.isValidUrl(data.url)) {
      throw new WorkspaceServiceError(
        "INVALID_URL",
        VALIDATION_MESSAGES.URL_REQUIRED,
      );
    }
  }

  /**
   * Cancel all active requests
   */
  public cancelAllRequests(): void {
    apiClient.cancelAllRequests();
  }

  /**
   * Get the count of active requests
   */
  public getActiveRequestsCount(): number {
    return apiClient.getActiveRequestsCount();
  }
}

// Default instance
export const workspaceService = new WorkspaceService();
