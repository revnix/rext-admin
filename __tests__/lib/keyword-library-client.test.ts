/**
 * The keyword library's removal goes through the app's route (G78), with the store key in the
 * query, encoded: a key holds the keyword as typed and an ISO time ("+00:00").
 */

import type { ApiClient } from "@/lib/api-client/core";
import { createKeywordLibraryNamespace } from "@/lib/api-client/keyword-library";

describe("keywordLibrary.delete", () => {
  it("sends DELETE to the workspace's library route with the key encoded", async () => {
    const request = jest.fn().mockResolvedValue({ deleted_key: "k" });
    const library = createKeywordLibraryNamespace({
      request,
    } as unknown as ApiClient);

    await library.delete("w1", "library_a/b? c_2026-10-05T09:00:00+00:00");

    expect(request).toHaveBeenCalledWith(
      "/api/v1/workspaces/w1/keyword-library/items?key=library_a%2Fb%3F%20c_2026-10-05T09%3A00%3A00%2B00%3A00",
      { method: "DELETE" },
    );
  });
});
