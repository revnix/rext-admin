/**
 * FB3.11 (rext-control#853): a workspace for someone with no website yet. The first step has a
 * second way in: the business is described in a sentence or two instead of an address. The run
 * then writes the brand voice only, from that description: one stage beside the workspace, and the
 * competitors and the personas say from the start that there are none yet. The same surface
 * otherwise, to the same review.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, within } from "@testing-library/react";
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
// A workspace made from a description has no one to read: the personas must not be asked for
// during the wait.
const mockPersonasAskedFor: (string | null)[] = [];
jest.mock("@/hooks/use-personas", () => ({
  usePersonas: (workspaceId: string | null) => {
    mockPersonasAskedFor.push(workspaceId);
    return workspaceId
      ? { isSuccess: true, data: { personas: [] } }
      : { isSuccess: false, data: undefined };
  },
}));
const SAID =
  "We sell hand-forged kitchen knives to home cooks who want one knife that lasts.";
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    workspaces: {
      getBrandVoice: jest.fn().mockResolvedValue({
        brand_voice: {
          brand_name: "Acme Forge",
          about:
            "We sell hand-forged kitchen knives to home cooks who want one knife that lasts.",
          competitors: [],
        },
      }),
      updateBrandVoice: jest.fn(),
    },
  },
}));
jest.mock("@/stores/workspace", () => {
  const state = {
    createWorkspace: jest
      .fn()
      .mockResolvedValue({ id: "ws-1", slug: "acme-forge", url: null }),
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
// The mocked store's own create call, read through its selector.
const { useWorkspaceStore: fromStore } = jest.requireMock(
  "@/stores/workspace",
) as {
  useWorkspaceStore: (
    selector: (s: { createWorkspace: jest.Mock }) => unknown,
  ) => unknown;
};
const createWorkspace = fromStore(
  (state) => state.createWorkspace,
) as jest.Mock;
const { analytics } = jest.requireMock("@/lib/analytics") as {
  analytics: { track: jest.Mock };
};

let clock = 0;
function event(step: string, payload?: Record<string, unknown>): SSEEvent {
  clock += 3;
  return {
    id: `${step}-${clock}`,
    operation_id: "op-1",
    scope: "workspace",
    step,
    status: (step.endsWith("completed")
      ? "completed"
      : "started") as SSEEvent["status"],
    message: "",
    payload,
    timestamp: new Date(Date.UTC(2026, 9, 8, 9, 30, clock)).toISOString(),
  };
}

const tree = () => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <WorkspaceCreateWizard planCount={{ used: 0, max: 1 }} />
  </QueryClientProvider>
);
const part = (name: string) => screen.getByRole("region", { name });
const pane = (name: string) => screen.getByRole("complementary", { name });
const website = () => screen.queryByRole("textbox", { name: /Website/ });
const business = () =>
  screen.queryByRole("textbox", { name: /What does the business do/ });
const noSite = () =>
  userEvent.click(
    screen.getByRole("button", { name: "I don't have a website yet" }),
  );

/** The form filled the second way and sent; then the run's events as the test sends them. */
async function createFromDescription() {
  const view = render(tree());
  await userEvent.type(
    screen.getByRole("textbox", { name: /Workspace name/ }),
    "Acme Forge",
  );
  await noSite();
  await userEvent.type(business() as HTMLElement, SAID);
  await userEvent.click(
    screen.getByRole("button", { name: "Create workspace" }),
  );
  await screen.findByText(/Drafting your brand voice from your description/);
  const send = (...events: SSEEvent[]) => {
    mockEvents = [...mockEvents, ...events];
    view.rerender(tree());
  };
  return { send };
}

beforeEach(() => {
  mockEvents = [];
  mockComplete = undefined;
  mockPersonasAskedFor.length = 0;
  createWorkspace.mockClear();
  analytics.track.mockClear();
});

describe("Creating a workspace: the first step's second way in", () => {
  it("offers it under the website, and swaps the address for a description of the business", async () => {
    render(tree());
    expect(website()).toBeInTheDocument();
    expect(business()).toBeNull();

    await noSite();
    expect(website()).toBeNull();
    expect(business()).toBeInTheDocument();
    expect(
      screen.getByText(/What it sells and who buys it, in a sentence or two/),
    ).toBeInTheDocument();
    // The steps and the plan beside the form follow: one stage, and a website can come later.
    expect(
      within(screen.getByRole("navigation", { name: "Workspace steps" }))
        .getAllByRole("listitem")
        .map((item) => item.textContent?.split(",")[0]),
    ).toEqual(["1Your business", "2Drafting the voice", "3Review and finish"]);
    const plan = pane("What happens next");
    expect(plan).toHaveTextContent(
      "we draft its brand voice from what you tell us",
    );
    expect(plan).toHaveTextContent(
      "You can add a website later in the workspace's settings, and we read it then.",
    );
    expect(within(plan).getByText("Writing your brand voice")).toBeVisible();
    expect(within(plan).queryByText("Reading your website")).toBeNull();
    expect(within(plan).queryByText("Finding competitors")).toBeNull();
  });

  it("keeps what was typed in each when switching, and goes back", async () => {
    render(tree());
    await userEvent.type(website() as HTMLElement, "acme-forge.com");
    await noSite();
    await userEvent.type(business() as HTMLElement, "Knives for cooks.");
    await userEvent.click(
      screen.getByRole("button", { name: "I have a website" }),
    );
    expect(website()).toHaveValue("acme-forge.com");
    await noSite();
    expect(business()).toHaveValue("Knives for cooks.");
  });

  it("asks for a sentence or two before it creates anything", async () => {
    render(tree());
    await userEvent.type(
      screen.getByRole("textbox", { name: /Workspace name/ }),
      "Acme Forge",
    );
    await noSite();
    await userEvent.type(business() as HTMLElement, "Knives.");
    await userEvent.click(
      screen.getByRole("button", { name: "Create workspace" }),
    );
    expect(
      await screen.findByText(
        "Say what the business sells and who buys it, in a sentence or two",
      ),
    ).toBeInTheDocument();
    expect(createWorkspace).not.toHaveBeenCalled();
  });

  it("creates the workspace from the description, with no address", async () => {
    await createFromDescription();
    expect(createWorkspace).toHaveBeenCalledTimes(1);
    const sent = createWorkspace.mock.calls[0][0];
    expect(sent).toMatchObject({ name: "Acme Forge", description: SAID });
    expect(sent).not.toHaveProperty("url");
    // Which way in is counted; what was typed is not.
    expect(analytics.track).toHaveBeenCalledWith(
      "workspace_created",
      expect.objectContaining({ with_website: false }),
    );
    expect(JSON.stringify(analytics.track.mock.calls)).not.toContain("knives");
  });
});

describe("Creating a workspace without a website: what the backend refuses", () => {
  it("puts a refused description beside its field, in the backend's words", async () => {
    const { ApiError } = jest.requireActual("@/lib/api-client/core") as {
      ApiError: new (
        status: number,
        message: string,
        code?: string,
        context?: unknown,
      ) => Error;
    };
    createWorkspace.mockRejectedValueOnce(
      new ApiError(422, "Validation failed", "validation_error", {
        error: {
          details: [
            {
              field: "description",
              message:
                "Describe the business in a sentence or two: what it sells, and to whom.",
              code: "field_validation_error",
            },
          ],
        },
      }),
    );
    render(tree());
    await userEvent.type(
      screen.getByRole("textbox", { name: /Workspace name/ }),
      "Acme Forge",
    );
    await noSite();
    await userEvent.type(business() as HTMLElement, SAID);
    await userEvent.click(
      screen.getByRole("button", { name: "Create workspace" }),
    );
    expect(
      await screen.findByText(
        "Describe the business in a sentence or two: what it sells, and to whom.",
      ),
    ).toBeInTheDocument();
    // Still on the form, with what was typed.
    expect(business()).toHaveValue(SAID);
  });
});

describe("Creating a workspace without a website, while its voice is written", () => {
  it("shows one stage, and the competitors and personas settled from the start", async () => {
    const { send } = await createFromDescription();
    send(event("brand_voice.started"));

    const scenes = pane("Behind the scenes");
    expect(
      within(scenes).getAllByText("Writing your brand voice").length,
    ).toBeGreaterThan(0);
    expect(within(scenes).queryByText("Reading your website")).toBeNull();
    expect(within(scenes).queryByText("Finding competitors")).toBeNull();

    // The voice's three sections are being written; the other two are known already.
    for (const name of ["The brand", "Who it's for", "How it sounds"]) {
      expect(part(name)).toHaveAttribute("aria-busy", "true");
    }
    expect(part("Competitors")).toHaveAttribute("aria-busy", "false");
    expect(part("Competitors")).toHaveTextContent(
      "None yet. You can add them in the review.",
    );
    expect(part("Author personas")).toHaveAttribute("aria-busy", "false");
    expect(part("Author personas")).toHaveTextContent(
      "None yet: there is no website to read the people from. You can add personas later.",
    );
    // Nothing on the page speaks of a site that was read, or of people looked for.
    expect(screen.queryByText(/named on (the|your) site/)).toBeNull();
    expect(screen.queryByText(/Reading /)).toBeNull();
  });

  it("fills the voice's sections when the step ends, and never asks for personas", async () => {
    const { send } = await createFromDescription();
    send(
      event("brand_voice.started"),
      event("brand_voice.completed", {
        brand_name: "Acme Forge",
        about: SAID,
        brand_voice: ["Plain", "Warm"],
        target_audience: ["Home cooks"],
        personas: [],
      }),
    );
    expect(part("The brand")).toHaveAttribute("aria-busy", "false");
    expect(part("The brand")).toHaveTextContent("Acme Forge");
    expect(part("The brand")).toHaveTextContent(SAID);
    expect(part("How it sounds")).toHaveTextContent("Plain");
    expect(
      within(pane("Behind the scenes")).getAllByText(/2 tone words/).length,
    ).toBeGreaterThan(0);
    expect(mockPersonasAskedFor.every((id) => id === null)).toBe(true);
  });

  it("leaves the brand's name to the review when the draft gives none", async () => {
    const { send } = await createFromDescription();
    // The backend never takes a brand's name from a workspace's label.
    send(
      event("brand_voice.started"),
      event("brand_voice.completed", {
        brand_name: null,
        about: SAID,
        brand_voice: ["Plain"],
        personas: [],
      }),
    );
    expect(part("The brand")).toHaveTextContent(
      "Brand nameNot drafted. You can write it in the review.",
    );
    expect(part("The brand")).toHaveTextContent(SAID);
  });
});

describe("Creating a workspace without a website: the review", () => {
  it("says the voice was drafted from the description, and what there is none of yet", async () => {
    const { send } = await createFromDescription();
    send(
      event("brand_voice.started"),
      event("brand_voice.completed", {
        brand_name: "Acme Forge",
        about: SAID,
        brand_voice: ["Plain"],
        personas: [],
      }),
      event("pipeline.completed"),
    );
    await act(async () => mockComplete?.());
    await screen.findByRole("button", { name: "Finish" });

    expect(
      screen.getByRole("heading", { name: "Drafted from your description" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/We read/)).toBeNull();
    expect(
      screen.getByText(
        "None yet: there is no website to read the people from. Add them in Personas.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("None yet. Add them below.")).toBeInTheDocument();
    // The same section the wait showed, where it was.
    expect(part("Author personas")).toHaveTextContent(
      "None yet: there is no website to read the people from. You can add personas later.",
    );
  });
});
