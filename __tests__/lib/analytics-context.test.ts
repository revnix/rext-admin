/**
 * What every analytics event carries (rext-control task 712): the workspace on screen, the role
 * and the plan, and never a workspace other than the one the page's address names.
 */

import { eventContext, workspaceSlugOf } from "@/lib/analytics-context";

const subscription = {
  plan_name: "growth",
  status: "active",
  billing_period: "monthly",
};

describe("eventContext", () => {
  it("carries the workspace the address names, the role and the plan", () => {
    expect(
      eventContext({
        routeSlug: "acme",
        workspace: { id: "ws-1", slug: "acme" },
        role: "owner",
        subscription,
      }),
    ).toEqual({
      workspace_id: "ws-1",
      role: "owner",
      plan: "growth",
      plan_status: "active",
      billing_period: "monthly",
    });
  });

  it("carries no workspace while the app still holds the one opened before", () => {
    // The address names "other"; the app's memory still has "acme" until "other" has loaded.
    expect(
      eventContext({
        routeSlug: "other",
        workspace: { id: "ws-1", slug: "acme" },
        role: "owner",
        subscription,
      }).workspace_id,
    ).toBeNull();
  });

  it("carries no workspace on a page that belongs to none", () => {
    expect(
      eventContext({
        routeSlug: undefined,
        workspace: { id: "ws-1", slug: "acme" },
        role: "owner",
        subscription,
      }).workspace_id,
    ).toBeNull();
  });

  it("says nothing about a plan that hasn't loaded", () => {
    expect(
      eventContext({
        routeSlug: null,
        workspace: null,
        role: undefined,
        subscription: null,
      }),
    ).toEqual({
      workspace_id: null,
      role: null,
      plan: null,
      plan_status: null,
      billing_period: null,
    });
  });
});

describe("workspaceSlugOf", () => {
  it("reads the workspace from a workspace page's and the editor's address", () => {
    expect(workspaceSlugOf("/w/acme/content")).toBe("acme");
    expect(workspaceSlugOf("/edit/acme/6f1c")).toBe("acme");
    expect(workspaceSlugOf("/w/caf%C3%A9")).toBe("café");
  });

  it("finds none on an account page or the page that creates a workspace", () => {
    expect(workspaceSlugOf("/settings/data")).toBeNull();
    expect(workspaceSlugOf("/w/create")).toBeNull();
    expect(workspaceSlugOf("/")).toBeNull();
  });
});
