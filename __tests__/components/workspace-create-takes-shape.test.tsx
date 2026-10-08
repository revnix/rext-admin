/**
 * FB3.8 (rext-control#845): while a new workspace's website is read, the page shows the workspace
 * taking shape: where one is in the three steps, each stage with what it found, and each part (the
 * brand voice, the people named on the site, the competitors) first in its shape and then as the
 * part itself the moment its step ends. Everything shown comes from the operation's events.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceCreateWizard } from "@/components/workspace/workspace-create-wizard";
import type { SSEEvent } from "@/types/sse";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("@/components/subscription/limit-check-wrapper", () => ({
  useCheckLimit: () => ({
    checkLimit: () => true,
    canCreate: true,
    isLimitReached: false,
  }),
}));
let mockEvents: SSEEvent[] = [];
let mockComplete: (() => void) | undefined;
jest.mock("@/hooks/use-sse-channel", () => ({
  useSSEChannel: (_id: string | null, options: { onComplete: () => void }) => {
    mockComplete = options.onComplete;
    return { events: mockEvents, connect: jest.fn(), disconnect: jest.fn() };
  },
}));
jest.mock("@/providers/sse-provider", () => ({
  useSSE: () => ({ clearCompletedOperation: jest.fn() }),
}));
jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
// The personas are read only once the brand-voice step has ended: asked for no workspace before.
const mockPersonasAskedFor: (string | null)[] = [];
const ANA = {
  name: "Ana",
  full_name: "Ana Ruiz",
  professional_title: "Head of forging",
};
const BEN = { name: "Ben Ode", full_name: null };
/** The personas the run has saved so far, as the list answers. */
let mockSaved: object[] = [ANA, BEN];
jest.mock("@/hooks/use-personas", () => ({
  usePersonas: (workspaceId: string | null) => {
    mockPersonasAskedFor.push(workspaceId);
    return workspaceId
      ? { isSuccess: true, data: { personas: mockSaved } }
      : { isSuccess: false, data: undefined };
  },
}));
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    workspaces: {
      getBrandVoice: jest.fn().mockResolvedValue({ brand_voice: {} }),
      updateBrandVoice: jest.fn(),
    },
  },
}));
jest.mock("@/stores/workspace", () => {
  const state = {
    createWorkspace: jest.fn().mockResolvedValue({ id: "ws-1", slug: "acme" }),
    workspaceList: [],
    setCurrentWorkspace: jest.fn(),
  };
  return {
    useWorkspaceStore: (selector: (s: typeof state) => unknown) =>
      selector(state),
    useWorkspaceCrudStore: {
      getState: () => ({ currentOperation: { operationId: "op-1" } }),
    },
  };
});

let clock = 0;
function event(step: string, payload?: Record<string, unknown>): SSEEvent {
  clock += 5;
  return {
    id: `${step}-${clock}`,
    operation_id: "op-1",
    scope: "workspace",
    step,
    status: step.endsWith("completed") ? "completed" : "started",
    message: "",
    payload,
    timestamp: new Date(Date.UTC(2026, 9, 8, 6, 14, clock)).toISOString(),
  };
}

const tree = () => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <WorkspaceCreateWizard />
  </QueryClientProvider>
);

async function create() {
  const view = render(tree());
  await userEvent.type(
    screen.getByRole("textbox", { name: /Workspace name/ }),
    "Acme",
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: /Website/ }),
    "https://www.acme.example",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Create workspace" }),
  );
  await screen.findByText(/Reading https:\/\/www.acme.example/);
  /** The operation's stream sends more events. */
  const send = (...events: SSEEvent[]) => {
    mockEvents = [...mockEvents, ...events];
    view.rerender(tree());
  };
  return { send };
}

const currentStep = () =>
  within(screen.getByRole("navigation", { name: "Workspace steps" }))
    .getAllByRole("listitem")
    .find((item) => item.getAttribute("aria-current") === "step")
    // Without its marker's number.
    ?.textContent?.replace(/^\d/, "");

beforeEach(() => {
  mockEvents = [];
  mockPersonasAskedFor.length = 0;
  mockSaved = [ANA, BEN];
  clock = 0;
});

describe("Creating a workspace, while its website is read", () => {
  it("says where one is: the address, then the reading, then the review", async () => {
    render(tree());
    expect(currentStep()).toBe("Your website, current step");
    expect(
      within(
        screen.getByRole("navigation", { name: "Workspace steps" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(3);
  });

  it("shows each part in its shape first, and nothing made up", async () => {
    const { send } = await create();
    expect(currentStep()).toBe("Reading the site, current step");
    send(event("scrape.started"));
    for (const part of ["Brand voice", "Author personas", "Competitors"]) {
      const region = screen.getByRole("region", { name: part });
      expect(region).toHaveAttribute("aria-busy", "true");
      // Its name, and its shape after a moment: no words of its own yet.
      expect(region).toHaveTextContent(new RegExp(`^${part}$`));
    }
    await waitFor(() =>
      expect(
        screen
          .getByRole("region", { name: "Brand voice" })
          .querySelectorAll('[data-slot="skeleton"]').length,
      ).toBeGreaterThan(0),
    );
    // The personas aren't asked for before the step that saves them has ended.
    expect(mockPersonasAskedFor.every((id) => id === null)).toBe(true);
  });

  it("says what each stage found, and shows each part the moment its step ends", async () => {
    const { send } = await create();
    send(
      event("scrape.started"),
      event("scrape.completed", {
        title: "Acme: anvils that last",
        word_count: 1240,
      }),
      event("brand_voice.started"),
    );
    expect(
      screen.getByText("“Acme: anvils that last” · 1,240 words read"),
    ).toBeInTheDocument();
    // The voice is still being written: its part keeps its shape.
    expect(screen.getByRole("region", { name: "Brand voice" })).toHaveAttribute(
      "aria-busy",
      "true",
    );

    send(
      event("brand_voice.completed", {
        brand_name: "Acme",
        about: "Acme makes anvils for working smiths.",
        selling_position: "They last a lifetime.",
        target_audience: ["Smiths"],
        brand_voice: ["Plain", "Dry"],
        content_pillar: ["Anvils"],
        personas: [],
      }),
      event("competitor_discovery.started"),
    );
    const voice = screen.getByRole("region", { name: "Brand voice" });
    expect(voice).toHaveAttribute("aria-busy", "false");
    expect(voice).toHaveTextContent("Acme makes anvils for working smiths.");
    expect(voice).toHaveTextContent("They last a lifetime.");
    expect(
      within(within(voice).getByRole("list", { name: "Tone" }))
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Plain", "Dry"]);
    // The people named on the site, read once their step has ended.
    expect(mockPersonasAskedFor.at(-1)).toBe("ws-1");
    const people = screen.getByRole("region", { name: "Author personas" });
    expect(
      within(people)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Ana RuizHead of forging", "Ben Ode"]);
    expect(
      screen.getByText("2 tone words · 2 people named on the site"),
    ).toBeInTheDocument();
    // The competitors are still being found.
    expect(screen.getByRole("region", { name: "Competitors" })).toHaveAttribute(
      "aria-busy",
      "true",
    );

    send(
      event("competitor_discovery.completed", {
        competitors: ["boltco.example", "hammerworks.example"],
      }),
    );
    const competitors = screen.getByRole("region", { name: "Competitors" });
    expect(
      within(competitors)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["boltco.example", "hammerworks.example"]);
    expect(screen.getByText("2 competitors found")).toBeInTheDocument();
  });

  it("never says no one is named while the run can still save a persona", async () => {
    // On staging the list was empty when the brand-voice step ended, and a persona was saved
    // after it: the wait said "no one is named", and the review named one.
    mockSaved = [];
    const { send } = await create();
    send(
      event("scrape.completed", { title: "Acme", word_count: 900 }),
      event("brand_voice.completed", {
        about: "Makes anvils.",
        brand_voice: ["Plain"],
      }),
      event("competitor_discovery.started"),
    );
    const people = screen.getByRole("region", { name: "Author personas" });
    expect(people).toHaveAttribute("aria-busy", "true");
    expect(people).toHaveTextContent(/^Author personas$/);
    expect(screen.queryByText(/no one/i)).toBeNull();
    expect(screen.getByText("1 tone word")).toBeInTheDocument();

    // The run saves one; the list is read again when the next step ends.
    mockSaved = [ANA];
    send(event("competitor_discovery.completed", { competitors: [] }));
    expect(
      within(screen.getByRole("region", { name: "Author personas" }))
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Ana RuizHead of forging"]);
    expect(
      screen.getByText("1 tone word · 1 person named on the site"),
    ).toBeInTheDocument();
  });

  it("says so when a step ends with nothing to show", async () => {
    const { send } = await create();
    send(
      event("scrape.completed", { title: null, word_count: 0 }),
      event("brand_voice.completed"),
      event("competitor_discovery.completed", { competitors: [] }),
    );
    expect(
      screen.getByText(/No brand voice could be drafted from the site/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("None found. You can add them in the next step."),
    ).toBeInTheDocument();
  });

  it("moves to the review when the analysis completes", async () => {
    await create();
    await act(async () => mockComplete?.());
    await screen.findByRole("button", { name: "Finish" });
    expect(currentStep()).toBe("Review and finish, current step");
  });
});
