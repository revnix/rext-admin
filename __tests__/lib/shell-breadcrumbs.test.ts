import { buildBreadcrumbs } from "@/lib/shell-breadcrumbs";

const ID = "550e8400-e29b-41d4-a716-446655440000";

describe("buildBreadcrumbs", () => {
  it("names the home page", () => {
    expect(buildBreadcrumbs("/")).toEqual([{ label: "Home" }]);
  });

  it("starts a workspace page with the workspace, linked to home", () => {
    expect(buildBreadcrumbs("/w/acme/content", "Acme")).toEqual([
      { label: "Acme", href: "/" },
      { label: "Content" },
    ]);
  });

  it("names a record by what it is, never by its id", () => {
    expect(buildBreadcrumbs(`/w/acme/content/${ID}`, "Acme")).toEqual([
      { label: "Acme", href: "/" },
      { label: "Content", href: "/w/acme/content" },
      { label: "Article" },
    ]);
    expect(buildBreadcrumbs("/w/acme/personas/42", "Acme").at(-1)).toEqual({
      label: "Persona",
    });
  });

  it("puts the calendar beside content, as the sidebar does", () => {
    expect(buildBreadcrumbs("/w/acme/content/calendar", "Acme")).toEqual([
      { label: "Acme", href: "/" },
      { label: "Calendar" },
    ]);
  });

  it("puts the settings sections under Settings", () => {
    expect(buildBreadcrumbs("/w/acme/settings/brand-voice", "Acme")).toEqual([
      { label: "Acme", href: "/" },
      { label: "Settings", href: "/w/acme/settings" },
      { label: "Brand voice" },
    ]);
    expect(buildBreadcrumbs("/w/acme/settings/members", "Acme")).toEqual([
      { label: "Acme", href: "/" },
      { label: "Settings", href: "/w/acme/settings" },
      { label: "Members" },
    ]);
  });

  it("names the keyword library Keywords, as the sidebar does, though its path is under Generate", () => {
    expect(
      buildBreadcrumbs("/w/acme/generate_content/library", "Acme"),
    ).toEqual([{ label: "Acme", href: "/" }, { label: "Keywords" }]);
    expect(buildBreadcrumbs("/w/acme/generate_content", "Acme")).toEqual([
      { label: "Acme", href: "/" },
      { label: "Generate" },
    ]);
  });

  it("reads account and admin pages", () => {
    expect(buildBreadcrumbs("/settings/security")).toEqual([
      { label: "Account", href: "/settings" },
      { label: "Security" },
    ]);
    expect(buildBreadcrumbs("/w/create")).toEqual([
      { label: "Workspaces", href: "/w" },
      { label: "New workspace" },
    ]);
    expect(buildBreadcrumbs("/admin/audit-logs")).toEqual([
      { label: "Admin", href: "/admin" },
      { label: "Audit logs" },
    ]);
  });

  it("links no folder that has no page of its own", () => {
    expect(buildBreadcrumbs("/legal/terms")).toEqual([
      { label: "Legal" },
      { label: "Terms of service" },
    ]);
    expect(buildBreadcrumbs("/admin/platform/invitations")[1]).toEqual({
      label: "Platform",
    });
  });

  it("writes an unknown segment in sentence case", () => {
    expect(buildBreadcrumbs("/w/acme/new_area", "Acme").at(-1)).toEqual({
      label: "New area",
    });
  });
});
