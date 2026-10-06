/**
 * Integrations API Namespace
 *
 * A workspace's WordPress sites: connect, list, edit, test, turn publishing
 * to them on or off, disconnect. Publishing itself goes through the content
 * namespace (`/content/{id}/publish`). Shopify is not offered yet.
 *
 * ⚠️ Uses query parameter `workspace_id`, like the content endpoints.
 */

import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

/** One connected site, as the backend returns it; credentials never come back. */
export interface Integration {
  id: string;
  workspace_id: string;
  integration_type: string;
  is_active: boolean;
  site_url?: string | null;
  api_endpoint?: string | null;
  username?: string | null;
  config_json?: Record<string, unknown> | null;
  has_api_key: boolean;
  has_app_password: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface ConnectWordPressRequest {
  is_active: boolean;
  site_url: string;
  api_endpoint: string;
  api_key: string;
}

export interface UpdateWordPressRequest {
  is_active?: boolean;
  site_url?: string;
  api_endpoint?: string;
  /** Left out, the stored key stays. */
  api_key?: string;
}

/** A failed test is an answer, not an error: `ok` is false and `message` says why. */
export interface ConnectionTestResult {
  site_id: string;
  ok: boolean;
  status: string;
  message: string;
  authors_available?: boolean | null;
  checked_at: string;
}

const scoped = (path: string, workspaceId: string) =>
  `${path}?workspace_id=${encodeURIComponent(workspaceId)}`;

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export function createIntegrationsNamespace(client: ApiClient) {
  const WORDPRESS = ENDPOINTS.INTEGRATIONS.WORDPRESS;

  return {
    /**
     * The workspace's WordPress sites
     */
    list: async (workspaceId: string): Promise<Integration[]> => {
      const data = await client.request<{ sites?: Integration[] }>(
        scoped(WORDPRESS.base, workspaceId),
        { method: "GET" },
      );
      return data?.sites ?? [];
    },

    /**
     * Connect a WordPress site; the backend checks the plugin answers first
     */
    connect: async (
      workspaceId: string,
      data: ConnectWordPressRequest,
    ): Promise<Integration> => {
      const result = await client.request<{ site: Integration }>(
        scoped(WORDPRESS.base, workspaceId),
        json("POST", { ...data, integration_type: "wordpress" }),
      );
      return result.site;
    },

    /**
     * Change a site's address, endpoint, key or state
     */
    update: async (
      workspaceId: string,
      siteId: string,
      data: UpdateWordPressRequest,
    ): Promise<Integration> => {
      const result = await client.request<{ site: Integration }>(
        scoped(WORDPRESS.byId(siteId), workspaceId),
        json("PATCH", data),
      );
      return result.site;
    },

    /**
     * Publish to a site again, or stop publishing to it without disconnecting
     */
    setActive: async (
      workspaceId: string,
      siteId: string,
      active: boolean,
    ): Promise<Integration> => {
      const path = active
        ? WORDPRESS.activate(siteId)
        : WORDPRESS.deactivate(siteId);
      const result = await client.request<{ site: Integration }>(
        scoped(path, workspaceId),
        { method: "POST" },
      );
      return result.site;
    },

    /**
     * Test a site's stored credentials again; nothing changes on either side
     */
    test: async (
      workspaceId: string,
      siteId: string,
    ): Promise<ConnectionTestResult> => {
      return client.request<ConnectionTestResult>(
        scoped(WORDPRESS.test(siteId), workspaceId),
        { method: "POST" },
      );
    },

    /**
     * Disconnect a site
     */
    disconnect: async (workspaceId: string, siteId: string): Promise<void> => {
      await client.request(scoped(WORDPRESS.byId(siteId), workspaceId), {
        method: "DELETE",
      });
    },
  };
}
