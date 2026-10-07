/**
 * The workspace switcher keeps the page open when it changes workspace (lib/routes.ts): a settings
 * section is a page of its own, so switching from Members opens the other workspace's Members.
 */

import { buildWorkspacePath, extractWorkspacePageSegment } from "@/lib/routes";

describe("extractWorkspacePageSegment", () => {
  it.each([
    ["/w/acme/content", "content"],
    ["/w/acme/content/42", "content"],
    ["/w/acme/keywords", "keywords"],
    ["/w/acme/keywords/library_seo%20tools", "keywords"],
    ["/w/acme/settings", "settings"],
    ["/w/acme/settings/", "settings"],
    ["/w/acme/settings/brand-voice", "settings/brand-voice"],
    ["/w/acme/settings/members", "settings/members"],
    ["/w/acme/settings/danger-zone", "settings/danger-zone"],
    ["/w/acme/settings/trash", "settings"],
  ])("reads %s as %s", (path, page) => {
    expect(extractWorkspacePageSegment(path)).toBe(page);
  });

  it.each(["/w/acme", "/w/acme/generate_content", "/settings/security", "/"])(
    "has no page for %s",
    (path) => {
      expect(extractWorkspacePageSegment(path)).toBeNull();
    },
  );

  it("doesn't take a sibling that only shares a prefix", () => {
    expect(extractWorkspacePageSegment("/w/acme/settingsx")).toBeNull();
  });
});

describe("buildWorkspacePath", () => {
  it("opens the same settings section in the other workspace", () => {
    expect(buildWorkspacePath("globex", "settings/members")).toBe(
      "/w/globex/settings/members",
    );
    expect(buildWorkspacePath("globex", "settings/brand-voice")).toBe(
      "/w/globex/settings/brand-voice",
    );
    expect(buildWorkspacePath("globex", "settings")).toBe("/w/globex/settings");
  });

  it("opens the other workspace's keywords from Keywords or a keyword's page", () => {
    // A keyword's page names a record of one workspace's library: the other workspace opens its list.
    expect(buildWorkspacePath("globex", "keywords")).toBe("/w/globex/keywords");
  });
});
