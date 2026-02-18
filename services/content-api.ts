/**
 * Content API Service Client
 *
 * Comprehensive API client for content management following workspace-api.ts patterns
 */

import { authenticatedFetch } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { buildUrl } from "@/lib/url-utils";
import type {
  ContentListResponse,
  ContentResponse,
  CreateContentRequest,
  UpdateContentRequest,
} from "@/types/content";

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class ContentApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "ContentApiError";
  }
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class ContentApiService {
  private readonly baseUrl: string;
  private readonly log = logger.forComponent("ContentApiService");

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:2024";
  }

  /**
   * List content for workspace
   */
  async listContent(
    workspaceId: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<ContentListResponse> {
    const url = buildUrl(`${this.baseUrl}/api/v1/content/${workspaceId}`, {
      status: options?.status,
      limit: options?.limit,
      offset: options?.offset,
    });

    this.log.info("Fetching content list", { workspaceId, options });

    try {
      const response = await authenticatedFetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        this.log.error("Failed to fetch content", {
          status: response.status,
          workspaceId,
        });
        throw new ContentApiError(
          "FETCH_FAILED",
          "Failed to fetch content",
          response.status,
        );
      }

      const result = await response.json();
      this.log.info("Content list fetched successfully", {
        count: result.data?.content?.length || 0,
        workspaceId,
      });

      return result.data;
    } catch (error) {
      if (error instanceof ContentApiError) {
        throw error;
      }
      this.log.error("Unexpected error fetching content", { error });
      throw new ContentApiError(
        "FETCH_FAILED",
        error instanceof Error ? error.message : "Failed to fetch content",
      );
    }
  }

  /**
   * Get single content item
   */
  async getContent(
    workspaceId: string,
    contentId: string,
  ): Promise<ContentResponse> {
    const url = `${this.baseUrl}/api/v1/content/${workspaceId}/${contentId}`;

    this.log.info("Fetching content detail", { workspaceId, contentId });

    try {
      const response = await authenticatedFetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 404) {
          this.log.warn("Content not found", { workspaceId, contentId });
          throw new ContentApiError("NOT_FOUND", "Content not found", 404);
        }
        this.log.error("Failed to fetch content", {
          status: response.status,
          workspaceId,
          contentId,
        });
        throw new ContentApiError(
          "FETCH_FAILED",
          "Failed to fetch content",
          response.status,
        );
      }

      const result = await response.json();
      this.log.info("Content fetched successfully", {
        workspaceId,
        contentId,
      });

      return result.data.content;
    } catch (error) {
      if (error instanceof ContentApiError) {
        throw error;
      }
      this.log.error("Unexpected error fetching content", { error });
      throw new ContentApiError(
        "FETCH_FAILED",
        error instanceof Error ? error.message : "Failed to fetch content",
      );
    }
  }

  /**
   * Create new content
   */
  async createContent(
    workspaceId: string,
    data: CreateContentRequest,
  ): Promise<ContentResponse> {
    const url = `${this.baseUrl}/api/v1/content/${workspaceId}`;

    this.log.info("Creating content", { workspaceId, title: data.title });

    try {
      const response = await authenticatedFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          workspace_id: workspaceId,
        }),
      });

      if (!response.ok) {
        this.log.error("Failed to create content", {
          status: response.status,
          workspaceId,
        });
        throw new ContentApiError(
          "CREATE_FAILED",
          "Failed to create content",
          response.status,
        );
      }

      const result = await response.json();
      this.log.info("Content created successfully", {
        workspaceId,
        contentId: result.data?.content?.id,
      });

      return result.data.content;
    } catch (error) {
      if (error instanceof ContentApiError) {
        throw error;
      }
      this.log.error("Unexpected error creating content", { error });
      throw new ContentApiError(
        "CREATE_FAILED",
        error instanceof Error ? error.message : "Failed to create content",
      );
    }
  }

  /**
   * Update content
   */
  async updateContent(
    workspaceId: string,
    contentId: string,
    data: UpdateContentRequest,
  ): Promise<ContentResponse> {
    const url = `${this.baseUrl}/api/v1/content/${workspaceId}/${contentId}`;

    this.log.info("Updating content", { workspaceId, contentId });

    try {
      const response = await authenticatedFetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        this.log.error("Failed to update content", {
          status: response.status,
          workspaceId,
          contentId,
        });
        throw new ContentApiError(
          "UPDATE_FAILED",
          "Failed to update content",
          response.status,
        );
      }

      const result = await response.json();
      this.log.info("Content updated successfully", {
        workspaceId,
        contentId,
      });

      return result.data.content;
    } catch (error) {
      if (error instanceof ContentApiError) {
        throw error;
      }
      this.log.error("Unexpected error updating content", { error });
      throw new ContentApiError(
        "UPDATE_FAILED",
        error instanceof Error ? error.message : "Failed to update content",
      );
    }
  }

  /**
   * Delete content
   */
  async deleteContent(workspaceId: string, contentId: string): Promise<void> {
    const url = `${this.baseUrl}/api/v1/content/${workspaceId}/${contentId}`;

    this.log.info("Deleting content", { workspaceId, contentId });

    try {
      const response = await authenticatedFetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        this.log.error("Failed to delete content", {
          status: response.status,
          workspaceId,
          contentId,
        });
        throw new ContentApiError(
          "DELETE_FAILED",
          "Failed to delete content",
          response.status,
        );
      }

      this.log.info("Content deleted successfully", {
        workspaceId,
        contentId,
      });
    } catch (error) {
      if (error instanceof ContentApiError) {
        throw error;
      }
      this.log.error("Unexpected error deleting content", { error });
      throw new ContentApiError(
        "DELETE_FAILED",
        error instanceof Error ? error.message : "Failed to delete content",
      );
    }
  }
}

// Default instance
export const contentApiService = new ContentApiService();
