/**
 * Session recording (rext-control task 712, step E): off unless the deploy switches it on, and
 * then only for a person who allows analytics, is signed in, is on one of the app's working pages
 * and is not being acted as. It stops the moment one of those ends.
 */

import { act, render, waitFor } from "@testing-library/react";
import { setImpersonating } from "@/lib/analytics";
import { analyticsMode, writeConsent } from "@/lib/analytics-consent";
import { loadWords } from "@/lib/analytics-recording";
import { PostHogProvider } from "@/providers/posthog-provider";

let mockStarted = false;
const mockPosthog = {
  init: jest.fn(),
  startSessionRecording: jest.fn(() => {
    mockStarted = true;
  }),
  stopSessionRecording: jest.fn(() => {
    mockStarted = false;
  }),
};
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    init: (...args: unknown[]) => mockPosthog.init(...args),
    startSessionRecording: () => mockPosthog.startSessionRecording(),
    stopSessionRecording: () => mockPosthog.stopSessionRecording(),
    sessionRecordingStarted: () => mockStarted,
    capture: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    opt_in_capturing: jest.fn(),
    opt_out_capturing: jest.fn(),
    get_property: jest.fn(),
    onSessionId: jest.fn(),
    register: jest.fn(),
    unregister: jest.fn(),
    setPersonProperties: jest.fn(),
  },
}));
// The recorder's own code: only that it is asked for matters here.
jest.mock("posthog-js/dist/lazy-recorder", () => ({}));
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
// The page and the session, as a test sets them.
const mockPage = { path: "/w/acme/content", status: "authenticated" };
jest.mock("next/navigation", () => ({
  usePathname: () => mockPage.path,
  useSearchParams: () => new URLSearchParams(""),
  useParams: () => ({}),
}));
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    status: mockPage.status,
    data:
      mockPage.status === "authenticated"
        ? { user: { id: "u1", email: "mary@example.com", role: "owner" } }
        : null,
  }),
}));
jest.mock("@/lib/analytics-consent", () => ({
  ...jest.requireActual("@/lib/analytics-consent"),
  analyticsMode: jest.fn(),
}));
// The deploy's switch, and the list of the app's own words.
const mockSwitch = { on: true };
jest.mock("@/lib/analytics-recording", () => ({
  ...jest.requireActual("@/lib/analytics-recording"),
  get RECORDING_ON() {
    return mockSwitch.on;
  },
  loadWords: jest.fn(),
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
  mockStarted = false;
  mockSwitch.on = true;
  mockPage.path = "/w/acme/content";
  mockPage.status = "authenticated";
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
const started = () =>
  waitFor(() =>
    expect(mockPosthog.startSessionRecording).toHaveBeenCalledTimes(1),
  );
/** Long enough for the recorder's code and the list to have arrived, had they been asked for. */
const settled = () =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

it("records nothing where the deploy hasn't switched it on, and fetches nothing for it", async () => {
  mockSwitch.on = false;
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  await settled();

  expect(words).not.toHaveBeenCalled();
  expect(mockPosthog.startSessionRecording).not.toHaveBeenCalled();
});

it("can't be started from PostHog's side, and holds only what the app allows", async () => {
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());

  const options = mockPosthog.init.mock.calls[0][1];
  expect(options).toMatchObject({
    disable_session_recording: true,
    enable_recording_console_log: false,
    disable_external_dependency_loading: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "*",
      recordCrossOriginIframes: false,
      recordHeaders: false,
      recordBody: false,
    },
  });
  expect(options.session_recording.maskTextFn("Mary", null)).toBe("****");
});

it("starts for a signed-in person who allows analytics, on a working page, once the list is there", async () => {
  render(page());
  await started();

  expect(words).toHaveBeenCalledTimes(1);
});

it("records nothing without the list of the app's own words", async () => {
  words.mockResolvedValue(false);
  render(page());
  await waitFor(() => expect(words).toHaveBeenCalled());
  await settled();

  expect(mockPosthog.startSessionRecording).not.toHaveBeenCalled();
});

it("records nothing for a person who said no, and fetches nothing for it", async () => {
  mode.mockResolvedValue("anonymous");
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  await settled();

  expect(words).not.toHaveBeenCalled();
  expect(mockPosthog.startSessionRecording).not.toHaveBeenCalled();
});

it.each(["/login", "/checkout", "/admin/users", "/reset-password"])(
  "records nothing on %s",
  async (path) => {
    mockPage.path = path;
    render(page());
    await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
    await settled();

    expect(words).not.toHaveBeenCalled();
    expect(mockPosthog.startSessionRecording).not.toHaveBeenCalled();
  },
);

it("records nothing for someone who isn't signed in", async () => {
  mockPage.status = "unauthenticated";
  mockPage.path = "/pricing";
  render(page());
  await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
  await settled();

  expect(mockPosthog.startSessionRecording).not.toHaveBeenCalled();
});

it("stops on a page that isn't recorded, and starts again on one that is", async () => {
  const view = render(page());
  await started();

  mockPage.path = "/checkout";
  view.rerender(page());
  expect(mockPosthog.stopSessionRecording).toHaveBeenCalledTimes(1);

  mockPage.path = "/settings/data";
  view.rerender(page());
  expect(mockPosthog.startSessionRecording).toHaveBeenCalledTimes(2);
});

it("stops the moment an admin starts acting as the person", async () => {
  render(page());
  await started();

  act(() => setImpersonating(true));

  expect(mockPosthog.stopSessionRecording).toHaveBeenCalledTimes(1);
  expect(mockStarted).toBe(false);
});

it("stops the moment the person says no", async () => {
  render(page());
  await started();

  act(() => writeConsent("denied"));

  expect(mockPosthog.stopSessionRecording).toHaveBeenCalled();
  expect(mockStarted).toBe(false);
});

it("stops when the person signs out", async () => {
  const view = render(page());
  await started();

  mockPage.status = "unauthenticated";
  mockPage.path = "/login";
  view.rerender(page());

  expect(mockPosthog.stopSessionRecording).toHaveBeenCalledTimes(1);
});
