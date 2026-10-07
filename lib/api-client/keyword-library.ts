/**
 * Keyword Library API Namespace
 */

import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

export function createKeywordLibraryNamespace(client: ApiClient) {
  return {
    /**
     * Removes one keyword, by its store key, from the caller's own library in a workspace. The
     * backend takes the user from the token and also deletes the search results kept beside the
     * item (E24). A key that isn't in the caller's library answers 404.
     */
    delete: async (workspaceId: string, key: string) => {
      return client.request<{ deleted_key: string }>(
        `${ENDPOINTS.KEYWORD_LIBRARY.items(workspaceId)}?key=${encodeURIComponent(key)}`,
        { method: "DELETE" },
      );
    },
  };
}
