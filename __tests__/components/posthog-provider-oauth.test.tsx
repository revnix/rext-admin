/**
 * A Google or GitHub login reaches PostHog itself (C13a), even when the session is there on the
 * first render: the record mounts only once the provider has wired posthog-js into `analytics`, since
 * a child's effect runs before its parent's and an event tracked before then is lost.
 */

import { render, waitFor } from "@testing-library/react";
import { PostHogProvider } from "@/providers/posthog-provider";

const mockCapture = jest.fn();
// The order posthog-js is called in: init, then identify, then the login's event (C13b).
const mockCalls: string[] = [];
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    init: () => mockCalls.push("init"),
    capture: (...args: unknown[]) => {
      mockCalls.push(String(args[0]));
      mockCapture(...args);
    },
    identify: () => mockCalls.push("identify"),
    reset: jest.fn(),
    get_property: jest.fn(),
    onSessionId: jest.fn(),
    opt_in_capturing: jest.fn(),
  },
}));
// Analytics is on for this person (a region that isn't asked first): the provider starts.
jest.mock("@/lib/analytics-consent", () => ({
  ...jest.requireActual("@/lib/analytics-consent"),
  analyticsMode: async () => "full",
}));
jest.mock("posthog-js/react", () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/w/acme",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ workspaceSlug: "acme" }),
}));
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    status: "authenticated",
    data: {
      user: { id: "u1", email: "new@example.com", name: "New" },
      oauthLogin: { provider: "google", isNew: true, at: 2001 },
    },
  }),
}));

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
beforeAll(() => {
  process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
});
afterAll(() => {
  process.env.NEXT_PUBLIC_POSTHOG_KEY = key;
});

it("sends the sign-up to PostHog when the session is ready on the first render", async () => {
  render(
    <PostHogProvider>
      <p>The page</p>
    </PostHogProvider>,
  );
  await waitFor(() =>
    expect(mockCapture).toHaveBeenCalledWith(
      "user_signed_up",
      expect.objectContaining({ method: "google" }),
    ),
  );
});

it("identifies the person after init and before the login's event, so it isn't anonymous", () => {
  // The first test's render recorded this login already; the order is what this one checks.
  expect(mockCalls.indexOf("init")).toBeLessThan(mockCalls.indexOf("identify"));
  expect(mockCalls.indexOf("identify")).toBeLessThan(
    mockCalls.indexOf("user_signed_up"),
  );
});

it("captures the first page view after init, not before (when posthog-js would drop it)", () => {
  expect(mockCalls.indexOf("init")).toBeLessThan(
    mockCalls.indexOf("$pageview"),
  );
  expect(mockCalls).toContain("$pageview");
});
