/**
 * A new keyword's analysis that the backend refuses (two runs already going) shows the
 * refusal's sentence, and leaves no job in the dock (E27, revnix/rext-control#570).
 *
 * Seen on staging: the page stayed on "Reading the search results · running" and counted
 * on, the dock kept polling a thread with no run, and the sentence never showed. The
 * stream named no thread (the refusal sends no `run/created`), so the job wasn't removed
 * and the stream took itself for a superseded one, which never cleared the loader.
 */
import { TextDecoder, TextEncoder } from "node:util";
import { render, screen, waitFor } from "@testing-library/react";
import { FreshGenerationView } from "@/components/generate-content/fresh-generation-view";
import { TOO_MANY_RUNS } from "@/lib/generate-content/run-events";

// jsdom has neither; the stream reader decodes what the route sends.
Object.assign(globalThis, { TextDecoder, TextEncoder });

const SENTENCE =
  "You already have 2 articles generating. Wait for one to finish, then start another.";
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

// The proxy routes: a new thread, its stream answering with the backend's refusal, and a
// status with no run on the thread.
const mockRequested: string[] = [];
jest.mock("@/lib/auth-utils", () => ({
  authenticatedFetch: jest.fn(async (url: string) => {
    mockRequested.push(url);
    if (url === "/api/generate/threads") {
      return { ok: true, json: async () => ({ data: { thread_id: THREAD } }) };
    }
    if (url.endsWith("/stream")) {
      const chunks = [
        new TextEncoder().encode(
          `data: ${JSON.stringify({ error: SENTENCE, code: TOO_MANY_RUNS })}\n\n`,
        ),
      ];
      return {
        ok: true,
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
    if (url.includes("/status")) {
      return {
        ok: true,
        status: 202,
        json: async () => ({ threadId: THREAD, run: null }),
      };
    }
    throw new Error(`unexpected request: ${url}`);
  }),
}));

beforeEach(() => {
  jobs.length = 0;
  mockRequested.length = 0;
});

describe("A new keyword's analysis the backend refuses", () => {
  it("shows the refusal's sentence, not a run in progress, and leaves no dock job", async () => {
    render(
      <FreshGenerationView
        onBack={jest.fn()}
        initialKeyword="crm for startups"
      />,
    );

    expect(
      await screen.findByText(SENTENCE, {}, { timeout: 5000 }),
    ).toBeInTheDocument();
    await waitFor(
      () => expect(screen.queryByText("Run in progress")).toBeNull(),
      {
        timeout: 5000,
      },
    );
    expect(jobs).toEqual([]);
    expect(mockRequested).toContain(`/api/generate/${THREAD}/stream`);
  });
});
