/**
 * The analytics provider follows the person's answer (rext-control task 712): nothing starts
 * before it is known; a yes brings everything, with their identity; a no leaves page routes only,
 * with no identity and none of our own events.
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { analytics } from "@/lib/analytics";
import { analyticsMode, writeConsent } from "@/lib/analytics-consent";
import { PostHogProvider } from "@/providers/posthog-provider";

const mockPosthog = {
  init: jest.fn(),
  capture: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  opt_in_capturing: jest.fn(),
  opt_out_capturing: jest.fn(),
  get_property: jest.fn(),
  onSessionId: jest.fn(),
};
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
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
  },
}));
jest.mock("posthog-js/react", () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/w/acme/content",
  useSearchParams: () => new URLSearchParams("q=mary"),
}));
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    status: "authenticated",
    data: { user: { id: "u1", email: "mary@example.com", name: "Mary" } },
  }),
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
  // The choice is also sent to the app's own server.
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true }) as unknown as typeof fetch;
});

function renderProvider() {
  return render(
    <PostHogProvider>
      <p>The page</p>
    </PostHogProvider>,
  );
}

const pageViews = () =>
  mockPosthog.capture.mock.calls.filter(([event]) => event === "$pageview");
const question = () =>
  screen.queryByRole("heading", { name: "May we measure how you use Rext?" });

describe("where the person is asked first, and hasn't answered", () => {
  beforeEach(() => mode.mockResolvedValue("wait"));

  it("sends nothing and asks", async () => {
    renderProvider();

    expect(
      await screen.findByRole("heading", { name: /May we measure/ }),
    ).toBeTruthy();
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
    expect(mockPosthog.identify).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ email: "mary@example.com" }),
    );
    expect(question()).toBeNull();
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
      $current_url: `${window.origin}/w/:workspace/content`,
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
        properties: { $current_url: "https://app.rext.ai/w/acme" },
      }).properties.$current_url,
    ).toBe("https://app.rext.ai/w/:workspace");
  });
});

describe("after a no given earlier", () => {
  it("stays anonymous without asking again", async () => {
    mode.mockResolvedValue("anonymous");
    renderProvider();

    await waitFor(() => expect(pageViews()).toHaveLength(1));
    expect(mockPosthog.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(mockPosthog.identify).not.toHaveBeenCalled();
    expect(question()).toBeNull();
  });
});
