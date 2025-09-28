/**
 * Knowledge API Service Clients
 *
 * Dedicated service clients for web, file, and text knowledge management.
 * These provide specialized interfaces for each knowledge type while
 * leveraging the core workspace API service.
 */

import { logger } from "@/lib/logger";
import type {
  AddFileKnowledgeRequest,
  AddTextKnowledgeRequest,
  AddWebKnowledgeRequest,
  FileKnowledge,
  TextKnowledge,
  UpdateTextKnowledgeRequest,
  WebKnowledge,
} from "@/types/workspace";
import { workspaceApiService } from "./workspace-api";

// ============================================================================
// WEB KNOWLEDGE SERVICE CLIENT
// ============================================================================

export class WebKnowledgeService {
  private readonly log = logger.forComponent("WebKnowledgeService");

  /**
   * List all web knowledge entries
   */
  async list(): Promise<WebKnowledge[]> {
    try {
      const response = await workspaceApiService.listWebKnowledge();
      return response.web_knowledge;
    } catch (error) {
      this.log.error("Failed to list web knowledge", { error });
      throw error;
    }
  }

  /**
   * Get specific web knowledge by ID
   */
  async getById(webId: string): Promise<WebKnowledge> {
    try {
      const response = await workspaceApiService.getWebKnowledge(webId);
      return response.web_knowledge;
    } catch (error) {
      this.log.error("Failed to get web knowledge", { webId, error });
      throw error;
    }
  }

  /**
   * Add new web knowledge with URL scraping
   */
  async add(data: AddWebKnowledgeRequest): Promise<WebKnowledge> {
    try {
      this.log.info("Adding web knowledge", {
        url: data.url,
        workspaceId: data.workspace_id,
      });
      const response = await workspaceApiService.addWebKnowledge(data);
      this.log.info("Web knowledge added successfully", {
        id: response.web_knowledge.id,
      });
      return response.web_knowledge;
    } catch (error) {
      this.log.error("Failed to add web knowledge", { data, error });
      throw error;
    }
  }

  /**
   * Delete web knowledge
   */
  async delete(workspaceId: string, webId: string): Promise<boolean> {
    try {
      this.log.info("Deleting web knowledge", { workspaceId, webId });
      const response = await workspaceApiService.deleteWebKnowledge(
        workspaceId,
        webId,
      );
      this.log.info("Web knowledge deleted successfully", { webId });
      return response.success;
    } catch (error) {
      this.log.error("Failed to delete web knowledge", {
        workspaceId,
        webId,
        error,
      });
      throw error;
    }
  }

  /**
   * Bulk add multiple URLs
   */
  async bulkAdd(workspaceId: string, urls: string[]): Promise<WebKnowledge[]> {
    try {
      this.log.info("Bulk adding web knowledge", {
        workspaceId,
        count: urls.length,
      });

      const results = await Promise.allSettled(
        urls.map((url) => this.add({ workspace_id: workspaceId, url })),
      );

      const successful = results
        .filter(
          (result): result is PromiseFulfilledResult<WebKnowledge> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value);

      const failed = results
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected",
        )
        .map((result) => result.reason);

      if (failed.length > 0) {
        this.log.warn("Some URLs failed to add", {
          successful: successful.length,
          failed: failed.length,
        });
      }

      return successful;
    } catch (error) {
      this.log.error("Failed to bulk add web knowledge", {
        workspaceId,
        urls,
        error,
      });
      throw error;
    }
  }
}

// ============================================================================
// FILE KNOWLEDGE SERVICE CLIENT
// ============================================================================

export class FileKnowledgeService {
  private readonly log = logger.forComponent("FileKnowledgeService");

  /**
   * List all file knowledge entries
   */
  async list(): Promise<FileKnowledge[]> {
    try {
      const response = await workspaceApiService.listFileKnowledge();
      return response.file_knowledge;
    } catch (error) {
      this.log.error("Failed to list file knowledge", { error });
      throw error;
    }
  }

  /**
   * Get specific file knowledge by ID
   */
  async getById(fileId: string): Promise<FileKnowledge> {
    try {
      const response = await workspaceApiService.getFileKnowledge(fileId);
      return response.file_knowledge;
    } catch (error) {
      this.log.error("Failed to get file knowledge", { fileId, error });
      throw error;
    }
  }

  /**
   * Upload file with text extraction
   */
  async upload(data: AddFileKnowledgeRequest): Promise<FileKnowledge> {
    try {
      this.log.info("Uploading file knowledge", {
        fileName: data.file.name,
        fileSize: data.file.size,
        workspaceId: data.workspace_id,
      });

      const response = await workspaceApiService.addFileKnowledge(data);

      this.log.info("File knowledge uploaded successfully", {
        id: response.file_knowledge.id,
        fileName: response.file_knowledge.name,
      });

      return response.file_knowledge;
    } catch (error) {
      this.log.error("Failed to upload file knowledge", {
        fileName: data.file.name,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete file knowledge
   */
  async delete(workspaceId: string, fileId: string): Promise<boolean> {
    try {
      this.log.info("Deleting file knowledge", { workspaceId, fileId });
      const response = await workspaceApiService.deleteFileKnowledge(
        workspaceId,
        fileId,
      );
      this.log.info("File knowledge deleted successfully", { fileId });
      return response.success;
    } catch (error) {
      this.log.error("Failed to delete file knowledge", {
        workspaceId,
        fileId,
        error,
      });
      throw error;
    }
  }

  /**
   * Bulk upload multiple files
   */
  async bulkUpload(
    workspaceId: string,
    files: File[],
  ): Promise<FileKnowledge[]> {
    try {
      this.log.info("Bulk uploading file knowledge", {
        workspaceId,
        count: files.length,
      });

      const results = await Promise.allSettled(
        files.map((file) => this.upload({ workspace_id: workspaceId, file })),
      );

      const successful = results
        .filter(
          (result): result is PromiseFulfilledResult<FileKnowledge> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value);

      const failed = results
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected",
        )
        .map((result) => result.reason);

      if (failed.length > 0) {
        this.log.warn("Some files failed to upload", {
          successful: successful.length,
          failed: failed.length,
        });
      }

      return successful;
    } catch (error) {
      this.log.error("Failed to bulk upload file knowledge", {
        workspaceId,
        error,
      });
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/markdown",
    ];

    if (file.size > maxSize) {
      return { valid: false, error: "File size must be 10MB or less" };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: "File type not supported" };
    }

    return { valid: true };
  }
}

// ============================================================================
// TEXT KNOWLEDGE SERVICE CLIENT
// ============================================================================

export class TextKnowledgeService {
  private readonly log = logger.forComponent("TextKnowledgeService");

  /**
   * List all text knowledge entries
   */
  async list(): Promise<TextKnowledge[]> {
    try {
      const response = await workspaceApiService.listTextKnowledge();
      return response.text_knowledge;
    } catch (error) {
      this.log.error("Failed to list text knowledge", { error });
      throw error;
    }
  }

  /**
   * Get specific text knowledge by ID
   */
  async getById(workspaceId: string, textId: string): Promise<TextKnowledge> {
    try {
      const response = await workspaceApiService.getTextKnowledge(
        workspaceId,
        textId,
      );
      return response.text_knowledge;
    } catch (error) {
      this.log.error("Failed to get text knowledge", {
        workspaceId,
        textId,
        error,
      });
      throw error;
    }
  }

  /**
   * Add new text knowledge
   */
  async add(data: AddTextKnowledgeRequest): Promise<TextKnowledge> {
    try {
      this.log.info("Adding text knowledge", {
        title: data.title,
        workspaceId: data.workspace_id,
        contentLength: data.content.length,
      });

      const response = await workspaceApiService.addTextKnowledge(data);

      this.log.info("Text knowledge added successfully", {
        id: response.text_knowledge.id,
        title: response.text_knowledge.title,
      });

      return response.text_knowledge;
    } catch (error) {
      this.log.error("Failed to add text knowledge", { data, error });
      throw error;
    }
  }

  /**
   * Update text knowledge
   */
  async update(
    workspaceId: string,
    textId: string,
    data: UpdateTextKnowledgeRequest,
  ): Promise<TextKnowledge> {
    try {
      this.log.info("Updating text knowledge", {
        workspaceId,
        textId,
        updates: Object.keys(data),
      });

      const response = await workspaceApiService.updateTextKnowledge(
        workspaceId,
        textId,
        data,
      );

      this.log.info("Text knowledge updated successfully", {
        id: response.text_knowledge.id,
        title: response.text_knowledge.title,
      });

      return response.text_knowledge;
    } catch (error) {
      this.log.error("Failed to update text knowledge", {
        workspaceId,
        textId,
        data,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete text knowledge
   */
  async delete(workspaceId: string, textId: string): Promise<boolean> {
    try {
      this.log.info("Deleting text knowledge", { workspaceId, textId });
      const response = await workspaceApiService.deleteTextKnowledge(
        workspaceId,
        textId,
      );
      this.log.info("Text knowledge deleted successfully", { textId });
      return response.success;
    } catch (error) {
      this.log.error("Failed to delete text knowledge", {
        workspaceId,
        textId,
        error,
      });
      throw error;
    }
  }

  /**
   * Search text knowledge by content
   */
  async search(query: string, workspaceId?: string): Promise<TextKnowledge[]> {
    try {
      this.log.info("Searching text knowledge", { query, workspaceId });

      // Get all text knowledge and filter client-side for now
      // In production, this should be handled by the backend
      const allText = await this.list();

      const filtered = allText.filter((text) => {
        const matchesQuery =
          text.title.toLowerCase().includes(query.toLowerCase()) ||
          text.content.toLowerCase().includes(query.toLowerCase()) ||
          text.tags?.some((tag) =>
            tag.toLowerCase().includes(query.toLowerCase()),
          );

        const matchesWorkspace =
          !workspaceId || text.workspace_id === workspaceId;

        return matchesQuery && matchesWorkspace;
      });

      this.log.info("Text knowledge search completed", {
        query,
        totalResults: filtered.length,
      });

      return filtered;
    } catch (error) {
      this.log.error("Failed to search text knowledge", {
        query,
        workspaceId,
        error,
      });
      throw error;
    }
  }
}

// ============================================================================
// UNIFIED KNOWLEDGE SERVICE
// ============================================================================

export class KnowledgeService {
  private readonly log = logger.forComponent("KnowledgeService");

  public readonly web = new WebKnowledgeService();
  public readonly file = new FileKnowledgeService();
  public readonly text = new TextKnowledgeService();

  /**
   * Get all knowledge items for a workspace
   */
  async getAllForWorkspace(workspaceId: string) {
    try {
      this.log.info("Getting all knowledge for workspace", { workspaceId });

      const [webItems, fileItems, textItems] = await Promise.all([
        this.web.list(),
        this.file.list(),
        this.text.list(),
      ]);

      // Filter by workspace and combine
      const filteredWeb = webItems.filter(
        (item) => item.workspace_id === workspaceId,
      );
      const filteredFiles = fileItems.filter(
        (item) => item.workspace_id === workspaceId,
      );
      const filteredText = textItems.filter(
        (item) => item.workspace_id === workspaceId,
      );

      return {
        web: filteredWeb,
        files: filteredFiles,
        text: filteredText,
        total: filteredWeb.length + filteredFiles.length + filteredText.length,
      };
    } catch (error) {
      this.log.error("Failed to get all knowledge for workspace", {
        workspaceId,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete all knowledge for a workspace (cleanup utility)
   */
  async deleteAllForWorkspace(workspaceId: string): Promise<void> {
    try {
      this.log.info("Deleting all knowledge for workspace", { workspaceId });

      const knowledge = await this.getAllForWorkspace(workspaceId);

      // Delete all knowledge items
      await Promise.allSettled([
        ...knowledge.web.map((item) => this.web.delete(workspaceId, item.id)),
        ...knowledge.files.map((item) =>
          this.file.delete(workspaceId, item.id),
        ),
        ...knowledge.text.map((item) => this.text.delete(workspaceId, item.id)),
      ]);

      this.log.info("All knowledge deleted for workspace", {
        workspaceId,
        deletedCount: knowledge.total,
      });
    } catch (error) {
      this.log.error("Failed to delete all knowledge for workspace", {
        workspaceId,
        error,
      });
      throw error;
    }
  }
}

// ============================================================================
// DEFAULT INSTANCES AND EXPORTS
// ============================================================================

// Create default instances
export const webKnowledgeService = new WebKnowledgeService();
export const fileKnowledgeService = new FileKnowledgeService();
export const textKnowledgeService = new TextKnowledgeService();
export const knowledgeService = new KnowledgeService();

// Re-export types for convenience
export type {
  AddFileKnowledgeRequest,
  AddTextKnowledgeRequest,
  AddWebKnowledgeRequest,
  FileKnowledge,
  TextKnowledge,
  UpdateTextKnowledgeRequest,
  WebKnowledge,
} from "@/types/workspace";
