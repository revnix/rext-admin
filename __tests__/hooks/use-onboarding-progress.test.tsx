import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useOnboardingProgress } from "@/hooks/use-onboarding-progress";

jest.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => ({ user: { id: "user-1" } }),
}));

jest.mock("@/stores/workspace", () => ({
  useWorkspaceStore: (select: (state: unknown) => unknown) =>
    select({ workspaceList: [{ id: "ws-1" }] }),
}));

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    workspaces: {
      getStats: jest.fn(async () => ({ content_count: 2, members_count: 1 })),
    },
  },
}));

jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));

const track = jest.requireMock("@/lib/analytics").analytics.track as jest.Mock;
const TRACKED_KEY = "onboarding-tracked-milestones-ws-1";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function completions() {
  return track.mock.calls.filter(([event]) => event === "onboarding_completed");
}

async function mount() {
  const view = renderHook(() => useOnboardingProgress("ws-1"), { wrapper });
  await waitFor(() => expect(view.result.current.isComplete).toBe(true));
  await waitFor(() =>
    expect(JSON.parse(localStorage.getItem(TRACKED_KEY) ?? "[]")).toContain(
      "content",
    ),
  );
  return view;
}

describe("useOnboardingProgress completion event", () => {
  beforeEach(() => {
    localStorage.clear();
    track.mockClear();
  });

  it("reports completion once for a user the retired topic milestone held back", async () => {
    localStorage.setItem(
      TRACKED_KEY,
      JSON.stringify(["account", "workspace", "content"]),
    );

    const first = await mount();
    await waitFor(() => expect(completions()).toHaveLength(1));
    first.unmount();

    await mount();
    expect(completions()).toHaveLength(1);
  });

  it("does not report again for a user who completed with the topic milestone", async () => {
    localStorage.setItem(
      TRACKED_KEY,
      JSON.stringify(["account", "workspace", "topic", "content"]),
    );

    await mount();
    expect(completions()).toHaveLength(0);
  });

  it("reports the milestones and the completion for a new user", async () => {
    await mount();
    await waitFor(() => expect(completions()).toHaveLength(1));
    const milestones = track.mock.calls
      .filter(([event]) => event === "onboarding_milestone_completed")
      .map(([, props]) => props.milestone_id);
    expect(milestones).toEqual(["account", "workspace", "content"]);
  });
});
