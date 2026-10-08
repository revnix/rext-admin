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
const { analytics } = jest.requireMock("@/lib/analytics") as {
  analytics: { track: jest.Mock };
};
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
// A step while its run fills it in: only the run's stages, which it shows in its side pane, matter here.
jest.mock("@/components/generate-content/suggestions", () => ({
  SuggestionsSection: () => null,
  SuggestionsFilling: ({ progress }: { progress: React.ReactNode }) => (
    <>{progress}</>
  ),
}));
jest.mock("@/components/generate-content/title-step", () => ({
  TitleStep: () => null,
  TitleStepFilling: ({ progress }: { progress: React.ReactNode }) => (
    <>{progress}</>
  ),
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

// The proxy routes. By default a new thread, then the backend goes away before its stream starts.
// With `mockBackend.up`, the run is going and the stream the page rejoins breaks at once (the
// join route reports whatever ended it, with no code).
const mockRequested: string[] = [];
const mockBackend: {
  up: boolean;
  /** What the status route answers instead, when a test sets it. */
  statusAnswer?: { status: number; body: unknown };
} = { up: false };
jest.mock("@/lib/auth-utils", () => ({
  authenticatedFetch: jest.fn(async (url: string) => {
    mockRequested.push(url);
    if (url === "/api/generate/threads") {
      return { ok: true, json: async () => ({ data: { thread_id: THREAD } }) };
    }
    if (mockBackend.statusAnswer && url.includes("/status")) {
      const { status, body } = mockBackend.statusAnswer;
      return { ok: false, status, json: async () => body };
    }
    if (!mockBackend.up) {
      if (url.endsWith("/stream") || url.includes("/status")) {
        return { ok: false, status: 503 };
      }
    } else if (url.includes("/status")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          threadId: THREAD,
          run: { id: "run-1", status: "running" },
          progress: 40,
          stage: "Writing your article",
        }),
      };
    } else if (url.endsWith("/join")) {
      const chunks = [
        new TextEncoder().encode(
          `data: ${JSON.stringify({ error: "terminated" })}\n\n`,
        ),
      ];
      return {
        ok: true,
        status: 200,
        body: {
          getReader: () => ({
            read: async () =>
              chunks.length
                ? { done: false, value: chunks.shift() }
                : { done: true, value: undefined },
            cancel: jest.fn(),
          }),
        },
      };
    }
    throw new Error(`unexpected request: ${url}`);
  }),
}));

beforeEach(() => {
  jobs.length = 0;
  mockRequested.length = 0;
  mockBackend.up = false;
  mockBackend.statusAnswer = undefined;
  analytics.track.mockClear();
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
    // The step on screen was counted on arrival, and nothing typed went with it.
    const views = analytics.track.mock.calls.filter(
      ([name]) => name === "generate_step_viewed",
    );
    expect(views[0]).toEqual([
      "generate_step_viewed",
      { step: 1, step_name: "search_keyword", thread_id: undefined },
    ]);
    expect(JSON.stringify(views)).not.toContain("crm for startups");
    // Each arrival once: no step is counted twice in a row.
    const steps = views.map(([, properties]) => properties.step);
    expect(steps.every((step, i) => step !== steps[i - 1])).toBe(true);
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

  it("stays running when the stream the page rejoined breaks: the next status read decides", async () => {
    jest.useFakeTimers();
    mockBackend.up = true;
    jobs.push({ threadId: THREAD, status: "running" });
    render(
      <FreshGenerationView onBack={jest.fn()} backgroundThreadId={THREAD} />,
    );

    await act(() => jest.advanceTimersByTimeAsync(10_000));

    // Rejoined, broke, and asked for the status again, more than once.
    const joins = mockRequested.filter((url) => url.endsWith("/join")).length;
    expect(joins).toBeGreaterThanOrEqual(2);
    expect(jobs[0]).toMatchObject({ threadId: THREAD, status: "running" });
    expect(analytics.track).not.toHaveBeenCalledWith(
      "content_generation_failed",
      expect.anything(),
    );
  });
});

/**
 * A run's address that leads nowhere (rext-control task 824): from another account, old, mistyped,
 * or of a run that was removed. The page says so in plain words; it once showed the runtime's own
 * answer, a status code with JSON and an id.
 */
describe("Opening a run that is no longer there", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("says so in plain words, once, and doesn't ask again", async () => {
    mockBackend.up = true;
    mockBackend.statusAnswer = {
      status: 404,
      body: {
        error: "This article's run is no longer here. Start a new one.",
        code: "run_not_found",
      },
    };
    render(
      <FreshGenerationView onBack={jest.fn()} backgroundThreadId={THREAD} />,
    );

    const notice = await screen.findByRole("alert");
    expect(notice).toHaveTextContent(
      "This article's run is no longer here. Start a new one.",
    );
    expect(notice.textContent).not.toMatch(/HTTP|404|\{|detail/);
    expect(notice.textContent).not.toContain(THREAD);
    // A run that isn't there is not asked for a second and third time.
    expect(mockRequested.filter((url) => url.includes("/status"))).toHaveLength(
      1,
    );
  });

  it("shows its own sentence, never the answer's text, when the run can't be read for another reason", async () => {
    jest.useFakeTimers();
    mockBackend.up = true;
    mockBackend.statusAnswer = {
      status: 500,
      body: { error: `HTTP 500: {"detail":"thread ${THREAD} exploded"}` },
    };
    render(
      <FreshGenerationView onBack={jest.fn()} backgroundThreadId={THREAD} />,
    );
    // It asks three times before it gives up.
    await act(() => jest.advanceTimersByTimeAsync(10_000));

    const notice = screen.getByRole("alert");
    expect(notice).toHaveTextContent(
      "We couldn't open this article just now. Try again in a moment, or start a new one.",
    );
    expect(notice.textContent).not.toMatch(/HTTP|500|\{|detail|exploded/);
    expect(notice.textContent).not.toContain(THREAD);
  });
});
