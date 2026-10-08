/**
 * How fast a page loaded and answered (rext-control task 898): measured only where the deploy
 * asks for it and the person allows analytics, with the library's piece for it taken from the
 * app's own code, and sent as numbers with the address's shape.
 */

import { act, render, waitFor } from "@testing-library/react";
import { setImpersonating } from "@/lib/analytics";
import { analyticsMode } from "@/lib/analytics-consent";
import { PostHogProvider } from "@/providers/posthog-provider";

const mockPosthog = {
  init: jest.fn(),
  set_config: jest.fn((_config: unknown) => {}),
  startIfEnabled: jest.fn(() => {}),
};
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    init: (...args: unknown[]) => mockPosthog.init(...args),
    webVitalsAutocapture: {
      startIfEnabled: () => mockPosthog.startIfEnabled(),
    },
    startSessionRecording: jest.fn(),
    stopSessionRecording: jest.fn(),
    sessionRecordingStarted: () => false,
    capture: jest.fn(),
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
    set_config: (config: unknown) => mockPosthog.set_config(config),
  },
}));
// The heatmap's piece of the library, and the one that measures a page: only that each is asked
// for from the app's own code matters here.
jest.mock("posthog-js/dist/dead-clicks-autocapture", () => ({}));
jest.mock("posthog-js/dist/web-vitals", () => ({}));
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
jest.mock("next/navigation", () => ({
  usePathname: () => "/w/acme/content",
  useSearchParams: () => new URLSearchParams(""),
  useParams: () => ({}),
}));
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    status: "authenticated",
    data: { user: { id: "u1", email: "mary@example.com", role: "owner" } },
  }),
}));
jest.mock("@/lib/analytics-consent", () => ({
  ...jest.requireActual("@/lib/analytics-consent"),
  analyticsMode: jest.fn(),
}));
// The deploy's switch.
const mockSwitch = { on: true };
jest.mock("@/lib/analytics-web-vitals", () => ({
  ...jest.requireActual("@/lib/analytics-web-vitals"),
  get WEB_VITALS_ON() {
    return mockSwitch.on;
  },
}));
jest.mock("@/lib/analytics-toolbar", () => ({
  ...jest.requireActual("@/lib/analytics-toolbar"),
  syncToolbarMark: jest.fn(() => false),
}));

const mode = analyticsMode as jest.MockedFunction<typeof analyticsMode>;
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const realFetch = global.fetch;

beforeAll(() => {
  process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
});
afterAll(() => {
  process.env.NEXT_PUBLIC_POSTHOG_KEY = key;
  global.fetch = realFetch;
});
beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  mockSwitch.on = true;
  mode.mockResolvedValue("full");
  setImpersonating(false);
  // A choice is also sent to the app's own server.
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true }) as unknown as typeof fetch;
});

const page = () => (
  <PostHogProvider>
    <p>The page</p>
  </PostHogProvider>
);
const ASKED = {
  capture_performance: { web_vitals: true, web_vitals_attribution: false },
};
const measuring = () =>
  waitFor(() => expect(mockPosthog.startIfEnabled).toHaveBeenCalledTimes(1));
/** Long enough for the library's piece to have arrived, had it been asked for. */
const settled = () =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

it("measures a page's speed, without naming an element or a file, once its piece has arrived with the app", async () => {
  render(page());
  await measuring();

  // Off at the start: nothing on PostHog's side can switch it on, or fetch anything for it.
  expect(mockPosthog.init.mock.calls[0][1]).toMatchObject({
    capture_performance: { web_vitals: false },
    disable_external_dependency_loading: true,
  });
  // Asked for first, started second: the library doesn't start it on being asked.
  expect(mockPosthog.set_config).toHaveBeenCalledWith(ASKED);
  const asked = mockPosthog.set_config.mock.calls.findIndex(
    ([config]) => JSON.stringify(config) === JSON.stringify(ASKED),
  );
  expect(mockPosthog.set_config.mock.invocationCallOrder[asked]).toBeLessThan(
    mockPosthog.startIfEnabled.mock.invocationCallOrder[0],
  );
});

it("measures nothing where the deploy hasn't asked for it", async () => {
  mockSwitch.on = false;
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  await settled();

  expect(mockPosthog.startIfEnabled).not.toHaveBeenCalled();
  expect(mockPosthog.set_config).not.toHaveBeenCalledWith(ASKED);
});

it("measures nothing for a person who said no", async () => {
  mode.mockResolvedValue("anonymous");
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  await settled();

  expect(mockPosthog.startIfEnabled).not.toHaveBeenCalled();
});

it("sends a page's measures as numbers with the address's shape, and nothing else of them", async () => {
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  const beforeSend = mockPosthog.init.mock.calls[0][1].before_send;

  const sent = beforeSend({
    uuid: "u-1",
    event: "$web_vitals",
    properties: {
      $current_url: "https://app.rext.ai/w/acme-dental/content/6f1c",
      $web_vitals_LCP_value: 1834.5,
      $web_vitals_LCP_event: {
        name: "LCP",
        value: 1834.5,
        rating: "good",
        $current_url:
          "https://app.rext.ai/w/acme-dental/content/6f1c?token=entry-secret",
        attribution: { url: "https://cdn.example/cover-of-acme.png" },
      },
    },
  });

  expect(sent.properties).toMatchObject({
    surface: "app",
    source: "client",
    route: "/w/*/content/*",
    $web_vitals_LCP_value: 1834.5,
    $web_vitals_LCP_event: { name: "LCP", value: 1834.5, rating: "good" },
  });
  expect(Object.keys(sent.properties.$web_vitals_LCP_event).sort()).toEqual([
    "name",
    "rating",
    "value",
  ]);
  const whole = JSON.stringify(sent);
  expect(whole).not.toContain("entry-secret");
  expect(whole).not.toContain("cover-of-acme");
});

it("sends no measure at all while an admin acts as a customer", async () => {
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  const beforeSend = mockPosthog.init.mock.calls[0][1].before_send;
  setImpersonating(true);

  expect(
    beforeSend({
      uuid: "u-2",
      event: "$web_vitals",
      properties: { $web_vitals_FCP_value: 420 },
    }),
  ).toBeNull();
});
