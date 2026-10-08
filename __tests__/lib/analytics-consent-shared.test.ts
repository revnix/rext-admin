/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://app.rext.ai/w/acme/content"}
 */

/**
 * One answer for rext.ai and the app (rext-control task 712): on rext.ai's hosts the choice is
 * kept in one cookie for `.rext.ai`, so an answer given on either is the answer on both. Run on
 * the app's own address, where a cookie can be this host's alone or the shared one.
 */

import {
  analyticsMode,
  onConsentChange,
  readConsent,
  resetRegionRequest,
  shareOwnConsent,
  writeConsent,
} from "@/lib/analytics-consent";

function setCookie(cookie: string) {
  // biome-ignore lint/suspicious/noDocumentCookie: the module under test reads document.cookie
  document.cookie = cookie;
}
const OWN = "Path=/; Secure";
const SHARED = "Path=/; Domain=.rext.ai; Secure";
/** Every value the page sees under the choice's name. */
const seen = () =>
  document.cookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("rext-consent="))
    .map((part) => part.slice("rext-consent=".length));
/** What is left once this host's own cookie is taken away: the shared one's value, if any. */
const sharedValue = () => {
  setCookie(`rext-consent=; Max-Age=0; ${OWN}`);
  return seen();
};

const realFetch = global.fetch;

beforeEach(() => {
  for (const attributes of [OWN, SHARED]) {
    setCookie(`rext-consent=; Max-Age=0; ${attributes}`);
    setCookie(`rext-region=; Max-Age=0; ${attributes}`);
  }
  resetRegionRequest();
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true }) as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
});

it("takes an answer given on rext.ai as the app's own, so nobody is asked twice", async () => {
  setCookie(`rext-region=eea; ${OWN}`);
  setCookie(`rext-consent=granted; ${SHARED}`);

  expect(readConsent()).toBe("granted");
  // In the EEA, with no answer of the app's own: measured, not asked.
  expect(await analyticsMode()).toBe("full");
});

it("writes its answer for every rext.ai host, and takes away the one it kept for itself", () => {
  setCookie(`rext-consent=granted; ${OWN}`);

  writeConsent("denied");

  expect(seen()).toEqual(["denied"]);
  // Still there with this host's own cookie gone: it is the shared one.
  expect(sharedValue()).toEqual(["denied"]);
});

it("keeps a no where an answer kept here sits beside a different one from rext.ai", () => {
  setCookie(`rext-consent=denied; ${OWN}`);
  setCookie(`rext-consent=granted; ${SHARED}`);
  expect(readConsent()).toBe("denied");

  setCookie(`rext-consent=granted; ${OWN}`);
  setCookie(`rext-consent=denied; ${SHARED}`);
  expect(readConsent()).toBe("denied");
});

it("moves an answer this host kept for itself to the shared cookie, and tells the server", () => {
  setCookie(`rext-consent=granted; ${OWN}`);

  shareOwnConsent();

  expect(sharedValue()).toEqual(["granted"]);
  expect(global.fetch).toHaveBeenCalledWith(
    "/api/consent",
    expect.objectContaining({ body: JSON.stringify({ choice: "granted" }) }),
  );
});

it("moves a no over a yes from rext.ai: a no stays a no on both", () => {
  setCookie(`rext-consent=denied; ${OWN}`);
  setCookie(`rext-consent=granted; ${SHARED}`);

  shareOwnConsent();

  expect(seen()).toEqual(["denied"]);
  expect(sharedValue()).toEqual(["denied"]);
});

it("leaves a shared answer alone, and has nothing to move without one", () => {
  shareOwnConsent();
  expect(seen()).toEqual([]);

  setCookie(`rext-consent=granted; ${SHARED}`);
  shareOwnConsent();

  expect(seen()).toEqual(["granted"]);
  expect(global.fetch).not.toHaveBeenCalled();
});

it("hears an answer changed on rext.ai when the person comes back to this tab", () => {
  setCookie(`rext-consent=granted; ${SHARED}`);
  const heard: string[] = [];
  const stop = onConsentChange((choice) => heard.push(choice));

  // Nothing changed: coming back tells nobody anything.
  window.dispatchEvent(new Event("focus"));
  expect(heard).toEqual([]);

  // The website's own switch, in another tab: only the shared cookie changes.
  setCookie(`rext-consent=denied; ${SHARED}`);
  document.dispatchEvent(new Event("visibilitychange"));
  window.dispatchEvent(new Event("focus"));
  expect(heard).toEqual(["denied"]);

  stop();
  setCookie(`rext-consent=granted; ${SHARED}`);
  window.dispatchEvent(new Event("focus"));
  expect(heard).toEqual(["denied"]);
});
