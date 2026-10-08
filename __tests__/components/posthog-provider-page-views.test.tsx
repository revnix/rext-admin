/**
 * Page views and what a person types into a list's search (rext-control#942): the search lives
 * in the page's address, the address leaves with the text replaced, and the same page under the
 * same address is one view, not one for every key pressed.
 */

import { render, waitFor } from "@testing-library/react";
import { setImpersonating } from "@/lib/analytics";
import { analyticsMode } from "@/lib/analytics-consent";
import { PostHogProvider } from "@/providers/posthog-provider";

const mockPosthog = {
  init: jest.fn(),
  capture: jest.fn((_event: string, _properties?: unknown) => {}),
};
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    init: (...args: unknown[]) => mockPosthog.init(...args),
    capture: (event: string, properties?: unknown) =>
      mockPosthog.capture(event, properties),
    startSessionRecording: jest.fn(),
    stopSessionRecording: jest.fn(),
    sessionRecordingStarted: () => false,
    identify: jest.fn(),
    reset: jest.fn(),
    opt_in_capturing: jest.fn(),
    opt_out_capturing: jest.fn(),
    get_property: jest.fn(),
    get_session_id: () => "session-1",
    onSessionId: () => () => {},
    register: jest.fn(),
    unregister: jest.fn(),
    setPersonProperties: jest.fn(),
    set_config: jest.fn(),
  },
}));
// The heatmap's piece of the library: only that it is asked for matters here.
jest.mock("posthog-js/dist/dead-clicks-autocapture", () => ({}));
jest.mock("posthog-js/react", () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
jest.mock("@/stores/subscription-store", () => ({
  useSubscriptionStore: Object.assign(
    (selector: (state: unknown) => unknown) => selector({ subscription: null }),
    { getState: () => ({ subscription: null }) },
  ),
}));
jest.mock("@/stores/workspace", () => ({
  useWorkspaceStore: (selector: (state: unknown) => unknown) =>
    selector({ currentWorkspace: null, workspaceList: [] }),
}));
jest.mock("@/stores/workspace/use-workspace-context-store", () => ({
  useWorkspaceContextStore: {
    getState: () => ({ currentWorkspace: null, workspaceList: [] }),
  },
}));
// The page on screen and its address's query, as a test sets them.
const mockPage = { path: "/w/acme/content", search: "" };
jest.mock("next/navigation", () => ({
  usePathname: () => mockPage.path,
  useSearchParams: () => new URLSearchParams(mockPage.search),
  useParams: () => ({}),
}));
// Nobody signed in: a view doesn't wait for a workspace or a plan.
jest.mock("next-auth/react", () => ({
  useSession: () => ({ status: "unauthenticated", data: null }),
}));
jest.mock("@/lib/analytics-consent", () => ({
  ...jest.requireActual("@/lib/analytics-consent"),
  analyticsMode: jest.fn(),
}));
jest.mock("@/lib/analytics-toolbar", () => ({
  ...jest.requireActual("@/lib/analytics-toolbar"),
  syncToolbarMark: jest.fn(() => false),
}));

const mode = analyticsMode as jest.MockedFunction<typeof analyticsMode>;
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

beforeAll(() => {
  process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
});
afterAll(() => {
  process.env.NEXT_PUBLIC_POSTHOG_KEY = key;
});
beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  mockPage.path = "/w/acme/content";
  mockPage.search = "";
  mode.mockResolvedValue("full");
  setImpersonating(false);
});

const page = () => (
  <PostHogProvider>
    <p>The page</p>
  </PostHogProvider>
);
/** The addresses of the page views sent so far, in order. */
const viewed = () =>
  mockPosthog.capture.mock.calls
    .filter(([event]) => event === "$pageview")
    .map(
      ([, properties]) => (properties as { $current_url: string }).$current_url,
    );

it("counts a search typed into a list as one more view of the page, not one for every key", async () => {
  const view = render(page());
  await waitFor(() => expect(viewed()).toHaveLength(1));

  for (const typed of ["m", "ma", "mar", "mary", "mary s"]) {
    mockPage.search = `q=${encodeURIComponent(typed)}`;
    view.rerender(page());
  }
  // The box emptied again.
  mockPage.search = "";
  view.rerender(page());

  expect(viewed()).toEqual([
    `${window.origin}/w/acme/content`,
    `${window.origin}/w/acme/content?q=redacted`,
    `${window.origin}/w/acme/content`,
  ]);
  expect(JSON.stringify(mockPosthog.capture.mock.calls)).not.toContain("mar");
});

it("doesn't count a page drawn again under the same address, and does count the next page", async () => {
  const view = render(page());
  await waitFor(() => expect(viewed()).toHaveLength(1));

  view.rerender(page());
  view.rerender(page());
  expect(viewed()).toHaveLength(1);

  mockPage.path = "/settings/plan";
  view.rerender(page());
  mockPage.path = "/w/acme/content";
  view.rerender(page());

  expect(viewed()).toEqual([
    `${window.origin}/w/acme/content`,
    `${window.origin}/settings/plan`,
    `${window.origin}/w/acme/content`,
  ]);
});

it("sends a filter's own word as it is, and a keyword's page with a star where the keyword stood", async () => {
  mockPage.path = "/w/acme/keywords/best%20crm%20for%20dentists";
  mockPage.search = "status=draft&library=best%20crm%20for%20dentists";
  render(page());
  await waitFor(() => expect(viewed()).toHaveLength(1));

  expect(viewed()).toEqual([
    `${window.origin}/w/acme/keywords/*?status=draft&library=redacted`,
  ]);
});
