/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://app.rext.ai/w/acme/content"}
 */

/**
 * What a person wrote stays out of an address that goes to analytics (rext-control#942): a
 * list's search, a keyword in a page's path, a Library item's key. The app's own words, numbers
 * and ids in an address stay.
 */
import { redactEventUrls, redactUrl, sharedPath } from "@/lib/analytics-redact";

const APP = "https://app.rext.ai";
const ID = "3f2a9c1e-7b4d-4e6f-8a1b-2c3d4e5f6a7b";
// What a person could have typed into a search box, or researched as a keyword.
const TYPED = "mary smith";
const KEYWORD = "best crm for dentists";

/** One parameter's value in an address, after the redaction. */
function paramOf(address: string, name: string): string | null {
  return new URL(redactUrl(address)).searchParams.get(name);
}

describe("redactUrl, a query", () => {
  it("replaces what was typed into a list's search, and keeps the list's own words beside it", () => {
    const sent = redactUrl(
      `${APP}/w/acme/content?q=${encodeURIComponent(TYPED)}&status=draft,published&sort=created_at.desc&page=2&size=25`,
    );

    expect(sent).not.toContain("mary");
    const query = new URL(sent).searchParams;
    expect([...query.keys()]).toEqual(["q", "status", "sort", "page", "size"]);
    expect(Object.fromEntries(query)).toEqual({
      q: "redacted",
      status: "draft,published",
      sort: "created_at.desc",
      page: "2",
      size: "25",
    });
  });

  it("keeps a campaign tag, an id and a fixed word, and replaces the same parameter when it holds anything else", () => {
    const kept: [string, string][] = [
      ["ref", "producthunt"],
      ["utm_source", "newsletter"],
      ["thread", ID],
      ["persona", `${ID},${ID}`],
      ["month", "2026-10"],
      ["view", "week"],
      ["error", "OAuthAccountNotLinked"],
      ["session", "expired"],
    ];
    for (const [name, value] of kept) {
      expect(paramOf(`${APP}/w/acme/content?${name}=${value}`, name)).toBe(
        value,
      );
    }
    for (const name of ["ref", "thread", "persona", "month", "view", "page"]) {
      expect(
        paramOf(
          `${APP}/w/acme/content?${name}=${encodeURIComponent(KEYWORD)}`,
          name,
        ),
      ).toBe("redacted");
    }
  });

  it("never lets a Library item's key leave: it is the item's keyword", () => {
    const sent = redactUrl(
      `${APP}/w/acme/generate-content?library=${encodeURIComponent(KEYWORD)}&intent=informational`,
    );

    expect(Object.fromEntries(new URL(sent).searchParams)).toEqual({
      library: "redacted",
      intent: "informational",
    });
  });

  it("replaces a parameter the app doesn't list, whatever it holds, and leaves an empty one alone", () => {
    expect(paramOf(`${APP}/pricing?anything=all`, "anything")).toBe("redacted");
    expect(paramOf(`${APP}/pricing?q=`, "q")).toBe("");
    // Given twice, with a value that has to go: once, redacted.
    expect(
      new URL(
        redactUrl(`${APP}/w/acme/content?status=draft&status=${TYPED}`),
      ).searchParams.getAll("status"),
    ).toEqual(["redacted"]);
  });

  it("keeps where a signed-out person was headed as that page's path, and nothing of another site", () => {
    const headed = encodeURIComponent(
      `/w/acme/keywords/${KEYWORD}?q=${TYPED}#top`,
    );

    expect(paramOf(`${APP}/login?redirect=${headed}`, "redirect")).toBe(
      "/w/acme/keywords/*",
    );
    expect(paramOf(`${APP}/login?callbackUrl=%2Fw%2Facme`, "callbackUrl")).toBe(
      "/w/acme",
    );
    expect(
      paramOf(
        `${APP}/login?callbackUrl=https%3A%2F%2Fexample.test%2Fx`,
        "callbackUrl",
      ),
    ).toBe("redacted");
  });

  it("still replaces every key and email, as before", () => {
    const sent = redactUrl(
      `${APP}/login?email=mary%40example.com&invitation_token=inv-1&code=c-1&state=s-1&token=t-1`,
    );

    expect(new Set(new URL(sent).searchParams.values())).toEqual(
      new Set(["redacted"]),
    );
  });
});

describe("redactUrl, the app's own path", () => {
  it("puts a star where a keyword stood, and keeps a workspace's address name and an id", () => {
    expect(
      redactUrl(`${APP}/w/acme/keywords/${encodeURIComponent(KEYWORD)}`),
    ).toBe(`${APP}/w/acme/keywords/*`);
    for (const path of [
      `/w/acme/content/${ID}`,
      `/edit/acme/${ID}`,
      `/w/acme/personas/${ID}/edit`,
      "/w/acme/settings/brand-voice",
      "/w/create",
      "/settings/plan",
      "/",
    ]) {
      expect(redactUrl(APP + path)).toBe(APP + path);
    }
  });

  it("leaves another site's path as it is", () => {
    const post = "https://rext.ai/blog/best-crm-for-dentists?ref=producthunt";

    expect(redactUrl(post)).toBe(post);
  });
});

describe("sharedPath", () => {
  it("keeps a route's own words, a workspace's address name and ids; anything else where a parameter stands is a star", () => {
    expect(sharedPath(`/w/acme/keywords/${KEYWORD}`)).toBe(
      "/w/acme/keywords/*",
    );
    expect(sharedPath("/w/acme/keywords/security")).toBe("/w/acme/keywords/*");
    expect(sharedPath(`/w/acme/content/${ID}`)).toBe(`/w/acme/content/${ID}`);
    expect(sharedPath("/w/acme/content/calendar")).toBe(
      "/w/acme/content/calendar",
    );
    expect(sharedPath("/w/acme/personas/42")).toBe("/w/acme/personas/42");
    expect(sharedPath("/w/acme/personas/Ana the dentist/edit")).toBe(
      "/w/acme/personas/*/edit",
    );
    // Past the routes the app has.
    expect(sharedPath("/w/acme/content/calendar/anything typed")).toBe(
      "/w/acme/content/calendar/*",
    );
    expect(sharedPath("/nothing here")).toBe("/*");
    expect(sharedPath("/")).toBe("/");
  });
});

describe("redactEventUrls, the paths PostHog writes alone", () => {
  it("shapes the app's own, on the event and on the person, and leaves the website's", () => {
    const event = {
      event: "$pageview",
      properties: {
        $current_url: `${APP}/w/acme/keywords/${encodeURIComponent(KEYWORD)}?q=${encodeURIComponent(TYPED)}`,
        $host: "app.rext.ai",
        $pathname: `/w/acme/keywords/${KEYWORD}`,
        $prev_pageview_pathname: `/w/acme/keywords/${KEYWORD}`,
        $session_entry_host: "rext.ai",
        $session_entry_pathname: "/blog/best-crm-for-dentists",
        $session_entry_url: "https://rext.ai/blog/best-crm-for-dentists",
      },
      $set_once: {
        $initial_host: "app.rext.ai",
        $initial_pathname: `/w/acme/keywords/${KEYWORD}`,
        $initial_current_url: `${APP}/w/acme/keywords/${encodeURIComponent(KEYWORD)}`,
      },
    };

    const sent = redactEventUrls(event);

    expect(sent?.properties).toEqual({
      $current_url: `${APP}/w/acme/keywords/*?q=redacted`,
      $host: "app.rext.ai",
      $pathname: "/w/acme/keywords/*",
      $prev_pageview_pathname: "/w/acme/keywords/*",
      $session_entry_host: "rext.ai",
      $session_entry_pathname: "/blog/best-crm-for-dentists",
      $session_entry_url: "https://rext.ai/blog/best-crm-for-dentists",
    });
    expect(sent?.$set_once).toEqual({
      $initial_host: "app.rext.ai",
      $initial_pathname: "/w/acme/keywords/*",
      $initial_current_url: `${APP}/w/acme/keywords/*`,
    });
    const whole = JSON.stringify(sent);
    expect(whole).not.toContain("mary");
    expect(whole).not.toContain("dentists?");
  });
});
