/**
 * The writing page shows the writer's first draft as soon as the run hands it over, and replaces it
 * once, with the final article (rext-control#773, step A). The run here is one the page joins after
 * a reload, in its article phase; the stream is the test's own, the page is the real one, and the
 * editor is a stand-in that says what it was given.
 */

import { act, render, screen } from "@testing-library/react";
import { FreshGenerationView } from "@/components/generate-content/fresh-generation-view";

type Chunk = { event: string; data: unknown };
type Run = { url: string; send: (chunk: Chunk) => void; end: () => void };

const mockRuns: Run[] = [];

function mockOpenStream(url: string): AsyncGenerator<Chunk> {
  const queue: Chunk[] = [];
  let wake: (() => void) | undefined;
  let ended = false;
  mockRuns.push({
    url,
    send: (chunk) => {
      queue.push(chunk);
      wake?.();
    },
    end: () => {
      ended = true;
      wake?.();
    },
  });
  return (async function* stream() {
    while (true) {
      const next = queue.shift();
      if (next) {
        yield next;
        continue;
      }
      if (ended) return;
      await new Promise<void>((resolve) => {
        wake = resolve;
      });
    }
  })();
}

jest.mock("@/lib/generate-content/stream-utils", () => ({
  ...jest.requireActual("@/lib/generate-content/stream-utils"),
  streamFromSSE: (url: string) => mockOpenStream(url),
}));
const mockStatus = jest.fn(async (_url: string) => ({
  ok: false,
  status: 500,
  json: async (): Promise<unknown> => ({}),
}));
jest.mock("@/lib/auth-utils", () => ({
  authenticatedFetch: (url: string) => mockStatus(url),
}));
jest.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => ({ user: { id: "u1" } }),
}));
jest.mock("@/hooks/use-credit-gate", () => ({
  useCreditGate: () => ({
    ensureCredits: () => true,
    ensureCreditsToContinue: () => true,
    openCreditsModal: jest.fn(),
    creditsModal: null,
  }),
}));
jest.mock("@/stores/workspace/use-workspace-context-store", () => ({
  useCurrentWorkspaceId: () => "w1",
}));
jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => ({ workspaceSlug: "acme" }),
}));
jest.mock("@/stores/subscription-store", () => ({
  useSubscriptionStore: () => ({ patchCredits: jest.fn() }),
}));
jest.mock("@/stores/background-generation-store", () => {
  const state = {
    jobs: [],
    upsertJob: jest.fn(),
    updateJob: jest.fn(),
    removeJob: jest.fn(),
  };
  return {
    useBackgroundGenerationStore: Object.assign(
      (select: (store: typeof state) => unknown) => select(state),
      { getState: () => state },
    ),
  };
});
jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
jest.mock("sonner", () => ({
  toast: { info: jest.fn(), error: jest.fn(), warning: jest.fn() },
}));
jest.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: ({
      children,
      className,
    }: {
      children?: React.ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>,
  },
}));
jest.mock("@/components/layouts", () => ({
  ...jest.requireActual("@/components/layouts"),
  StepColumn: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@/components/generate-content/hero", () => ({
  HeroSection: () => null,
}));
jest.mock("@/components/generate-content/recent-keywords", () => ({
  RecentKeywords: () => null,
}));
jest.mock("@/components/generate-content/workflow-step-indicator", () => ({
  WorkflowStepIndicator: () => null,
}));
jest.mock("@/components/generate-content/run-notice", () => ({
  RunNotice: ({ message }: { message: string }) => <p>{message}</p>,
}));
// The editor's stand-in: the text, the description and whether it is a draft, as the page hands
// them over. Its own test covers what it shows for each (content-editor-run.test.tsx).
jest.mock("@/components/generate-content/content", () => ({
  ContentEditor: ({
    generatedContent,
    allContent,
    draft,
    draftSoFar,
  }: {
    generatedContent: string;
    allContent: { meta_description?: string } | null;
    draft?: boolean;
    draftSoFar?: boolean;
  }) => (
    <article
      data-draft={draft ? "yes" : "no"}
      data-so-far={draftSoFar ? "yes" : "no"}
    >
      <p data-testid="description">{allContent?.meta_description}</p>
      <div data-testid="body">{generatedContent}</div>
    </article>
  ),
}));

const DRAFT = "## Plan the beds\n\nThe writer's first words.";
const REWRITTEN = "## Plan the beds\n\nThe same section, rewritten.";
const FINAL = "## Plan the beds\n\nThe article as it was saved.";

/** A stage's update, as the joined stream carries it. */
const update = (node: string, content: Record<string, unknown>): Chunk => ({
  event: "updates|content_engine:8f2c",
  data: { [node]: { content } },
});

/** A section of the first draft, as the writer's stage sends it the moment it is finished. */
const section = (index: number, heading: string, markdown: string): Chunk => ({
  event: "custom|content_engine:8f2c",
  data: {
    type: "section",
    phase: "draft",
    key: `structure_${index}`,
    index,
    of: 3,
    level: 2,
    heading,
    markdown,
  },
});

async function send(run: Run, ...chunks: Chunk[]) {
  for (const chunk of chunks) {
    await act(async () => {
      run.send(chunk);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

async function joinedRun(): Promise<Run> {
  await act(async () => {
    for (let tries = 0; tries < 50 && mockRuns.length < 1; tries += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  });
  expect(mockRuns).toHaveLength(1);
  return mockRuns[0];
}

/** The thread's status: a run in its article phase, with what its state holds so far. */
const running = (content: Record<string, unknown>) =>
  mockStatus.mockImplementation(async (url: string) => ({
    ok: true,
    status: 200,
    json: async () =>
      url.includes("includeState=true")
        ? {
            run: { id: "run-7", status: "running" },
            progress: 50,
            stage: "Draft",
            runStage: { phase: "article", id: "draft" },
            state: { values: { content }, next: ["content_engine"], tasks: [] },
          }
        : { run: { id: "run-7", status: "running" } },
  }));

beforeEach(() => {
  mockRuns.length = 0;
  mockStatus.mockReset();
  window.localStorage.clear();
});

describe("the writing page and the writer's first draft (task 773)", () => {
  it("shows the draft when the writer ends, keeps it through the rewrite, and replaces it once", async () => {
    running({ outline: { title: "A vegetable garden planner" } });
    render(
      <FreshGenerationView onBack={jest.fn()} backgroundThreadId="thread-7" />,
    );
    const run = await joinedRun();
    expect(run.url).toBe("/api/generate/thread-7/join");

    // The writer ends: its update carries the whole draft.
    await send(
      run,
      update("generate_content", {
        final_content: {
          title: "A vegetable garden planner",
          meta_description: "The draft's description.",
          body_markdown: DRAFT,
        },
      }),
    );
    const article = screen.getByRole("article");
    expect(screen.getByTestId("body")).toHaveTextContent(
      "The writer's first words.",
    );
    expect(article).toHaveAttribute("data-draft", "yes");

    // The rewrite reports its own text: the reader keeps the draft, and its description.
    await send(
      run,
      update("humanize_content", {
        final_content: {
          title: "A vegetable garden planner",
          meta_description: "The rewrite's description.",
          body_markdown: REWRITTEN,
        },
      }),
    );
    expect(screen.getByTestId("body")).toHaveTextContent(
      "The writer's first words.",
    );
    expect(screen.getByTestId("description")).toHaveTextContent(
      "The draft's description.",
    );
    expect(screen.getByRole("article")).toHaveAttribute("data-draft", "yes");

    // The checks end: the final article takes the draft's place, and is no draft.
    await send(
      run,
      update("review_content", {
        final_content: {
          title: "A vegetable garden planner",
          meta_description: "The final description.",
          body_markdown: FINAL,
        },
        review: {
          on_page_metrics: { seo_health_score: 90, issues: [] },
          trust_score: { score: 70 },
          readability_metrics: { flesch_reading_ease: 60 },
        },
      }),
    );
    expect(screen.getByTestId("body")).toHaveTextContent(
      "The article as it was saved.",
    );
    expect(screen.getByTestId("description")).toHaveTextContent(
      "The final description.",
    );
    expect(screen.getByRole("article")).toHaveAttribute("data-draft", "no");
  }, 20_000);

  it("fills in section by section before the whole draft, which then takes their place (part B)", async () => {
    running({ outline: { title: "A vegetable garden planner" } });
    render(
      <FreshGenerationView onBack={jest.fn()} backgroundThreadId="thread-7" />,
    );
    const run = await joinedRun();

    await send(run, section(1, "Plan the beds", "Measure the plot first."));
    expect(screen.getByTestId("body")).toHaveTextContent(
      "## Plan the beds Measure the plot first.",
    );
    expect(screen.getByRole("article")).toHaveAttribute("data-so-far", "yes");
    expect(screen.getByRole("article")).toHaveAttribute("data-draft", "no");

    // One that arrives early waits for the section before it, then both are there in order.
    await send(run, section(3, "Water", "Early and deep."));
    expect(screen.getByTestId("body")).not.toHaveTextContent("Early and deep.");
    await send(run, section(2, "Sow", "Two seeds a hole."));
    expect(screen.getByTestId("body")).toHaveTextContent(
      "Measure the plot first. ## Sow Two seeds a hole. ## Water Early and deep.",
    );

    // The writer ends: the whole draft takes the sections' place, once.
    await send(
      run,
      update("generate_content", {
        final_content: {
          title: "A vegetable garden planner",
          body_markdown: DRAFT,
        },
      }),
    );
    expect(screen.getByTestId("body")).toHaveTextContent(
      "The writer's first words.",
    );
    expect(screen.getByTestId("body")).not.toHaveTextContent(
      "Measure the plot first.",
    );
    expect(screen.getByRole("article")).toHaveAttribute("data-draft", "yes");
    expect(screen.getByRole("article")).toHaveAttribute("data-so-far", "no");
  }, 20_000);

  it("shows the text a reloaded run already has, as a draft", async () => {
    running({
      outline: { title: "A vegetable garden planner" },
      final_content: {
        title: "A vegetable garden planner",
        body_markdown: DRAFT,
      },
    });
    render(
      <FreshGenerationView onBack={jest.fn()} backgroundThreadId="thread-7" />,
    );
    await joinedRun();
    expect(screen.getByTestId("body")).toHaveTextContent(
      "The writer's first words.",
    );
    expect(screen.getByRole("article")).toHaveAttribute("data-draft", "yes");
  }, 20_000);
});
