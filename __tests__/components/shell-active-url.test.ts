import { findActiveUrl } from "@/components/shell/use-shell-navigation";

const URLS = [
  "/",
  "/w/acme/content",
  "/w/acme/generate_content",
  "/w/acme/generate_content/library",
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

  it("gives the keyword library to Keywords and the flow to Generate", () => {
    expect(findActiveUrl("/w/acme/generate_content/library", URLS)).toBe(
      "/w/acme/generate_content/library",
    );
    expect(findActiveUrl("/w/acme/generate_content", URLS)).toBe(
      "/w/acme/generate_content",
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
