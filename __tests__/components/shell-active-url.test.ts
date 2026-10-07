import { findActiveUrl } from "@/components/shell/use-shell-navigation";

const URLS = [
  "/",
  "/w/acme/content",
  "/w/acme/generate-content",
  "/w/acme/keywords",
  "/w/acme/content/calendar",
  "/w/acme/settings",
  "/w/acme/settings/members",
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

  it("gives the keyword library and a keyword's page to Keywords, the flow to Generate", () => {
    expect(findActiveUrl("/w/acme/keywords", URLS)).toBe("/w/acme/keywords");
    expect(findActiveUrl("/w/acme/keywords/seo%20tools", URLS)).toBe(
      "/w/acme/keywords",
    );
    expect(findActiveUrl("/w/acme/generate-content", URLS)).toBe(
      "/w/acme/generate-content",
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

  it("gives a settings section its own item, not General", () => {
    expect(findActiveUrl("/w/acme/settings/members", URLS)).toBe(
      "/w/acme/settings/members",
    );
  });
});
