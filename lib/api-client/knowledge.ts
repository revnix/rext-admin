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

export interface KnowledgeBase {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  type: "default" | "custom";
  items_count: number;
  created_at: string;
  updated_at: string | null;
}

export function createKnowledgeNamespace(client: ApiClient) {
  return {
    // ========================================================================
    // KNOWLEDGE BASES
    // ========================================================================

    /**
     * List all knowledge bases for workspace
     */
    listBases: async (workspaceId: string) => {
      return client.request<{
        knowledge_bases: KnowledgeBase[];
        total_count: number;
      }>(`/api/v1/workspaces/${workspaceId}/knowledge-bases`, {
        method: "GET",
      });
    },

    /**
     * Get single knowledge base
     */
    getBase: async (
      workspaceId: string,
      kbId: string,
      includeItems = false,
    ) => {
      return client.request<{ knowledge_base: KnowledgeBase }>(
        `/api/v1/workspaces/${workspaceId}/knowledge-bases/${kbId}?include_items=${includeItems}`,
        {
          method: "GET",
        },
      );
    },

    /**
     * Create knowledge base
     */
    createBase: async (
      workspaceId: string,
      data: { name: string; description?: string },
    ) => {
      return client.request<{ knowledge_base: KnowledgeBase }>(
        `/api/v1/workspaces/${workspaceId}/knowledge-bases`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Update knowledge base
     */
    updateBase: async (
      workspaceId: string,
      kbId: string,
      data: { name?: string; description?: string },
    ) => {
      return client.request<{ knowledge_base: KnowledgeBase }>(
        `/api/v1/workspaces/${workspaceId}/knowledge-bases/${kbId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Delete knowledge base
     */
    deleteBase: async (workspaceId: string, kbId: string) => {
      return client.request<void>(
        `/api/v1/workspaces/${workspaceId}/knowledge-bases/${kbId}`,
        {
          method: "DELETE",
        },
      );
    },

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
    addWeb: async (
      workspaceId: string,
      url: string,
      title?: string,
      knowledgeBaseId?: string,
    ) => {
      return client.request<WebKnowledge>(
        `/api/v1/workspaces/${workspaceId}/knowledge/web`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            title,
            knowledge_base_id: knowledgeBaseId,
          }),
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
        method: "PATCH",
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
    addFile: async (
      workspaceId: string,
      file: FormData,
      knowledgeBaseId?: string,
    ) => {
      // Add knowledge_base_id to FormData if provided
      if (knowledgeBaseId) {
        file.append("knowledge_base_id", knowledgeBaseId);
      }
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
    addText: async (
      workspaceId: string,
      _title: string,
      content: string,
      knowledgeBaseId?: string,
    ) => {
      return client.request<TextKnowledge>(
        `/api/v1/workspaces/${workspaceId}/knowledge/text`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: _title,
            content,
            knowledge_base_id: knowledgeBaseId,
          }),
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
        method: "PATCH",
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
