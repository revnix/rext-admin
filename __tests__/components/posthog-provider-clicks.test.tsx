/**
 * Clicks on the app's controls (rext-control task 898): reported only where the deploy asks for
 * it and the person allows analytics, with no text and no attribute taken from the page, and
 * switched off again on a no.
 */

import { act, render, waitFor } from "@testing-library/react";
import { setImpersonating } from "@/lib/analytics";
import { analyticsMode, writeConsent } from "@/lib/analytics-consent";
import { loadWords } from "@/lib/analytics-recording";
import { PostHogProvider } from "@/providers/posthog-provider";

const mockPosthog = {
  init: jest.fn(),
  set_config: jest.fn((_config: unknown) => {}),
};
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    init: (...args: unknown[]) => mockPosthog.init(...args),
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
// The piece of the library that tells a click nothing answered, which the heatmap asks for too:
// only that it is asked for from the app's own code matters here.
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
jest.mock("@/lib/analytics-clicks", () => ({
  ...jest.requireActual("@/lib/analytics-clicks"),
  get CLICKS_ON() {
    return mockSwitch.on;
  },
}));
// The list of the app's own words: only that it is asked for matters here.
jest.mock("@/lib/analytics-recording", () => ({
  ...jest.requireActual("@/lib/analytics-recording"),
  loadWords: jest.fn(),
}));
jest.mock("@/lib/analytics-toolbar", () => ({
  ...jest.requireActual("@/lib/analytics-toolbar"),
  syncToolbarMark: jest.fn(() => false),
}));

const mode = analyticsMode as jest.MockedFunction<typeof analyticsMode>;
const words = loadWords as jest.MockedFunction<typeof loadWords>;
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
  words.mockResolvedValue(true);
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
  autocapture: { dom_event_allowlist: ["click"], capture_copied_text: false },
  rageclick: true,
  capture_dead_clicks: true,
};
const OFF = {
  autocapture: false,
  rageclick: false,
  capture_dead_clicks: false,
};
const PATH =
  'span:nth-child="1"nth-of-type="1";button:nth-child="2"nth-of-type="1"';
const capturing = () =>
  waitFor(() => expect(mockPosthog.set_config).toHaveBeenCalledWith(ASKED));
/** Long enough for the list and the library's piece to have arrived, had they been asked for. */
const settled = () =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

it("asks the library for clicks only, once the app's own words have arrived, and for no text of the page", async () => {
  render(page());
  await capturing();

  // Off at the start, and whatever switches it on, nothing is taken from the page for it.
  expect(mockPosthog.init.mock.calls[0][1]).toMatchObject({
    autocapture: false,
    rageclick: false,
    capture_dead_clicks: false,
    mask_all_text: true,
    mask_all_element_attributes: true,
  });
  expect(words).toHaveBeenCalled();
});

it("takes no text of the page for a click even where the deploy hasn't asked for clicks, and asks for none", async () => {
  mockSwitch.on = false;
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  await settled();

  expect(mockPosthog.init.mock.calls[0][1]).toMatchObject({
    autocapture: false,
    mask_all_text: true,
    mask_all_element_attributes: true,
  });
  expect(mockPosthog.set_config).not.toHaveBeenCalledWith(ASKED);
});

it("asks for no clicks for a person who said no", async () => {
  mode.mockResolvedValue("anonymous");
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  await settled();

  expect(mockPosthog.set_config).not.toHaveBeenCalledWith(ASKED);
});

it("switches the clicks off the moment the person says no", async () => {
  render(page());
  await capturing();
  expect(mockPosthog.set_config).not.toHaveBeenCalledWith(OFF);

  act(() => writeConsent("denied"));

  expect(mockPosthog.set_config).toHaveBeenCalledWith(OFF);
});

it("sends a click as its path of tags, and none whose path holds anything of the page", async () => {
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  const beforeSend = mockPosthog.init.mock.calls[0][1].before_send;

  const sent = beforeSend({
    uuid: "u-1",
    event: "$autocapture",
    timestamp: new Date(),
    properties: {
      $event_type: "click",
      $elements_chain: PATH,
      $el_text: "best crm for dentists",
    },
  });

  expect(sent.properties).toMatchObject({
    surface: "app",
    source: "client",
    $event_type: "click",
    $elements_chain: PATH,
    route: "/",
  });
  expect(JSON.stringify(sent)).not.toContain("best crm for dentists");
  expect(
    beforeSend({
      uuid: "u-2",
      event: "$autocapture",
      timestamp: new Date(),
      properties: {
        $elements_chain: 'button:nth-child="1"nth-of-type="1"text="best crm"',
      },
    }),
  ).toBeNull();
  // What a person copied is never a report, whatever asked for it.
  expect(
    beforeSend({
      uuid: "u-3",
      event: "$copy_autocapture",
      timestamp: new Date(),
      properties: { $selected_content: "best crm for dentists" },
    }),
  ).toBeNull();
});

it("sends no click at all while an admin acts as a customer", async () => {
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  const beforeSend = mockPosthog.init.mock.calls[0][1].before_send;
  setImpersonating(true);

  expect(
    beforeSend({
      uuid: "u-4",
      event: "$autocapture",
      timestamp: new Date(),
      properties: { $elements_chain: PATH },
    }),
  ).toBeNull();
});
