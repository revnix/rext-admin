const getItem = jest.fn();
const searchItems = jest.fn();

jest.mock("@langchain/langgraph-sdk", () => ({
  Client: jest
    .fn()
    .mockImplementation(() => ({ store: { getItem, searchItems } })),
}));
jest.mock("@/lib/auth-utils", () => ({
  authenticatedFetch: jest.fn(),
  getAuthHeaders: jest.fn().mockResolvedValue({}),
}));

import {
  findLibraryItem,
  libraryStartQuery,
  searchLibrary,
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

  it("finds nothing when the session can't be read, instead of hanging", async () => {
    const { getAuthHeaders } = jest.requireMock("@/lib/auth-utils");
    getAuthHeaders.mockRejectedValueOnce(new Error("network"));

    await expect(findLibraryItem(KEY, "u1", "w1")).resolves.toBe(null);
  });
});

describe("the Library list", () => {
  it("reads every page, so a search finds an older keyword, newest per keyword", async () => {
    const item = (n: number, keyword = `keyword ${n}`) => ({
      key: `library_${keyword}_${n}`,
      value: {
        original_query: keyword,
        timestamp: new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString(),
      },
    });
    const first = Array.from({ length: 100 }, (_, n) => item(n));
    const second = [item(100), item(101, "keyword 0")];
    searchItems
      .mockResolvedValueOnce({ items: first })
      .mockResolvedValueOnce({ items: second });

    const entries = await searchLibrary("u1", "w1");

    expect(searchItems).toHaveBeenNthCalledWith(1, expect.any(Array), {
      limit: 100,
      offset: 0,
    });
    expect(searchItems).toHaveBeenNthCalledWith(2, expect.any(Array), {
      limit: 100,
      offset: 100,
    });
    expect(searchItems).toHaveBeenCalledTimes(2);
    // 101 keywords: "keyword 0" researched twice, the newer one kept.
    expect(entries).toHaveLength(101);
    expect(entries[0].key).toBe("library_keyword 0_101");
  });
});
