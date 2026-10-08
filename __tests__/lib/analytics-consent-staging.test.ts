/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://staging.rext.ai/w/acme/content"}
 */

/**
 * Staging is under rext.ai and shares nothing with it (rext-control task 712). The browser still
 * sends it the live site's answer, kept for `.rext.ai`: staging keeps its own under another name
 * and never reads the live one, so an answer given by a real person on the live site is not the
 * answer while testing, and the other way round.
 */

import {
  analyticsMode,
  readConsent,
  resetRegionRequest,
  writeConsent,
} from "@/lib/analytics-consent";

function setCookie(cookie: string) {
  // biome-ignore lint/suspicious/noDocumentCookie: the module under test reads document.cookie
  document.cookie = cookie;
}
const OWN = "Path=/; Secure";
const LIVE = "Path=/; Domain=.rext.ai; Secure";
/** Every value the page sees under a cookie's name. */
const seen = (name: string) =>
  document.cookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${name}=`))
    .map((part) => part.slice(name.length + 1));

const realFetch = global.fetch;

beforeEach(() => {
  for (const name of ["rext-consent", "rext-consent-own", "rext-region"]) {
    setCookie(`${name}=; Max-Age=0; ${OWN}`);
    setCookie(`${name}=; Max-Age=0; ${LIVE}`);
  }
  resetRegionRequest();
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
});

it("does not take the live site's answer as its own: a person is still asked here", async () => {
  setCookie(`rext-region=eea; ${OWN}`);
  setCookie(`rext-consent=granted; ${LIVE}`);

  expect(seen("rext-consent")).toEqual(["granted"]);
  expect(readConsent()).toBeNull();
  await expect(analyticsMode()).resolves.toBe("wait");
});

it("keeps a yes given here when the live site's answer is a no", async () => {
  setCookie(`rext-consent=denied; ${LIVE}`);

  writeConsent("granted");

  expect(readConsent()).toBe("granted");
  await expect(analyticsMode()).resolves.toBe("full");
  expect(seen("rext-consent-own")).toEqual(["granted"]);
  // The live site's answer is left as it was.
  expect(seen("rext-consent")).toEqual(["denied"]);
});

it("keeps a no given here when the live site's answer is a yes", async () => {
  setCookie(`rext-consent=granted; ${LIVE}`);

  writeConsent("denied");

  expect(readConsent()).toBe("denied");
  await expect(analyticsMode()).resolves.toBe("anonymous");
  expect(seen("rext-consent")).toEqual(["granted"]);
});
