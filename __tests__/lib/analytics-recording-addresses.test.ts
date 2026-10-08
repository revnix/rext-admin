/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://app.rext.ai/w/acme/keywords"}
 */

/**
 * The addresses a session recording keeps (rext-control#942): a keyword's page names the keyword
 * in its address, the Library lists a link to one for every keyword, and a request to the backend
 * can carry the same key. Each leaves with a star where the keyword stood.
 */
import type { CapturedNetworkRequest } from "posthog-js";
import { maskAttribute, maskNetworkRequest } from "@/lib/analytics-recording";

const APP = "https://app.rext.ai";
const ID = "3f2a9c1e-7b4d-4e6f-8a1b-2c3d4e5f6a7b";
// A Library item's key: the keyword's own words and when it was saved.
const KEY = "library_best%20crm%20for%20dentists_2026-10-08T06%3A30%3A55";

function link(html: string): Element {
  document.body.innerHTML = html;
  return document.body.firstElementChild as Element;
}

const request = (name: string) =>
  ({
    name,
    requestHeaders: {},
    requestBody: "",
    responseHeaders: {},
    responseBody: "",
  }) as unknown as CapturedNetworkRequest;

describe("a link in a recorded page", () => {
  it("to a keyword's page leaves with a star where the keyword stood", () => {
    const row = link(`<a href="/w/acme/keywords/${KEY}">Open</a>`);

    expect(maskAttribute("href", `/w/acme/keywords/${KEY}`, row)).toBe(
      `${APP}/w/acme/keywords/*`,
    );
  });

  it("to a page named by an id, or to one of the app's own, leaves as it was", () => {
    const row = link(`<a href="/w/acme/content/${ID}">Open</a>`);

    for (const path of [
      `/w/acme/content/${ID}`,
      "/w/acme/keywords",
      "/w/acme/settings/brand-voice",
      "/settings/plan",
    ]) {
      expect(maskAttribute("href", path, row)).toBe(APP + path);
    }
  });

  it("keeps a file of the build's own under its own name", () => {
    const picture = link(`<img src="/_next/static/media/mark.8f2a.svg" />`);

    expect(
      maskAttribute("src", "/_next/static/media/mark.8f2a.svg", picture),
    ).toBe(`${APP}/_next/static/media/mark.8f2a.svg`);
  });
});

describe("a page's address and a request in a recording", () => {
  it("a keyword's page leaves with a star where the keyword stood", () => {
    expect(
      maskNetworkRequest(request(`${APP}/w/acme/keywords/${KEY}?tab=serp`))
        ?.name,
    ).toBe(`${APP}/w/acme/keywords/*`);
    expect(
      maskNetworkRequest(request(`${APP}/w/acme/content/${ID}`))?.name,
    ).toBe(`${APP}/w/acme/content/${ID}`);
  });

  it("a request to the API leaves as its route's shape, with nothing of the key", () => {
    const sent = maskNetworkRequest(
      request(
        `https://api.rext.ai/api/v1/workspaces/${ID}/keyword-library/items/${KEY}?fresh=1`,
      ),
    )?.name;

    expect(sent).toMatch(
      /^https:\/\/api\.rext\.ai\/api\/v1\/workspaces\/\*\/keyword-library\//,
    );
    expect(sent).not.toContain("crm");
    expect(sent).not.toContain("dentists");
    expect(sent).not.toContain("?");
  });

  it("the build's own files and another site's requests keep their paths", () => {
    for (const address of [
      `${APP}/_next/static/chunks/0abc.js`,
      "https://client.crisp.chat/static/javascripts/client.js",
    ]) {
      expect(maskNetworkRequest(request(`${address}?v=2`))?.name).toBe(address);
    }
  });
});
