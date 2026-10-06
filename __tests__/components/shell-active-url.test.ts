import { findActiveUrl } from "@/components/shell/use-shell-navigation";

const URLS = [
  "/",
  "/w/acme/content",
  "/w/acme/topics",
  "/w/acme/content/calendar",
  "/w/acme/settings",
  "/w/acme/members",
];

describe("findActiveUrl", () => {
  it("marks Home on the home page only", () => {
    expect(findActiveUrl("/", URLS)).toBe("/");
    expect(findActiveUrl("/settings", URLS)).toBeNull();
  });

  it("keeps a record's page under its list", () => {
    expect(findActiveUrl("/w/acme/content/42", URLS)).toBe("/w/acme/content");
  });

  it("gives the calendar to Calendar, not to Content, though its path is under content", () => {
    expect(findActiveUrl("/w/acme/content/calendar", URLS)).toBe(
      "/w/acme/content/calendar",
    );
  });

  it("does not match a sibling that only shares a prefix", () => {
    expect(findActiveUrl("/w/acme/contents", URLS)).toBeNull();
  });

  it("keeps a settings sub-page under General", () => {
    expect(findActiveUrl("/w/acme/settings/trash", URLS)).toBe(
      "/w/acme/settings",
    );
  });
});
