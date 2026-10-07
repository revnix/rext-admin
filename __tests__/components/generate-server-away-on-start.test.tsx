/**
 * A new keyword's analysis started while the backend is away (a deploy restarts it for about a
 * minute, rext-control task 759) says it couldn't reach the server, and leaves no job in the dock:
 * nothing ran, so nothing failed and nothing is left to poll.
 */
import { TextDecoder, TextEncoder } from "node:util";
import { act, render, screen, waitFor } from "@testing-library/react";
import { FreshGenerationView } from "@/components/generate-content/fresh-generation-view";
import { SERVER_UNREACHABLE_MESSAGE } from "@/lib/api-client/server-away";

// jsdom has neither; the stream reader decodes what the route sends.
Object.assign(globalThis, { TextDecoder, TextEncoder });

const THREAD = "01a117c6-0000-7000-8000-000000000001";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => ({ user: { id: "u1" } }),
}));
jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => ({ workspaceSlug: "acme" }),
}));
jest.mock("@/stores/workspace/use-workspace-context-store", () => ({
  useCurrentWorkspaceId: () => "9f0c2d1e-5b7a-4c3e-8d21-6a4f0b9e1c77",
}));
jest.mock("@/hooks/use-credit-gate", () => ({
  useCreditGate: () => ({
    ensureCredits: () => true,
    ensureCreditsToContinue: () => true,
    openCreditsModal: jest.fn(),
    creditsModal: null,
  }),
}));
jest.mock("@/stores/subscription-store", () => ({
  useSubscriptionStore: () => ({ patchCredits: jest.fn() }),
}));
jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
jest.mock("sonner", () => ({
  toast: { info: jest.fn(), error: jest.fn(), success: jest.fn() },
}));
jest.mock("@/lib/generate-content/background-generation-sync", () => ({
  BACKGROUND_GENERATION_RESTORE_EVENT: "rext:background-generation-restore",
  announceBackgroundGenerationRemoval: jest.fn(),
  requestBackgroundGenerationRestore: jest.fn(),
}));

// The dock's jobs, as the view writes them.
jest.mock("@/stores/background-generation-store", () => {
  const jobs: Array<{ threadId: string; status: string }> = [];
  const state = {
    hasHydrated: true,
    jobs,
    upsertJob: (job: { threadId: string; status: string }) => {
      const at = jobs.findIndex((j) => j.threadId === job.threadId);
      if (at >= 0) jobs[at] = { ...jobs[at], ...job };
      else jobs.push({ ...job });
    },
    updateJob: (threadId: string, patch: { status?: string }) => {
      const job = jobs.find((j) => j.threadId === threadId);
      if (job) Object.assign(job, patch);
    },
    removeJob: (threadId: string) => {
      const at = jobs.findIndex((j) => j.threadId === threadId);
      if (at >= 0) jobs.splice(at, 1);
    },
  };
  const useStore = (selector: (s: typeof state) => unknown) => selector(state);
  useStore.getState = () => state;
  return { useBackgroundGenerationStore: useStore, mockJobs: jobs };
});
const { mockJobs: jobs } = jest.requireMock(
  "@/stores/background-generation-store",
) as { mockJobs: Array<{ threadId: string; status: string }> };

// The steps' own components aren't what's tested: the run's notice and progress are.
jest.mock("@/components/generate-content/run-notice", () => ({
  RunNotice: ({ title, message }: { title: string; message: string }) => (
    <div role="alert">
      <p>{title}</p>
      <p>{message}</p>
    </div>
  ),
}));
jest.mock("@/components/generate-content/run-progress", () => ({
  RunProgress: () => <p>Run in progress</p>,
}));
jest.mock("@/components/layouts", () => ({
  StepColumn: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@/components/generate-content/hero", () => ({
  HeroSection: () => null,
}));
jest.mock("@/components/generate-content/keyword", () => ({
  KeywordForm: () => null,
}));
jest.mock("@/components/generate-content/recent-keywords", () => ({
  RecentKeywords: () => null,
}));
jest.mock("@/components/generate-content/suggestions", () => ({
  SuggestionsSection: () => null,
}));
jest.mock("@/components/generate-content/title-step", () => ({
  TitleStep: () => null,
}));
jest.mock("@/components/generate-content/outline-review", () => ({
  OutlineReview: () => null,
  OutlineRejectSection: () => null,
}));
jest.mock("@/components/generate-content/content", () => ({
  ContentEditor: () => null,
}));
jest.mock("@/components/generate-content/content-type", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/generate-content/workflow-step-indicator", () => ({
  WorkflowStepIndicator: () => null,
}));

// The proxy routes: a new thread, then the backend goes away before its stream starts.
const mockRequested: string[] = [];
jest.mock("@/lib/auth-utils", () => ({
  authenticatedFetch: jest.fn(async (url: string) => {
    mockRequested.push(url);
    if (url === "/api/generate/threads") {
      return { ok: true, json: async () => ({ data: { thread_id: THREAD } }) };
    }
    if (url.endsWith("/stream") || url.includes("/status")) {
      return { ok: false, status: 503 };
    }
    throw new Error(`unexpected request: ${url}`);
  }),
}));

beforeEach(() => {
  jobs.length = 0;
  mockRequested.length = 0;
});

describe("A new keyword's analysis while the backend is away", () => {
  it("says it couldn't reach the server, not a run in progress, and leaves no dock job", async () => {
    render(
      <FreshGenerationView
        onBack={jest.fn()}
        initialKeyword="crm for startups"
      />,
    );

    expect(
      await screen.findByText(
        SERVER_UNREACHABLE_MESSAGE,
        {},
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    await waitFor(
      () => expect(screen.queryByText("Run in progress")).toBeNull(),
      {
        timeout: 5000,
      },
    );
    expect(jobs).toEqual([]);
    // Sent once: a start isn't repeated by itself.
    expect(
      mockRequested.filter((url) => url === `/api/generate/${THREAD}/stream`),
    ).toHaveLength(1);
  });
});

describe("An article being written while the backend is away", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps asking for its status instead of calling it failed, for three minutes", async () => {
    jest.useFakeTimers();
    jobs.push({ threadId: THREAD, status: "running" });
    render(
      <FreshGenerationView onBack={jest.fn()} backgroundThreadId={THREAD} />,
    );
    const statusReads = () =>
      mockRequested.filter((url) => url.includes("/status")).length;

    // Half a minute of 503s: three failed reads used to end the run on screen.
    await act(() => jest.advanceTimersByTimeAsync(30_000));
    expect(statusReads()).toBeGreaterThanOrEqual(6);
    expect(jobs).toEqual([{ threadId: THREAD, status: "running" }]);
    expect(screen.queryByText(SERVER_UNREACHABLE_MESSAGE)).toBeNull();

    // Past three minutes it says so, in the same plain sentence.
    await act(() => jest.advanceTimersByTimeAsync(3 * 60 * 1000));
    expect(jobs[0]).toMatchObject({
      threadId: THREAD,
      status: "failed",
      error: SERVER_UNREACHABLE_MESSAGE,
    });
  });
});
