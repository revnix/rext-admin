/**
 * The analytics provider follows the person's answer (rext-control task 712): nothing starts
 * before it is known; a yes brings everything, with their identity; a no leaves page routes only,
 * with no identity and none of our own events.
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { analytics, setImpersonating } from "@/lib/analytics";
import { analyticsMode, writeConsent } from "@/lib/analytics-consent";
import { AnalyticsConsentPrompt } from "@/components/privacy/analytics-consent-prompt";
import { PostHogProvider } from "@/providers/posthog-provider";

const mockPosthog = {
  sessionRecordingStarted: jest.fn(() => false),
  startSessionRecording: jest.fn(),
  stopSessionRecording: jest.fn(),
  init: jest.fn(),
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
};
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    sessionRecordingStarted: () => mockPosthog.sessionRecordingStarted(),
    startSessionRecording: () => mockPosthog.startSessionRecording(),
    stopSessionRecording: () => mockPosthog.stopSessionRecording(),
    init: (...args: unknown[]) => mockPosthog.init(...args),
    capture: (...args: unknown[]) => mockPosthog.capture(...args),
    identify: (...args: unknown[]) => mockPosthog.identify(...args),
    reset: (...args: unknown[]) => mockPosthog.reset(...args),
    opt_in_capturing: (...args: unknown[]) =>
      mockPosthog.opt_in_capturing(...args),
    opt_out_capturing: (...args: unknown[]) =>
      mockPosthog.opt_out_capturing(...args),
    get_property: (...args: unknown[]) => mockPosthog.get_property(...args),
    onSessionId: (...args: unknown[]) => mockPosthog.onSessionId(...args),
    register: (...args: unknown[]) => mockPosthog.register(...args),
    unregister: (...args: unknown[]) => mockPosthog.unregister(...args),
    setPersonProperties: (...args: unknown[]) =>
      mockPosthog.setPersonProperties(...args),
    set_config: jest.fn(),
  },
}));
// The heatmap's piece of the library: only that it is asked for matters here.
jest.mock("posthog-js/dist/dead-clicks-autocapture", () => ({}));
const mockSubscriptionState = {
  subscription: {
    subscription: {
      plan_name: "growth",
      status: "active",
      billing_period: "monthly",
      trial_end_date: null,
    },
  },
};
jest.mock("@/stores/subscription-store", () => ({
  useSubscriptionStore: Object.assign(
    (selector: (state: unknown) => unknown) => selector(mockSubscriptionState),
    { getState: () => mockSubscriptionState },
  ),
}));
// The app's memory of the workspace last opened; a test may point it elsewhere.
const mockWorkspaceState = {
  currentWorkspace: { id: "ws-1", slug: "acme" },
  workspaceList: [{}, {}],
};
jest.mock("@/stores/workspace", () => ({
  useWorkspaceStore: (selector: (state: unknown) => unknown) =>
    selector(mockWorkspaceState),
}));
jest.mock("@/stores/workspace/use-workspace-context-store", () => ({
  useWorkspaceContextStore: { getState: () => mockWorkspaceState },
}));
jest.mock("posthog-js/react", () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
// The page on screen; a test may move to another.
const mockRoute = { path: "/w/acme/content" };
jest.mock("next/navigation", () => ({
  usePathname: () => mockRoute.path,
  useSearchParams: () => new URLSearchParams("q=mary"),
  useParams: () => ({ workspaceSlug: "acme" }),
}));
const mockUser = {
  id: "u1",
  email: "mary@example.com",
  name: "Mary",
  role: "owner",
};
jest.mock("next-auth/react", () => ({
  useSession: () => ({ status: "authenticated", data: { user: mockUser } }),
}));
jest.mock("@/lib/analytics-consent", () => ({
  ...jest.requireActual("@/lib/analytics-consent"),
  analyticsMode: jest.fn(),
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
  mockUser.id = "u1";
  mockRoute.path = "/w/acme/content";
  // The choice is also sent to the app's own server.
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true }) as unknown as typeof fetch;
});

function renderProvider() {
  return render(
    <PostHogProvider>
      {/* The shell shows the question; the provider acts on the answer. */}
      <AnalyticsConsentPrompt />
      <p>The page</p>
    </PostHogProvider>,
  );
}

const pageViews = () =>
  mockPosthog.capture.mock.calls.filter(([event]) => event === "$pageview");
const question = () => screen.queryByText("May we measure how you use Rext?");

describe("where the person is asked first, and hasn't answered", () => {
  beforeEach(() => mode.mockResolvedValue("wait"));

  it("sends nothing and asks", async () => {
    renderProvider();

    expect(await screen.findByText(/May we measure/)).toBeTruthy();
    expect(mockPosthog.init).not.toHaveBeenCalled();
    expect(mockPosthog.capture).not.toHaveBeenCalled();
    expect(mockPosthog.identify).not.toHaveBeenCalled();
  });

  it("starts everything on Allow, with the person's identity, and stops asking", async () => {
    renderProvider();
    await userEvent.click(await screen.findByRole("button", { name: "Allow" }));

    await waitFor(() => expect(mockPosthog.identify).toHaveBeenCalled());
    expect(mockPosthog.init).toHaveBeenCalledTimes(1);
    // An explicit yes is counted: no option that silences the opt-in's own event.
    expect(mockPosthog.opt_in_capturing).toHaveBeenCalledWith(undefined);
    // By the account's id, with the role: never the email or the name.
    expect(mockPosthog.identify).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ role: "owner" }),
    );
    const identified = JSON.stringify(mockPosthog.identify.mock.calls);
    expect(identified).not.toContain("mary@example.com");
    expect(identified).not.toContain("Mary");
    expect(question()).toBeNull();
  });

  it("sends what was done while it asked with the plan and the role, like any other event", async () => {
    renderProvider();
    const allow = await screen.findByRole("button", { name: "Allow" });
    analytics.track("user_signed_in", { method: "credentials" });

    await userEvent.click(allow);

    await waitFor(() =>
      expect(mockPosthog.capture).toHaveBeenCalledWith("user_signed_in", {
        method: "credentials",
      }),
    );
    const held = mockPosthog.capture.mock.calls.findIndex(
      ([event]) => event === "user_signed_in",
    );
    const planSet = mockPosthog.register.mock.calls.findIndex(
      ([properties]) => properties.plan === "growth",
    );
    expect(planSet).toBeGreaterThanOrEqual(0);
    expect(mockPosthog.register.mock.invocationCallOrder[planSet]).toBeLessThan(
      mockPosthog.capture.mock.invocationCallOrder[held],
    );
  });

  it("counts page routes only on No thanks: no identity, nothing of whose page it is", async () => {
    renderProvider();
    await userEvent.click(
      await screen.findByRole("button", { name: "No thanks" }),
    );

    await waitFor(() => expect(pageViews()).toHaveLength(1));
    expect(mockPosthog.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(mockPosthog.opt_in_capturing).not.toHaveBeenCalled();
    expect(mockPosthog.identify).not.toHaveBeenCalled();
    expect(pageViews()[0][1]).toEqual({
      $current_url: `${window.origin}/w/:workspaceSlug/content`,
    });
    expect(question()).toBeNull();
  });
});

describe("where analytics is on unless switched off", () => {
  beforeEach(() => mode.mockResolvedValue("full"));

  it("starts without asking, and without counting an opt-in nobody gave", async () => {
    renderProvider();

    await waitFor(() => expect(mockPosthog.identify).toHaveBeenCalled());
    expect(mockPosthog.opt_in_capturing).toHaveBeenCalledWith({
      captureEventName: false,
    });
    expect(pageViews()[0][1]).toEqual({
      $current_url: `${window.origin}/w/acme/content?q=mary`,
    });
    expect(question()).toBeNull();
  });

  it("decides in code what the PostHog project's switches can't: no heatmaps yet, element text never", async () => {
    renderProvider();
    await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());

    expect(mockPosthog.init.mock.calls[0][1]).toMatchObject({
      autocapture: false,
      capture_heatmaps: false,
      rageclick: false,
      capture_dead_clicks: false,
      disable_session_recording: true,
    });
  });

  it("loads no code from PostHog's servers: the project's settings are read as data", async () => {
    renderProvider();
    await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());

    expect(mockPosthog.init.mock.calls[0][1]).toMatchObject({
      disable_external_dependency_loading: true,
    });
  });

  it("puts the workspace, the plan and the role on every event, and the plan on the person", async () => {
    renderProvider();
    await waitFor(() => expect(mockPosthog.identify).toHaveBeenCalled());

    const registered = Object.assign(
      {},
      ...mockPosthog.register.mock.calls.map(([properties]) => properties),
    );
    expect(registered).toEqual({
      workspace_id: "ws-1",
      role: "owner",
      plan: "growth",
      plan_status: "active",
      billing_period: "monthly",
    });
    // The person's properties go once, together, after they have settled.
    await waitFor(
      () => expect(mockPosthog.setPersonProperties).toHaveBeenCalledTimes(1),
      { timeout: 4000 },
    );
    expect(mockPosthog.setPersonProperties).toHaveBeenCalledWith({
      plan: "growth",
      plan_status: "active",
      billing_period: "monthly",
      trial_ends_at: null,
      workspaces: 2,
    });
  });

  it("holds a page load's first view until the page's workspace is known, and sends it with it", async () => {
    // Right after a sign-in the app still remembers another workspace, or none.
    mockWorkspaceState.currentWorkspace = { id: "ws-9", slug: "another" };
    try {
      const view = renderProvider();
      await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 300)));
      expect(pageViews()).toHaveLength(0);

      mockWorkspaceState.currentWorkspace = { id: "ws-1", slug: "acme" };
      view.rerender(
        <PostHogProvider>
          <AnalyticsConsentPrompt />
          <p>The page</p>
        </PostHogProvider>,
      );

      await waitFor(() => expect(pageViews()).toHaveLength(1));
      const withWorkspace = mockPosthog.register.mock.calls.findIndex(
        ([properties]) => properties.workspace_id === "ws-1",
      );
      expect(withWorkspace).toBeGreaterThan(-1);
      expect(
        mockPosthog.register.mock.invocationCallOrder[withWorkspace],
      ).toBeLessThan(
        mockPosthog.capture.mock.invocationCallOrder[
          mockPosthog.capture.mock.calls.findIndex(
            ([event]) => event === "$pageview",
          )
        ],
      );
    } finally {
      mockWorkspaceState.currentWorkspace = { id: "ws-1", slug: "acme" };
    }
  });

  it("sends the first view without a workspace when it isn't known in time, never another's", async () => {
    mockWorkspaceState.currentWorkspace = { id: "ws-9", slug: "another" };
    try {
      renderProvider();
      await waitFor(() => expect(pageViews()).toHaveLength(1), {
        timeout: 4500,
      });

      const registered = Object.assign(
        {},
        ...mockPosthog.register.mock.calls.map(([properties]) => properties),
      );
      expect(registered).not.toHaveProperty("workspace_id");
      expect(mockPosthog.unregister).toHaveBeenCalledWith("workspace_id");
    } finally {
      mockWorkspaceState.currentWorkspace = { id: "ws-1", slug: "acme" };
    }
  }, 8000);

  it("still sends a waiting first view when the person leaves before the workspace arrives", async () => {
    mockWorkspaceState.currentWorkspace = { id: "ws-9", slug: "another" };
    try {
      renderProvider();
      await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 200)));
      expect(pageViews()).toHaveLength(0);

      act(() => {
        window.dispatchEvent(new Event("pagehide"));
      });

      expect(pageViews()).toEqual([
        [
          "$pageview",
          { $current_url: "http://localhost/w/acme/content?q=mary" },
        ],
      ]);
      // Once only: the wait running out afterwards doesn't send it again.
      await act(
        () => new Promise<void>((resolve) => setTimeout(resolve, 3300)),
      );
      expect(pageViews()).toHaveLength(1);
    } finally {
      mockWorkspaceState.currentWorkspace = { id: "ws-1", slug: "acme" };
    }
  }, 8000);

  it("sends a waiting first view without a workspace when the person moves on, not with the next page's", async () => {
    mockWorkspaceState.currentWorkspace = { id: "ws-9", slug: "another" };
    try {
      const view = renderProvider();
      await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 200)));
      expect(pageViews()).toHaveLength(0);

      // On to an account page, which has no workspace to wait for.
      mockRoute.path = "/settings/data";
      view.rerender(
        <PostHogProvider>
          <AnalyticsConsentPrompt />
          <p>Settings</p>
        </PostHogProvider>,
      );

      await waitFor(() => expect(pageViews()).toHaveLength(2));
      expect(pageViews()).toEqual([
        [
          "$pageview",
          {
            $current_url: "http://localhost/w/acme/content?q=mary",
            workspace_id: null,
          },
        ],
        [
          "$pageview",
          { $current_url: "http://localhost/settings/data?q=mary" },
        ],
      ]);
    } finally {
      mockWorkspaceState.currentWorkspace = { id: "ws-1", slug: "acme" };
    }
  });

  it("doesn't wait for the views after the first", async () => {
    const view = renderProvider();
    await waitFor(() => expect(pageViews()).toHaveLength(1));

    // Another workspace's page, before the app has switched to it.
    mockWorkspaceState.currentWorkspace = { id: "ws-9", slug: "another" };
    try {
      view.rerender(
        <PostHogProvider>
          <AnalyticsConsentPrompt />
          <p>Another page</p>
        </PostHogProvider>,
      );
      // A render is a new view here (the mocked route hooks answer with new objects each time):
      // it goes out at once, though the app's workspace is not this page's.
      expect(pageViews()).toHaveLength(2);
    } finally {
      mockWorkspaceState.currentWorkspace = { id: "ws-1", slug: "acme" };
    }
  });

  it("doesn't send the person's properties again on the next page load when nothing changed", async () => {
    const first = renderProvider();
    await waitFor(
      () => expect(mockPosthog.setPersonProperties).toHaveBeenCalledTimes(1),
      { timeout: 4000 },
    );
    first.unmount();

    renderProvider();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(mockPosthog.setPersonProperties).toHaveBeenCalledTimes(1);
  });

  it("sends them for the next person in the same browser, though the plan is the same", async () => {
    const first = renderProvider();
    await waitFor(
      () => expect(mockPosthog.setPersonProperties).toHaveBeenCalledTimes(1),
      { timeout: 4000 },
    );
    first.unmount();

    // Another account signs in without the page reloading (an invitation's switch of account).
    mockUser.id = "u2";
    renderProvider();

    await waitFor(
      () => expect(mockPosthog.setPersonProperties).toHaveBeenCalledTimes(2),
      { timeout: 4000 },
    );
  });

  it("forgets what was sent on a sign-out, so the next sign-in sends it again", async () => {
    const first = renderProvider();
    await waitFor(
      () => expect(mockPosthog.setPersonProperties).toHaveBeenCalledTimes(1),
      { timeout: 4000 },
    );

    analytics.reset();
    first.unmount();
    renderProvider();

    await waitFor(
      () => expect(mockPosthog.setPersonProperties).toHaveBeenCalledTimes(2),
      { timeout: 4000 },
    );
  });

  it("sets a page's workspace before that page's view goes out", async () => {
    renderProvider();
    await waitFor(() => expect(pageViews()).toHaveLength(1));

    const order = (mock: jest.Mock) => mock.mock.invocationCallOrder[0];
    expect(order(mockPosthog.register)).toBeLessThan(
      order(mockPosthog.capture),
    );
  });

  it("puts the choice back after a sign-out's reset, which posthog-js forgets it on", async () => {
    renderProvider();
    await waitFor(() => expect(mockPosthog.identify).toHaveBeenCalled());
    expect(mockPosthog.opt_in_capturing).toHaveBeenCalledTimes(1);

    // Signing out resets analytics through the wrapper (lib/logout-utils.ts).
    analytics.reset();

    expect(mockPosthog.reset).toHaveBeenCalledTimes(1);
    expect(mockPosthog.opt_in_capturing).toHaveBeenCalledTimes(2);
    // Put back quietly: nobody chose anything just now.
    expect(mockPosthog.opt_in_capturing).toHaveBeenLastCalledWith({
      captureEventName: false,
    });
  });

  it("drops the identity and our own events the moment the switch goes off", async () => {
    renderProvider();
    await waitFor(() => expect(mockPosthog.identify).toHaveBeenCalled());
    mockPosthog.capture.mockClear();

    act(() => writeConsent("denied"));

    await waitFor(() =>
      expect(mockPosthog.opt_out_capturing).toHaveBeenCalledTimes(1),
    );
    expect(mockPosthog.reset).toHaveBeenCalled();
    analytics.track("keyword_selected", { keyword: "crm" });
    expect(mockPosthog.capture).not.toHaveBeenCalledWith(
      "keyword_selected",
      expect.anything(),
    );
    // posthog-js itself is told the same: only page views pass, as routes.
    const beforeSend = mockPosthog.init.mock.calls[0][1].before_send;
    expect(
      beforeSend({ event: "keyword_selected", properties: {} }),
    ).toBeNull();
    expect(
      beforeSend({
        event: "$pageview",
        properties: {
          $current_url: "https://app.rext.ai/w/acme/content?q=mary",
          $host: "app.rext.ai",
        },
      }).properties.$current_url,
    ).toBe("https://app.rext.ai/w/:workspaceSlug/content");
  });
});

describe("every event that leaves", () => {
  it("says it is the app's, with what it already carried", async () => {
    mode.mockResolvedValue("full");
    renderProvider();
    await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
    const beforeSend = mockPosthog.init.mock.calls[0][1].before_send;

    expect(
      beforeSend({ event: "title_selected", properties: { keyword: "crm" } })
        .properties,
    ).toEqual({
      keyword: "crm",
      surface: "app",
      source: "client",
      // The test's page is a local run's.
      environment: "development",
    });
  });

  it("says so for someone counted without an identity too", async () => {
    mode.mockResolvedValue("anonymous");
    renderProvider();
    await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
    const beforeSend = mockPosthog.init.mock.calls[0][1].before_send;

    expect(
      beforeSend({
        event: "$pageview",
        properties: { $current_url: "https://app.rext.ai/w/acme/content" },
      }).properties,
    ).toMatchObject({ surface: "app", source: "client" });
  });
});

describe("while an admin acts as a customer", () => {
  afterEach(() => setImpersonating(false));

  it("lets nothing leave, a page view and the identification included", async () => {
    mode.mockResolvedValue("full");
    renderProvider();
    await waitFor(() => expect(mockPosthog.init).toHaveBeenCalled());
    const beforeSend = mockPosthog.init.mock.calls[0][1].before_send;
    const pageView = () => ({
      event: "$pageview",
      properties: { $current_url: "https://app.rext.ai/w/acme" },
    });
    expect(beforeSend(pageView())).not.toBeNull();

    setImpersonating(true);

    expect(beforeSend(pageView())).toBeNull();
    expect(beforeSend({ event: "$identify", properties: {} })).toBeNull();
  });
});

describe("after a no given earlier", () => {
  it("stays anonymous without asking again", async () => {
    mode.mockResolvedValue("anonymous");
    renderProvider();

    await waitFor(() => expect(pageViews()).toHaveLength(1));
    // Nothing of the person, their plan or their workspace is attached either.
    expect(mockPosthog.register).not.toHaveBeenCalled();
    expect(mockPosthog.setPersonProperties).not.toHaveBeenCalled();
    expect(mockPosthog.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(mockPosthog.identify).not.toHaveBeenCalled();
    expect(question()).toBeNull();
  });
});
