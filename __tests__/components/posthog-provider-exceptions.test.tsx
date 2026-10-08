/**
 * Errors nobody caught (rext-control task 894): reported only where the deploy asks for it and
 * the person allows analytics, with the library's piece for it taken from the app's own code, and
 * never with an error's message.
 */

import { act, render, waitFor } from "@testing-library/react";
import { setImpersonating } from "@/lib/analytics";
import { analyticsMode, writeConsent } from "@/lib/analytics-consent";
import { PostHogProvider } from "@/providers/posthog-provider";

const mockPosthog = {
  init: jest.fn(),
  startExceptionAutocapture: jest.fn((_config?: unknown) => {}),
  stopExceptionAutocapture: jest.fn(() => {}),
};
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    init: (...args: unknown[]) => mockPosthog.init(...args),
    startExceptionAutocapture: (config?: unknown) =>
      mockPosthog.startExceptionAutocapture(config),
    stopExceptionAutocapture: () => mockPosthog.stopExceptionAutocapture(),
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
    set_config: jest.fn(),
  },
}));
// The heatmap's piece of the library, and the one that listens for errors: only that each is
// asked for from the app's own code matters here.
jest.mock("posthog-js/dist/dead-clicks-autocapture", () => ({}));
jest.mock("posthog-js/dist/exception-autocapture", () => ({}));
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
jest.mock("@/lib/analytics-exceptions", () => ({
  ...jest.requireActual("@/lib/analytics-exceptions"),
  get EXCEPTIONS_ON() {
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
const listening = () =>
  waitFor(() =>
    expect(mockPosthog.startExceptionAutocapture).toHaveBeenCalledTimes(1),
  );
/** Long enough for the library's piece to have arrived, had it been asked for. */
const settled = () =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

it("listens for errors nobody caught, and not for the console, once its piece has arrived with the app", async () => {
  render(page());
  await listening();

  // Off at the start: nothing on PostHog's side can switch it on, or fetch anything for it.
  expect(mockPosthog.init.mock.calls[0][1]).toMatchObject({
    capture_exceptions: false,
    disable_external_dependency_loading: true,
  });
  expect(mockPosthog.startExceptionAutocapture).toHaveBeenCalledWith({
    capture_unhandled_errors: true,
    capture_unhandled_rejections: true,
    capture_console_errors: false,
  });
});

it("listens for none where the deploy hasn't asked for it", async () => {
  mockSwitch.on = false;
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  await settled();

  expect(mockPosthog.startExceptionAutocapture).not.toHaveBeenCalled();
});

it("listens for none for a person who said no", async () => {
  mode.mockResolvedValue("anonymous");
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  await settled();

  expect(mockPosthog.startExceptionAutocapture).not.toHaveBeenCalled();
});

it("stops listening the moment the person says no", async () => {
  render(page());
  await listening();
  expect(mockPosthog.stopExceptionAutocapture).not.toHaveBeenCalled();

  act(() => writeConsent("denied"));

  expect(mockPosthog.stopExceptionAutocapture).toHaveBeenCalledTimes(1);
});

it("sends an error's report by its class and the kind of its message, never with the message", async () => {
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  const beforeSend = mockPosthog.init.mock.calls[0][1].before_send;

  const sent = beforeSend({
    uuid: "u-1",
    event: "$exception",
    properties: {
      $exception_level: "error",
      $exception_message: "best crm for dentists",
      $exception_list: [
        {
          type: "TypeError",
          value: "best crm for dentists is not a function",
          mechanism: { type: "generic", handled: false },
        },
      ],
    },
  });

  expect(sent.properties).toMatchObject({
    surface: "app",
    source: "client",
    $exception_level: "error",
    $exception_list: [
      {
        type: "TypeError",
        value: "not_a_function",
        mechanism: { type: "generic", handled: false },
      },
    ],
  });
  expect(JSON.stringify(sent)).not.toContain("best crm for dentists");
});

it("sends no report at all while an admin acts as a customer", async () => {
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  const beforeSend = mockPosthog.init.mock.calls[0][1].before_send;
  setImpersonating(true);

  expect(
    beforeSend({
      uuid: "u-2",
      event: "$exception",
      properties: {
        $exception_list: [{ type: "Error", value: "anything" }],
      },
    }),
  ).toBeNull();
});
