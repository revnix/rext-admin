/**
 * The unsaved text kept on this device (task 706).
 */

import {
  clearLocalDraft,
  readLocalDraft,
  writeLocalDraft,
} from "@/lib/content/local-draft";

beforeEach(() => window.localStorage.clear());

describe("local draft", () => {
  it("keeps an article's text and when it was written, per article", () => {
    writeLocalDraft("a1", "# Title");
    expect(readLocalDraft("a1")?.markdown).toBe("# Title");
    expect(Number.isNaN(Date.parse(readLocalDraft("a1")?.at ?? ""))).toBe(
      false,
    );
    expect(readLocalDraft("a2")).toBeNull();
  });

  it("forgets it on request", () => {
    writeLocalDraft("a1", "text");
    clearLocalDraft("a1");
    expect(readLocalDraft("a1")).toBeNull();
  });

  it("reads anything it didn't write as nothing", () => {
    window.localStorage.setItem("rext:article-draft:a1", "{not json");
    expect(readLocalDraft("a1")).toBeNull();
    window.localStorage.setItem("rext:article-draft:a1", '{"markdown":3}');
    expect(readLocalDraft("a1")).toBeNull();
  });

  it("never throws when storage refuses", () => {
    const setItem = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    expect(() => writeLocalDraft("a1", "text")).not.toThrow();
    setItem.mockRestore();
  });
});
