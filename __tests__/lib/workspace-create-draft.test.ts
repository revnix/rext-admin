/**
 * What was typed into the create-workspace form, kept for the tab (rext-control task 854): the
 * form came back empty after leaving the page, and a newcomer who had started didn't start again.
 */

import {
  dropCreateDraft,
  keepCreateDraft,
  readCreateDraft,
} from "@/lib/workspace/create-draft";

const KEY = "rext:workspace-create-draft";

describe("the create form's draft", () => {
  it("is nothing before anything was typed", () => {
    expect(readCreateDraft()).toBeNull();
  });

  it("comes back as it was kept", () => {
    keepCreateDraft({
      from: "description",
      name: "Luna Bakery",
      description: "We bake sourdough for cafes in Leeds.",
    });

    expect(readCreateDraft()).toEqual({
      from: "description",
      name: "Luna Bakery",
      url: undefined,
      description: "We bake sourdough for cafes in Leeds.",
    });
  });

  it("keeps the way in alone, when nothing is typed yet", () => {
    keepCreateDraft({ from: "description" });
    expect(readCreateDraft()).toMatchObject({ from: "description" });
  });

  it("keeps nothing for an empty form on its first way in", () => {
    keepCreateDraft({ from: "website", name: "Luna" });
    keepCreateDraft({ from: "website", name: "" });

    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it("says whether it was kept: storage that refuses it keeps nothing", () => {
    expect(keepCreateDraft({ from: "website", name: "Luna Bakery" })).toBe(
      true,
    );
    const refusing = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("The quota has been exceeded.");
      });

    expect(keepCreateDraft({ from: "website", name: "Luna Bakery 2" })).toBe(
      false,
    );
    refusing.mockRestore();
  });

  it("is gone once the workspace is made", () => {
    keepCreateDraft({ from: "website", name: "Luna Bakery" });
    dropCreateDraft();

    expect(readCreateDraft()).toBeNull();
  });

  it.each([
    ["not JSON", "{not json"],
    ["a list", "[1, 2]"],
    ["a word", '"hello"'],
  ])("reads %s in its place as nothing", (_, kept) => {
    window.sessionStorage.setItem(KEY, kept);
    expect(readCreateDraft()?.name).toBeUndefined();
  });

  it("takes only text of a field's length", () => {
    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({
        from: "elsewhere",
        name: { not: "text" },
        url: "x".repeat(2001),
        description: "Fine.",
      }),
    );

    expect(readCreateDraft()).toEqual({
      from: "website",
      name: undefined,
      url: undefined,
      description: "Fine.",
    });
  });
});
