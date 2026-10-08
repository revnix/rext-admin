/**
 * What every analytics event carries (rext-control task 712): the workspace on screen, the role
 * and the plan, and never a workspace other than the one the page's address names.
 */

import {
  brandVoiceOf,
  environmentOf,
  eventContext,
  forgetBrandVoices,
  hasBrandVoice,
  isTeamBrowser,
  noteBrandVoice,
  onBrandVoiceNoted,
  workspaceSlugOf,
} from "@/lib/analytics-context";

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
      workspace_has_brand_voice: null,
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
      workspace_has_brand_voice: null,
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

describe("environmentOf", () => {
  it("names the deploy a page is served by", () => {
    expect(environmentOf("app.rext.ai")).toBe("production");
    expect(environmentOf("APP.REXT.AI")).toBe("production");
    expect(environmentOf("staging.rext.ai")).toBe("staging");
    expect(environmentOf("rext-abc123-it-rx.vercel.app")).toBe("preview");
    for (const host of ["localhost", "127.0.0.1", "rext.ai", ""]) {
      expect(environmentOf(host)).toBe("development");
    }
  });
});

describe("isTeamBrowser", () => {
  const set = (cookie: string) => {
    // biome-ignore lint/suspicious/noDocumentCookie: the function under test reads document.cookie
    document.cookie = cookie;
  };
  afterEach(() => set("rext-internal=; Max-Age=0; Path=/"));

  it("is a browser carrying the team's mark, and no other", () => {
    expect(isTeamBrowser()).toBe(false);
    set("rext-internal=0; Path=/");
    expect(isTeamBrowser()).toBe(false);
    set("rext-internal=1; Path=/");
    expect(isTeamBrowser()).toBe(true);
  });
});

describe("a workspace's brand voice", () => {
  const onAcme = () =>
    eventContext({
      routeSlug: "acme",
      workspace: { id: "ws-1", slug: "acme" },
      role: "owner",
      subscription,
    }).workspace_has_brand_voice;

  beforeEach(() => {
    forgetBrandVoices();
  });

  it("is one by the home page's rule: an About or a brand name, and not white space", () => {
    expect(hasBrandVoice({ about: "We make bicycles." })).toBe(true);
    expect(hasBrandVoice({ brand_name: "Acme" })).toBe(true);
    expect(hasBrandVoice({ about: "  ", brand_name: "" })).toBe(false);
    expect(hasBrandVoice({})).toBe(false);
    // A workspace made from a name alone: its detail has no brand voice in it at all.
    expect(hasBrandVoice(undefined)).toBe(false);
    expect(hasBrandVoice(null)).toBe(false);
  });

  it("is said on an event only once the workspace's own detail has been read: a false is never a guess", () => {
    expect(onAcme()).toBeNull();

    noteBrandVoice("ws-1", false);
    expect(onAcme()).toBe(false);

    // The set-up ran: the detail was read again.
    noteBrandVoice("ws-1", true);
    expect(onAcme()).toBe(true);
  });

  it("says nothing of a workspace other than the one the address names", () => {
    noteBrandVoice("ws-1", true);

    // The address names "other"; the app still remembers "acme".
    expect(
      eventContext({
        routeSlug: "other",
        workspace: { id: "ws-1", slug: "acme" },
        role: "owner",
        subscription,
      }).workspace_has_brand_voice,
    ).toBeNull();
    // And what was read of one workspace is not said of another.
    expect(brandVoiceOf("ws-2")).toBeNull();
    expect(brandVoiceOf(null)).toBeNull();
  });

  it("tells whoever listens when it is read anew, and not when nothing changed", () => {
    const heard = jest.fn();
    const stop = onBrandVoiceNoted(heard);

    noteBrandVoice("ws-1", false);
    noteBrandVoice("ws-1", false);
    expect(heard).toHaveBeenCalledTimes(1);

    noteBrandVoice("ws-1", true);
    expect(heard).toHaveBeenCalledTimes(2);

    stop();
    noteBrandVoice("ws-2", true);
    expect(heard).toHaveBeenCalledTimes(2);
  });

  it("takes no workspace without an id", () => {
    noteBrandVoice("", true);
    expect(brandVoiceOf("")).toBeNull();
  });
});
