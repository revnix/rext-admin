/**
 * Keyword Library API Namespace
 */

import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

export function createKeywordLibraryNamespace(client: ApiClient) {
  return {
    /**
     * Delete a keyword from the library
     */
    delete: async (key: string, namespace: string[]) => {
      return client.request<{ deleted_key: string }>(
        ENDPOINTS.KEYWORD_LIBRARY.base,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, namespace }),
        },
      );
    },
  };
}
