const getItem = jest.fn();

jest.mock("@langchain/langgraph-sdk", () => ({
  Client: jest.fn().mockImplementation(() => ({ store: { getItem } })),
}));
jest.mock("@/lib/auth-utils", () => ({
  authenticatedFetch: jest.fn(),
  getAuthHeaders: jest.fn().mockResolvedValue({}),
}));

import {
  findLibraryItem,
  libraryStartQuery,
} from "@/lib/generate-content/library-item";

const KEY = "library_content marketing roi_2026-10-05T12:00:00+00:00";

describe("a start from the Library names its item", () => {
  it("passes the item's store key, encoded, and the intent", () => {
    expect(libraryStartQuery(KEY)).toBe(`library=${encodeURIComponent(KEY)}`);
    expect(libraryStartQuery(KEY, "commercial")).toBe(
      `library=${encodeURIComponent(KEY)}&intent=commercial`,
    );
  });

  it("reads the item from the user's own Library", async () => {
    getItem.mockResolvedValueOnce({
      value: { original_query: "content marketing roi" },
    });

    await expect(findLibraryItem(KEY, "u1", "w1")).resolves.toEqual({
      key: KEY,
      keyword: "content marketing roi",
    });
    expect(getItem).toHaveBeenCalledWith(["library", "u1", "w1"], KEY);
  });

  it("finds nothing for text that isn't an item, or a removed one", async () => {
    getItem.mockResolvedValueOnce(null);
    await expect(findLibraryItem("typed text", "u1", "w1")).resolves.toBe(null);

    getItem.mockRejectedValueOnce(new Error("Forbidden"));
    await expect(findLibraryItem(KEY, "u1", "w1")).resolves.toBe(null);
  });
});
