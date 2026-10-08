/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://app.rext.ai/w/acme/content"}
 */

/**
 * PostHog's toolbar on the app (rext-control task 712): let in for one of our admins whose
 * browser arrived with PostHog's launch link, and for nobody else. The module reads the launch
 * link when it first runs, so each test loads it afresh on the address it sets.
 */

type Toolbar = typeof import("@/lib/analytics-toolbar");

const LAUNCH = "#__posthog=eyJhY3Rpb24iOiJwaF9hdXRob3JpemUifQ";
const STATE_KEY = "_postHogToolbarParams";
const UNTIL_KEY = "rext-toolbar-until";
const HOUR = 60 * 60 * 1000;

const marked = () => document.cookie.includes("rext-toolbar=1");

async function load(hash: string): Promise<Toolbar> {
  window.location.hash = hash;
  jest.resetModules();
  return import("@/lib/analytics-toolbar");
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  // biome-ignore lint/suspicious/noDocumentCookie: the test's own reset of the browser
  document.cookie = "rext-toolbar=; Max-Age=0; Path=/";
});

it("is for our own admins, never a customer", async () => {
  const { mayUseToolbar } = await load("");

  expect(mayUseToolbar("super_admin")).toBe(true);
  expect(mayUseToolbar("admin")).toBe(true);
  for (const role of ["owner", "member", "support", "", null, undefined]) {
    expect(mayUseToolbar(role)).toBe(false);
  }
});

it("does nothing on an ordinary visit, for an admin too", async () => {
  const { syncToolbarMark } = await load("");

  expect(syncToolbarMark(true)).toBe(false);
  expect(marked()).toBe(false);
});

it("marks an admin's browser that arrived with the launch link, and asks for one more load", async () => {
  const { syncToolbarMark, toolbarMarked } = await load(LAUNCH);

  expect(syncToolbarMark(true, 1_000)).toBe(true);
  expect(toolbarMarked()).toBe(true);
  expect(Number(window.localStorage.getItem(UNTIL_KEY))).toBe(1_000 + 2 * HOUR);
  // Marked already: the page is not loaded again and again.
  expect(syncToolbarMark(true, 2_000)).toBe(false);
  expect(marked()).toBe(true);
});

it("never marks the browser of someone who isn't one of our admins, launch link or not", async () => {
  const { syncToolbarMark } = await load(LAUNCH);

  expect(syncToolbarMark(false)).toBe(false);
  expect(marked()).toBe(false);
});

it("marks on a later page while posthog-js still holds the launch and its two hours aren't over", async () => {
  // The link was used on the sign-in page; this is the page after signing in.
  const { syncToolbarMark } = await load("");
  window.localStorage.setItem(STATE_KEY, "{}");
  window.localStorage.setItem(UNTIL_KEY, String(10 * HOUR));

  expect(syncToolbarMark(true, 9 * HOUR)).toBe(true);
  expect(marked()).toBe(true);
});

it("takes the mark away, and the kept launch with it, once the two hours are over", async () => {
  const { syncToolbarMark } = await load("");
  window.localStorage.setItem(STATE_KEY, "{}");
  window.localStorage.setItem(UNTIL_KEY, String(10 * HOUR));
  // biome-ignore lint/suspicious/noDocumentCookie: the mark as an earlier page set it
  document.cookie = "rext-toolbar=1; Path=/";

  expect(syncToolbarMark(true, 11 * HOUR)).toBe(false);
  expect(marked()).toBe(false);
  expect(window.localStorage.getItem(STATE_KEY)).toBeNull();
});

it("removes a launch left over with no time against it, instead of asking for the toolbar for ever", async () => {
  const { syncToolbarMark } = await load("");
  window.localStorage.setItem(STATE_KEY, "{}");

  expect(syncToolbarMark(true)).toBe(false);
  expect(marked()).toBe(false);
  expect(window.localStorage.getItem(STATE_KEY)).toBeNull();
});

it("takes the mark away when the toolbar was closed, or the person is no longer one of ours", async () => {
  const { syncToolbarMark } = await load("");
  // biome-ignore lint/suspicious/noDocumentCookie: the mark as an earlier page set it
  document.cookie = "rext-toolbar=1; Path=/";

  // posthog-js removed its kept launch when the toolbar was closed.
  expect(syncToolbarMark(true)).toBe(false);
  expect(marked()).toBe(false);

  // biome-ignore lint/suspicious/noDocumentCookie: the mark again
  document.cookie = "rext-toolbar=1; Path=/";
  window.localStorage.setItem(STATE_KEY, "{}");
  window.localStorage.setItem(UNTIL_KEY, String(Date.now() + HOUR));
  expect(syncToolbarMark(false)).toBe(false);
  expect(marked()).toBe(false);
});

it("asks for the extra load once only, where the browser refuses the mark", async () => {
  const { syncToolbarMark } = await load(LAUNCH);

  expect(syncToolbarMark(true)).toBe(true);
  // The load happened and the mark is gone again (a browser that drops the cookie).
  // biome-ignore lint/suspicious/noDocumentCookie: the browser dropping the mark
  document.cookie = "rext-toolbar=; Max-Age=0; Path=/";
  expect(syncToolbarMark(true)).toBe(false);
});
