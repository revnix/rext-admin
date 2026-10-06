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
 * The store client and the caller's Library namespace. The store answers only
 * a signed-in caller, and only for the library of the user their token speaks
 * for: the impersonated user while a super admin impersonates someone.
 */
async function libraryStore(userId: string, workspaceId: string) {
  const { Authorization } = await getAuthHeaders();
  const ownerId =
    tokenUserId(Authorization?.replace(/^Bearer\s+/i, "") ?? "") ?? userId;
  const client = new Client({
    apiUrl: resolveApiBaseUrl({
      explicitBaseUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL,
    }),
    callerOptions: { fetch: authenticatedFetch },
  });
  return { client, namespace: ["library", ownerId, workspaceId] };
}

/** One researched keyword in the caller's Library, by its store key. */
export type LibraryEntry = { key: string; value: StoredKeyword };

/**
 * The caller's researched keywords in a workspace, newest first, one per
 * keyword: researching a keyword again adds an item, and the newest one wins,
 * as in the Library list.
 */
export async function searchLibrary(
  userId: string,
  workspaceId: string,
  limit = 50,
): Promise<LibraryEntry[]> {
  const { client, namespace } = await libraryStore(userId, workspaceId);
  const result = (await client.store.searchItems(namespace, { limit })) as {
    items?: { key: string; value: unknown }[];
  };
  const newest = new Map<string, LibraryEntry>();
  for (const item of result.items ?? []) {
    const value = item.value as StoredKeyword;
    const keyword = value?.original_query?.trim();
    if (!keyword) continue;
    const seen = newest.get(keyword.toLowerCase());
    if (
      !seen ||
      Date.parse(value.timestamp || "") > Date.parse(seen.value.timestamp || "")
    ) {
      newest.set(keyword.toLowerCase(), { key: item.key, value });
    }
  }
  return [...newest.values()].sort(
    (a, b) =>
      (Date.parse(b.value.timestamp || "") || 0) -
      (Date.parse(a.value.timestamp || "") || 0),
  );
}

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
  // Any failure (the session read, the network, the store) finds nothing, so
  // the page shows its notice instead of waiting forever.
  try {
    const { client, namespace } = await libraryStore(userId, workspaceId);
    const item = await client.store.getItem(namespace, key);
    const keyword = (item?.value as StoredKeyword | undefined)?.original_query;
    return keyword ? { key, keyword } : null;
  } catch {
    return null;
  }
}
