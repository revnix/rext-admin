import { Client } from "@langchain/langgraph-sdk";

import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { authenticatedFetch, getAuthHeaders } from "@/lib/auth-utils";
import { tokenUserId } from "@/lib/generate-content/generation-identity";
import type { StoredKeyword } from "@/types/generate-content";

/** A Library item a run starts from: its store key and the keyword it holds. */
export type LibraryStart = { key: string; keyword: string };

/**
 * The link that starts an article from a Library item. It names the item by
 * its store key, not by its keyword: the backend loads that item's research
 * (rext-backend E17) and refuses anything that isn't in the caller's Library.
 */
export const libraryStartQuery = (key: string, intent?: string) =>
  `library=${encodeURIComponent(key)}${
    intent ? `&intent=${encodeURIComponent(intent)}` : ""
  }`;

/**
 * Reads one item from the caller's own Library, or null when it isn't there
 * (a removed item, another user's key, or text typed into the link). The store
 * answers only for the library of the user the token speaks for, as in the
 * Library list.
 */
export async function findLibraryItem(
  key: string,
  userId: string,
  workspaceId: string,
): Promise<LibraryStart | null> {
  const { Authorization } = await getAuthHeaders();
  const ownerId =
    tokenUserId(Authorization?.replace(/^Bearer\s+/i, "") ?? "") ?? userId;
  const client = new Client({
    apiUrl: resolveApiBaseUrl({
      explicitBaseUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL,
    }),
    callerOptions: { fetch: authenticatedFetch },
  });

  try {
    const item = await client.store.getItem(
      ["library", ownerId, workspaceId],
      key,
    );
    const keyword = (item?.value as StoredKeyword | undefined)?.original_query;
    return keyword ? { key, keyword } : null;
  } catch {
    return null;
  }
}
