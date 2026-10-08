/**
 * FB3.8 (rext-control#845): creating a workspace is one surface from the address to the review.
 * The three steps stand above it; the workspace is the main column (the form, then its draft
 * taking shape in the sections the review will hold, then those sections as fields); behind the
 * scenes sits beside it (the plan of the three stages before anything runs, then each stage with
 * what it found and the work as it happens, newest on top). Everything shown comes from the
 * operation's events and, for the people, the personas the run saved.
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
const PEOPLE = [
  { name: "Ana", full_name: "Ana Ruiz", professional_title: "Head of forging" },
  { name: "Ben Ode", full_name: null },
];
/** What the personas list answers now; a run saves them, so it can change between reads. */
let mockPeople: typeof PEOPLE = PEOPLE;
jest.mock("@/hooks/use-personas", () => ({
  usePersonas: (workspaceId: string | null) => {
    mockPersonasAskedFor.push(workspaceId);
    return workspaceId
      ? { isSuccess: true, data: { personas: mockPeople } }
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
    status: (step.endsWith("completed")
      ? "completed"
      : step.includes(".")
        ? "started"
        : "progress") as SSEEvent["status"],
    message: "",
    payload,
    timestamp: new Date(Date.UTC(2026, 9, 8, 6, 14, clock)).toISOString(),
  };
}

const tree = (planCount?: { used: number; max: number }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <WorkspaceCreateWizard planCount={planCount} />
  </QueryClientProvider>
);

async function create(planCount?: { used: number; max: number }) {
  const view = render(tree(planCount));
  await userEvent.type(
    screen.getByRole("textbox", { name: /What is your business called/ }),
    "Acme",
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: /What is its website/ }),
    "https://www.acme.example",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Read my website" }),
  );
  await screen.findByText(/Reading https:\/\/www.acme.example/);
  /** The operation's stream sends more events. */
  const send = (...events: SSEEvent[]) => {
    mockEvents = [...mockEvents, ...events];
    view.rerender(tree(planCount));
  };
  return { send, rerender: () => view.rerender(tree(planCount)) };
}

/** A section of the workspace's draft, by the name the review gives it. */
const part = (name: string) => screen.getByRole("region", { name });
/** What a section holds under one of its labels. */
const held = (section: HTMLElement, label: string) =>
  within(section).getByText(label, { selector: "dt" }).nextElementSibling;
/** Behind the scenes, beside the workspace. */
const pane = (name = "Behind the scenes") =>
  screen.getByRole("complementary", { name });
const words = (list: HTMLElement) =>
  within(list)
    .getAllByRole("listitem")
    .map((item) => item.textContent);

const currentStep = () =>
  within(screen.getByRole("navigation", { name: "Workspace steps" }))
    .getAllByRole("listitem")
    .find((item) => item.getAttribute("aria-current") === "step")
    // Without its marker's number.
    ?.textContent?.replace(/^\d/, "");

beforeEach(() => {
  mockEvents = [];
  mockPersonasAskedFor.length = 0;
  mockPeople = PEOPLE;
  clock = 0;
});

describe("Creating a workspace: the first step", () => {
  it("says where one is: the address, then the reading, then the review", async () => {
    render(tree());
    expect(currentStep()).toBe("Your website, current step");
    expect(
      within(
        screen.getByRole("navigation", { name: "Workspace steps" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(3);
  });

  it("says beside the form what will happen and about how long it takes", () => {
    render(tree());
    const next = pane("What happens next");
    expect(next).toHaveTextContent(
      "When you create the workspace, we read your website and draft its brand voice, author personas and competitors. It takes about a minute, you can leave the page meanwhile, and you review everything before any of it is used.",
    );
    // The three stages, each waiting, with what it will do.
    for (const stage of [
      "Reading your website",
      "Writing your brand voice and personas",
      "Finding competitors",
    ]) {
      expect(within(next).getByText(stage)).toBeInTheDocument();
    }
    expect(
      within(next).getByText("The sites yours is compared with in search."),
    ).toBeInTheDocument();
    // Nothing has happened yet: no list of what has.
    expect(screen.queryByRole("region", { name: "As it happens" })).toBeNull();
    // Under 1024 px nothing sits beside the form: the same follows it.
    expect(
      screen.getByRole("region", { name: "What happens next" }),
    ).toHaveClass("lg:hidden");
  });

  it("names the site in the plan as its address is typed", async () => {
    render(tree());
    await userEvent.type(
      screen.getByRole("textbox", { name: /What is its website/ }),
      "https://www.acme.example",
    );
    expect(
      within(pane("What happens next")).getByText("The pages of acme.example."),
    ).toBeInTheDocument();
  });

  it("shows the plan's workspaces above the form, and only there", async () => {
    const { send } = await create({ used: 0, max: 1 });
    // The workspace exists now: the count would read as a full bar, an error to someone waiting.
    expect(screen.queryByText(/workspace on your plan/)).toBeNull();
    send(event("scrape.started"));
    expect(screen.queryByText(/workspace on your plan/)).toBeNull();
  });

  it("shows that count before the workspace is created", () => {
    render(tree({ used: 0, max: 1 }));
    expect(
      screen.getByText("0 of 1 workspace on your plan"),
    ).toBeInTheDocument();
  });
});

describe("Creating a workspace, while its website is read", () => {
  it("shows each section of the review in its shape first, and nothing made up", async () => {
    const { send } = await create();
    expect(currentStep()).toBe("Reading the site, current step");
    send(event("scrape.started"));
    for (const name of [
      "The brand",
      "Who it's for",
      "How it sounds",
      "Competitors",
      "Author personas",
    ]) {
      expect(part(name)).toHaveAttribute("aria-busy", "true");
    }
    // Its name, and its shape after a moment: no words of its own yet.
    expect(part("The brand")).toHaveTextContent(/^The brand$/);
    await waitFor(() =>
      expect(
        part("The brand").querySelectorAll('[data-slot="skeleton"]').length,
      ).toBeGreaterThan(0),
    );
    // The personas aren't asked for before the step that saves them has ended.
    expect(mockPersonasAskedFor.every((id) => id === null)).toBe(true);
  });

  it("has the stages beside the workspace, each with what it found, and each section the moment its step ends", async () => {
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
      within(pane()).getByText("“Acme: anvils that last” · 1,240 words read"),
    ).toBeInTheDocument();
    // The voice is still being written: its sections keep their shape.
    expect(part("The brand")).toHaveAttribute("aria-busy", "true");

    send(
      event("brand_voice.completed", {
        brand_name: "Acme",
        about: "Acme makes anvils for working smiths.",
        selling_position: "They last a lifetime.",
        customer_profile: "Smiths who forge for a living.",
        target_audience: ["Smiths", "Farriers"],
        brand_voice: ["Plain", "Dry"],
        content_pillar: ["Anvils"],
        personas: [],
      }),
      event("competitor_discovery.started"),
    );
    // Under the names their fields have in the review.
    const brand = part("The brand");
    expect(brand).toHaveAttribute("aria-busy", "false");
    expect(held(brand, "Brand name")).toHaveTextContent("Acme");
    expect(held(brand, "About")).toHaveTextContent(
      "Acme makes anvils for working smiths.",
    );
    expect(held(brand, "What sets it apart")).toHaveTextContent(
      "They last a lifetime.",
    );
    const audience = part("Who it's for");
    expect(held(audience, "Customers")).toHaveTextContent(
      "Smiths who forge for a living.",
    );
    expect(
      words(within(audience).getByRole("list", { name: "Audiences" })),
    ).toEqual(["Smiths", "Farriers"]);
    const sound = part("How it sounds");
    expect(words(within(sound).getByRole("list", { name: "Voice" }))).toEqual([
      "Plain",
      "Dry",
    ]);
    expect(
      words(within(sound).getByRole("list", { name: "Content pillars" })),
    ).toEqual(["Anvils"]);
    // The people named on the site, read once their step has ended.
    expect(mockPersonasAskedFor.at(-1)).toBe("ws-1");
    expect(words(part("Author personas"))).toEqual([
      "Ana RuizHead of forging",
      "Ben Ode",
    ]);
    expect(
      within(pane()).getByText("2 tone words · 2 people named on the site"),
    ).toBeInTheDocument();
    // The competitors are still being found.
    expect(part("Competitors")).toHaveAttribute("aria-busy", "true");

    send(
      event("competitor_discovery.completed", {
        competitors: ["boltco.example", "hammerworks.example"],
      }),
    );
    expect(
      words(
        within(part("Competitors")).getByRole("list", { name: "Competitors" }),
      ),
    ).toEqual(["boltco.example", "hammerworks.example"]);
    expect(within(pane()).getByText("2 competitors found")).toBeInTheDocument();
  });

  it("says a part of the voice that the site didn't give, under its own name", async () => {
    const { send } = await create();
    send(
      event("brand_voice.completed", {
        brand_name: "Acme",
        brand_voice: ["Plain"],
      }),
    );
    expect(held(part("The brand"), "About")).toHaveTextContent(
      "Not found on the site.",
    );
    expect(held(part("Who it's for"), "Audiences")).toHaveTextContent(
      "Not found on the site.",
    );
  });

  it("says so when a step ends with nothing to show", async () => {
    const { send } = await create();
    send(
      event("scrape.completed", { title: null, word_count: 0 }),
      event("brand_voice.completed"),
      event("competitor_discovery.completed", { competitors: [] }),
    );
    expect(part("The brand")).toHaveTextContent(
      "Nothing could be drafted from the site. You can write it in the review.",
    );
    expect(
      screen.getByText("None found. You can add them in the review."),
    ).toBeInTheDocument();
  });
});

describe("The people named on the site", () => {
  it("are still being looked for while the run can save one: an empty first read is not 'no one'", async () => {
    // The first read of the personas comes back empty; the run saves one a moment later.
    mockPeople = [];
    const { send, rerender } = await create();
    send(
      event("scrape.completed", { title: "Acme", word_count: 900 }),
      event("brand_voice.completed", {
        brand_name: "Acme",
        brand_voice: ["Plain"],
      }),
      event("competitor_discovery.started"),
    );
    const people = part("Author personas");
    expect(people).toHaveAttribute("aria-busy", "true");
    expect(people).toHaveTextContent(
      "Looking for the people named on your site.",
    );
    expect(screen.queryByText(/No one is named/)).toBeNull();
    expect(screen.queryByText(/no one named on the site/)).toBeNull();
    expect(within(pane()).getByText("1 tone word")).toBeInTheDocument();

    // The run saved someone: the list is read again as the run moves on, and has them.
    mockPeople = PEOPLE.slice(0, 1);
    rerender();
    expect(words(part("Author personas"))).toEqual(["Ana RuizHead of forging"]);
    expect(
      within(pane()).getByText("1 tone word · 1 person named on the site"),
    ).toBeInTheDocument();
  });

  it("are said to be none only once the run has ended", async () => {
    mockPeople = [];
    const { send } = await create();
    send(
      event("brand_voice.completed", {
        brand_name: "Acme",
        brand_voice: ["Plain"],
      }),
    );
    expect(screen.queryByText(/No one is named/)).toBeNull();

    await act(async () => mockComplete?.());
    await screen.findByRole("button", { name: "Finish" });
    // The run has ended: an empty list is the last word now.
    expect(part("Author personas")).toHaveTextContent(
      "No one is named on your site. You can add personas later.",
    );
  });
  it("stop being looked for when the run stops before anyone was read", async () => {
    const { send } = await create();
    // The reading failed: the brand-voice step never ran, so the personas were never read.
    send({
      ...event("scrape.started"),
      step: "scrape.failed",
      status: "failed",
    });
    const people = part("Author personas");
    expect(people).toHaveAttribute("aria-busy", "false");
    expect(people).toHaveTextContent(
      "The people named on your site weren't read. You can add personas later.",
    );
    expect(screen.queryByText(/No one is named/)).toBeNull();
    expect(
      within(people).queryByText("Looking for the people named on your site."),
    ).toBeNull();
  });
});

describe("Behind the scenes: the work as it happens", () => {
  const lines = () =>
    within(within(pane()).getByRole("region", { name: "As it happens" }))
      .getAllByRole("listitem")
      .map((item) => item.textContent);

  it("lists what the run reports, the newest on top, with its time", async () => {
    const { send } = await create();
    send(
      event("scrape.started"),
      event("scrape", {
        pages: [
          { page: "https://www.acme.example/", kind: "home" },
          { page: "https://www.acme.example/about", kind: "about" },
        ],
        count: 2,
      }),
    );
    expect(lines()).toEqual([
      "0:05Read 2 pages: the home page and the about page",
      "0:00Opening acme.example and reading what it says.",
    ]);

    send(
      event("scrape.completed", { title: "Acme", word_count: 900 }),
      event("brand_voice.started"),
      event("brand_voice.completed", {
        brand_name: "Acme",
        brand_voice: ["Plain"],
      }),
      event("competitor_discovery.started"),
      event("competitor_discovery", { stage: "searching", queries: 6 }),
    );
    expect(lines().slice(0, 3)).toEqual([
      "0:30Running 6 searches your customers would make",
      "0:25Looking at who ranks for the same searches.",
      "0:20Writing your brand voice and personas: 1 tone word",
    ]);
    expect(lines()).toHaveLength(7);
  });

  it("takes the people from the run's own word that it saved them, without waiting for a read", async () => {
    // The personas list has nothing yet; the run says who it saved.
    mockPeople = [];
    const { send } = await create();
    send(
      event("brand_voice.completed", {
        brand_name: "Acme",
        brand_voice: ["Plain"],
      }),
      event("competitor_discovery.started"),
    );
    expect(part("Author personas")).toHaveAttribute("aria-busy", "true");

    send(
      event("personas", {
        people: [
          { person: "Ana Ruiz", title: "Head of forging" },
          { person: "Ben Ode", title: null },
        ],
        count: 2,
      }),
    );
    expect(part("Author personas")).toHaveAttribute("aria-busy", "false");
    expect(words(part("Author personas"))).toEqual([
      "Ana RuizHead of forging",
      "Ben Ode",
    ]);
    expect(lines().slice(0, 2)).toEqual([
      "0:10Found Ana Ruiz, Head of forging",
      "0:10Found Ben Ode",
    ]);
    expect(
      within(pane()).getByText("1 tone word · 2 people named on the site"),
    ).toBeInTheDocument();
  });

  it("says no one is named as soon as the run says it saved no one", async () => {
    mockPeople = [];
    const { send } = await create();
    send(
      event("brand_voice.completed", {
        brand_name: "Acme",
        brand_voice: ["Plain"],
      }),
      event("personas", { people: [], count: 0 }),
    );
    expect(part("Author personas")).toHaveTextContent(
      "No one is named on your site. You can add personas later.",
    );
    expect(
      within(pane()).getByText("1 tone word · no one named on the site"),
    ).toBeInTheDocument();
  });

  it("is one line above the workspace under 1024 px, with the rest behind All steps", async () => {
    const { send } = await create();
    send(
      event("scrape.started"),
      event("scrape", {
        pages: [{ page: "https://www.acme.example/", kind: "home" }],
        count: 4,
      }),
    );
    const open = screen.getByRole("button", { name: "All steps" });
    const strip = open.parentElement as HTMLElement;
    expect(strip).toHaveClass("lg:hidden");
    // The newest thing the running stage reported.
    expect(
      within(strip).getByText("Read 4 pages: the home page and 3 other pages"),
    ).toBeInTheDocument();
    expect(
      within(strip).queryByRole("region", { name: "As it happens" }),
    ).toBeNull();

    await userEvent.click(open);
    expect(
      within(strip).getByRole("region", { name: "As it happens" }),
    ).toBeInTheDocument();
    expect(
      within(strip).getByRole("button", { name: "Hide steps" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});

describe("Creating a workspace: the review", () => {
  it("keeps the sections where they were, now as fields, with the stages still beside them", async () => {
    const { send } = await create();
    send(
      event("scrape.completed", { title: "Acme", word_count: 900 }),
      event("brand_voice.completed", {
        brand_name: "Acme",
        brand_voice: ["Plain"],
      }),
      event("competitor_discovery.completed", {
        competitors: ["boltco.example"],
      }),
    );
    const before = [
      "The brand",
      "Who it's for",
      "How it sounds",
      "Competitors",
    ];
    for (const name of before) expect(part(name)).toBeInTheDocument();

    await act(async () => mockComplete?.());
    await screen.findByRole("button", { name: "Finish" });
    expect(currentStep()).toBe("Review and finish, current step");
    // The same four names, in the same order, each now over fields; the people under them.
    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent)
      .filter((name) => [...before, "Author personas"].includes(name ?? ""));
    expect(headings).toEqual([...before, "Author personas"]);
    expect(
      screen.getByRole("textbox", { name: /Brand name/ }),
    ).toBeInTheDocument();
    expect(words(part("Author personas"))).toEqual([
      "Ana RuizHead of forging",
      "Ben Ode",
    ]);
    // What was done stays beside it, as a record.
    expect(within(pane()).getByText("1 competitor found")).toBeInTheDocument();
    expect(
      within(pane()).getByRole("region", { name: "As it happens" }),
    ).toBeInTheDocument();
  });
});
