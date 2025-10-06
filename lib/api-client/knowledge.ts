/**
 * Knowledge API Namespace
 *
 * Handles web, file, and text knowledge management
 */

import type {
  FileKnowledge,
  TextKnowledge,
  WebKnowledge,
} from "@/types/workspace";
import type { ApiClient } from "./core";

export function createKnowledgeNamespace(client: ApiClient) {
  return {
    // ========================================================================
    // WEB KNOWLEDGE
    // ========================================================================

    /**
     * List web knowledge for workspace
     */
    listWeb: async (workspaceId: string) => {
      return client.request<WebKnowledge[]>(
        `/api/v1/workspaces/${workspaceId}/knowledge/web`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get single web knowledge item
     */
    getWeb: async (webId: string, workspaceId: string) => {
      return client.request<{
        id: string;
        url: string;
        title: string;
        created_at: string;
      }>(`/api/v1/workspaces/${workspaceId}/knowledge/web/${webId}`, {
        method: "GET",
      });
    },

    /**
     * Add web knowledge
     */
    addWeb: async (workspaceId: string, url: string, title?: string) => {
      return client.request<WebKnowledge>(
        `/api/v1/workspaces/${workspaceId}/knowledge/web`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, title }),
        },
      );
    },

    /**
     * Update web knowledge
     */
    updateWeb: async (workspaceId: string, webId: string, title: string) => {
      return client.request<{
        id: string;
        url: string;
        title: string;
      }>(`/api/v1/workspaces/${workspaceId}/knowledge/web/${webId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    },

    /**
     * Delete web knowledge
     */
    deleteWeb: async (workspaceId: string, webId: string) => {
      return client.request<void>(
        `/api/v1/workspaces/${workspaceId}/knowledge/web/${webId}`,
        {
          method: "DELETE",
        },
      );
    },

    // ========================================================================
    // FILE KNOWLEDGE
    // ========================================================================

    /**
     * List file knowledge for workspace
     */
    listFiles: async (workspaceId: string) => {
      return client.request<FileKnowledge[]>(
        `/api/v1/workspaces/${workspaceId}/knowledge/files`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get single file knowledge item
     */
    getFile: async (fileId: string, workspaceId: string) => {
      return client.request<{
        id: string;
        filename: string;
        file_path: string;
        created_at: string;
      }>(`/api/v1/workspaces/${workspaceId}/knowledge/files/${fileId}`, {
        method: "GET",
      });
    },

    /**
     * Add file knowledge (upload)
     */
    addFile: async (workspaceId: string, file: FormData) => {
      return client.request<FileKnowledge>(
        `/api/v1/workspaces/${workspaceId}/knowledge/files`,
        {
          method: "POST",
          body: file, // FormData handles its own content-type
        },
      );
    },

    /**
     * Delete file knowledge
     */
    deleteFile: async (workspaceId: string, fileId: string) => {
      return client.request<void>(
        `/api/v1/workspaces/${workspaceId}/knowledge/files/${fileId}`,
        {
          method: "DELETE",
        },
      );
    },

    // ========================================================================
    // TEXT KNOWLEDGE
    // ========================================================================

    /**
     * List text knowledge for workspace
     */
    listText: async (workspaceId: string) => {
      return client.request<TextKnowledge[]>(
        `/api/v1/workspaces/${workspaceId}/knowledge/text`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Get single text knowledge item
     */
    getText: async (textId: string, workspaceId: string) => {
      return client.request<{
        id: string;
        title: string;
        content: string;
        created_at: string;
      }>(`/api/v1/workspaces/${workspaceId}/knowledge/text/${textId}`, {
        method: "GET",
      });
    },

    /**
     * Add text knowledge
     */
    addText: async (workspaceId: string, title: string, content: string) => {
      return client.request<TextKnowledge>(
        `/api/v1/workspaces/${workspaceId}/knowledge/text`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        },
      );
    },

    /**
     * Update text knowledge
     */
    updateText: async (
      workspaceId: string,
      textId: string,
      data: { title?: string; content?: string; tags?: string[] },
    ) => {
      return client.request<{
        id: string;
        title: string;
        content: string;
      }>(`/api/v1/workspaces/${workspaceId}/knowledge/text/${textId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /**
     * Delete text knowledge
     */
    deleteText: async (workspaceId: string, textId: string) => {
      return client.request<void>(
        `/api/v1/workspaces/${workspaceId}/knowledge/text/${textId}`,
        {
          method: "DELETE",
        },
      );
    },
  };
}
