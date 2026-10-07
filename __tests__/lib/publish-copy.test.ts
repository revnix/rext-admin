/**
 * The article's Publish menu (#676): on a live article, a draft or review save says the post leaves
 * the site; every confirm names its action; a post link is only ever a web address.
 */

import { postLink, publishConfirmCopy } from "@/lib/content/publish-copy";
import type { WordPressPostStatus } from "@/types/content";

const STATUSES: WordPressPostStatus[] = ["publish", "draft", "pending"];

describe("publishConfirmCopy", () => {
  it("warns that a draft or review save takes a live post down", () => {
    for (const status of ["draft", "pending"] as const) {
      const copy = publishConfirmCopy(status, true);
      expect(copy.title).toMatch(/^Take the post down/);
      expect(copy.description).toContain("leaves your site");
      expect(copy.confirmText).toBe("Take the post down");
      expect(copy.cancelText).toBe("Keep it live");
      expect(copy.variant).toBe("destructive");
    }
  });

  it("asks plainly when the article isn't live", () => {
    expect(publishConfirmCopy("draft", false)).toMatchObject({
      title: "Save as a draft on your site?",
      confirmText: "Save as draft",
      variant: "default",
    });
    expect(publishConfirmCopy("pending", false).confirmText).toBe(
      "Submit for review",
    );
    expect(publishConfirmCopy("publish", false).confirmText).toBe(
      "Publish article",
    );
  });

  it("says a publish of a live article updates its post", () => {
    expect(publishConfirmCopy("publish", true)).toMatchObject({
      title: "Update the live post?",
      confirmText: "Update post",
      variant: "default",
    });
  });

  it("names the action on every button, never 'Confirm'", () => {
    for (const status of STATUSES) {
      for (const live of [true, false]) {
        expect(publishConfirmCopy(status, live).confirmText).not.toMatch(
          /^(Confirm|OK|Continue)$/,
        );
      }
    }
  });
});

describe("postLink", () => {
  it("keeps a web address", () => {
    expect(postLink("https://example.com/how-to-start/")).toBe(
      "https://example.com/how-to-start/",
    );
  });

  it("drops anything that isn't one", () => {
    expect(postLink(undefined)).toBeNull();
    expect(postLink("")).toBeNull();
    expect(postLink("not a url")).toBeNull();
    expect(postLink("javascript:alert(1)")).toBeNull();
  });
});
