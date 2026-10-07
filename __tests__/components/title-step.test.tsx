import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TitleStep } from "@/components/generate-content/title-step";

// The ten results' rows are SerpSnapshot's to test; here only what the step hands it.
// The stage's credits come from the plan catalogue (run-cost.test.tsx); here, which stage's
// tooltip the button sits in.
jest.mock("@/components/generate-content/run-cost", () => ({
  // As the real tooltip's trigger, no wrapper: the button itself is marked.
  StageCostTooltip: ({
    stage,
    children,
  }: {
    stage: string;
    children: React.ReactElement<Record<string, unknown>>;
  }) =>
    jest.requireActual("react").cloneElement(children, { "data-stage": stage }),
}));

const mockShown: Record<string, unknown>[] = [];
jest.mock("@/components/keywords/serp-snapshot", () => ({
  ...jest.requireActual("@/components/keywords/serp-snapshot"),
  SerpSnapshot: (props: Record<string, unknown>) => {
    mockShown.push(props);
    return <ol aria-label="Top search results" />;
  },
}));

const PANE = "How the top ten title it";

const TITLES = [
  "How to Choose an SEO Agency: A Guide for Owners 2026", // 52
  "SEO Agency Pricing Explained for Small Business Owners", // 54
  "What an SEO Agency Does and When You Need One Today", // 51
  "SEO Agency Tips", // 15: 2 of 3 checks
];

const GATE = {
  type: "topic",
  recommendation_reason: "Matches the how-to pages that rank.",
  focus_keyphrase: "seo agency",
  serp_titles: [
    {
      position: 1,
      title: "SEO Agency Pricing: What Small Businesses Pay | Clutch", // 54
      domain: "clutch.co",
      format: null,
    },
    {
      position: 2,
      title: "How to Choose an SEO Agency for Your Business", // 45
      domain: "ahrefs.com",
      format: "how-to",
    },
    {
      position: 3,
      title:
        "The 10 Best SEO Companies for Small Business Owners, Ranked for 2026", // 68
      domain: "forbes.com",
      format: "list",
    },
    {
      position: 4,
      title: "Small Business SEO Services That Work | Moz", // 43
      domain: "moz.com",
      format: null,
    },
  ],
};

function renderStep(onContinue = jest.fn(), gate: unknown = GATE) {
  render(
    <TitleStep
      instruction="Select a title"
      titles={TITLES}
      recommendedTitle={TITLES[1]}
      gate={gate}
      onContinue={onContinue}
      onRegenerate={jest.fn()}
    />,
  );
  return onContinue;
}

// By its label's text: jsdom reads the bold keyword as a block, so a radio's computed name can gain a
// space beside it ("SEO Agency : A Guide") that no browser adds.
const radio = (title: string) => screen.getByLabelText(title);
const card = (title: string) => radio(title).closest("li") as HTMLElement;

beforeEach(() => {
  mockShown.length = 0;
});

it("starts on the recommended title, with its reason, and continues with it", async () => {
  const onContinue = renderStep();

  expect(screen.getByRole("radio", { name: TITLES[1] })).toBeChecked();
  expect(screen.getByText(GATE.recommendation_reason)).toBeInTheDocument();
  // Each title's count says what it counts (E25).
  expect(screen.getAllByText(/^\d of 3 checks$/)).toHaveLength(TITLES.length);
  // Continue takes the outline's credits: its tooltip says so, not its label (E25, FB2.11).
  const proceed = screen.getByRole("button", { name: "Continue" });
  expect(proceed.closest("[data-stage]")).toHaveAttribute(
    "data-stage",
    "generate_outline",
  );
  await userEvent.click(proceed);

  expect(onContinue).toHaveBeenCalledWith(TITLES[1]);
});

it("sends an edited title word for word", async () => {
  const onContinue = renderStep();

  await userEvent.click(screen.getByRole("button", { name: "Edit title 1" }));
  const field = screen.getByRole("textbox", { name: "Title 1" });
  await userEvent.clear(field);
  await userEvent.type(
    field,
    "  My Own SEO Agency Title, Written   by Hand  {Enter}",
  );
  await userEvent.click(screen.getByRole("button", { name: /continue/i }));

  // Whitespace is tidied as the backend does; the words are not touched.
  expect(onContinue).toHaveBeenCalledWith(
    "My Own SEO Agency Title, Written by Hand",
  );
});

it("puts the title back when the edit is cancelled", async () => {
  renderStep();

  await userEvent.click(screen.getByRole("button", { name: "Edit title 2" }));
  await userEvent.type(
    screen.getByRole("textbox", { name: "Title 2" }),
    " extra{Escape}",
  );

  expect(screen.getByRole("radio", { name: TITLES[1] })).toBeInTheDocument();
});

it("scores each title against the gate's keyphrase", () => {
  renderStep();

  expect(screen.getAllByText("Has “seo agency”")).toHaveLength(TITLES.length);
  expect(screen.getByText("52 characters")).toBeInTheDocument();
});

it("says the run's choices in one line at every width: the search intent has no other place", () => {
  render(
    <TitleStep
      instruction="Select a title"
      titles={TITLES}
      gate={GATE}
      context={["seo agency", "commercial", null, "how-to-guide"]}
      onContinue={jest.fn()}
      onRegenerate={jest.fn()}
    />,
  );

  expect(
    screen.getByText("seo agency · commercial · how-to-guide"),
  ).not.toHaveClass("md:hidden");
});

it("shows each score as a three-part meter, and a failing check at weight 500", () => {
  renderStep();

  const meter = (title: string) =>
    Array.from(
      card(title).querySelector('[data-slot="meter"]')?.children ?? [],
    ).map((segment) => segment.classList.contains("bg-foreground"));
  expect(meter(TITLES[1])).toEqual([true, true, true]);
  expect(meter(TITLES[3])).toEqual([true, true, false]);
  expect(screen.getByText("15 characters, under 50")).toHaveClass(
    "font-medium",
    "text-foreground",
  );
  expect(screen.getAllByText("Reads clearly")[0]).not.toHaveClass(
    "font-medium",
  );
});

it("marks the selected card with the inset fill, the edge and weight 500, and the keyword in bold", async () => {
  renderStep();

  expect(radio(TITLES[1])).toBeChecked();
  expect(card(TITLES[1])).toHaveClass("border-primary", "bg-surface-inset");
  expect(card(TITLES[1]).querySelector("label")).toHaveClass("font-medium");
  expect(card(TITLES[0])).not.toHaveClass("border-primary");
  expect(card(TITLES[0])).toHaveClass("bg-card");
  expect(card(TITLES[0]).querySelector("label")).not.toHaveClass("font-medium");
  // Every title has the keyword in bold, where the score finds it.
  expect(
    within(card(TITLES[0])).getByText("SEO Agency", { selector: "b" }),
  ).toBeInTheDocument();

  await userEvent.click(radio(TITLES[0]));
  expect(radio(TITLES[0])).toBeChecked();
  expect(card(TITLES[0])).toHaveClass("border-primary", "bg-surface-inset");
  expect(card(TITLES[1])).not.toHaveClass("border-primary");
});

// From 1024 px the panel is the pane beside the titles.
const pane = () => screen.getByRole("complementary", { name: PANE });
// Under 1024 px its lower part follows Continue.
const below = () => screen.getByRole("region", { name: PANE });

it("says what the panel is for, and what the top ten's titles have in common", () => {
  renderStep();

  expect(
    within(pane()).getByRole("heading", { level: 2, name: PANE }),
  ).toBeInTheDocument();
  expect(
    within(pane()).getByText(/^Your title will sit among these/),
  ).toBeInTheDocument();
  const fact = (term: string) =>
    within(pane()).getByText(term, { selector: "dt" }).nextElementSibling;
  expect(fact("Keyword")).toHaveTextContent(
    "2 of 4 use “seo agency”; 1 leads with it",
  );
  // 43, 45, 54 and 68: between 45 and 54; 68 is past 59.
  expect(fact("Length")).toHaveTextContent(
    "Typically 50 characters; 1 runs past 59 and may be cut off",
  );
  expect(fact("Shared word")).toHaveTextContent(
    "“small” in 3 of 4; also “business”",
  );
  expect(pane()).toHaveTextContent(
    "From the search this run analysed. The keyword is in bold.",
  );
});

it("leaves out the keyword fact and the comparison without a keyphrase", () => {
  renderStep(jest.fn(), { ...GATE, focus_keyphrase: null });

  expect(within(pane()).queryByText("Keyword")).not.toBeInTheDocument();
  expect(within(pane()).getByText("Length")).toBeInTheDocument();
  expect(pane()).not.toHaveTextContent("The keyword is in bold.");
  expect(pane()).not.toHaveTextContent("the keyword,");
});

const PLACES: [string, () => HTMLElement][] = [
  ["beside the titles", pane],
  ["after Continue", below],
];

it.each(PLACES)(
  "shows the pick against the top ten %s, and follows the selection",
  async (_, panel) => {
    renderStep();

    const pick = () =>
      within(panel()).getByText("Your pick").parentElement
        ?.parentElement as HTMLElement;
    expect(pick()).toHaveTextContent(TITLES[1]);
    expect(pick()).toHaveTextContent("54 characters");
    expect(pick()).toHaveTextContent("Leads with the keyword, like position 1");
    expect(
      within(pick()).getByText("SEO Agency", { selector: "b" }),
    ).toBeInTheDocument();

    await userEvent.click(radio(TITLES[0]));
    expect(pick()).toHaveTextContent("52 characters");
    expect(pick()).toHaveTextContent(
      "Has the keyword after other words, like position 2",
    );
  },
);

it("lists the top ten with the keyword, the lengths and the letter marks", () => {
  renderStep();

  // Once beside the titles and once after Continue, the same list.
  expect(mockShown).toHaveLength(2);
  expect(mockShown[0]).toBe(mockShown[1]);
  const props = mockShown[0];
  expect(props.results).toEqual(GATE.serp_titles);
  expect(props.heading).toBeNull();
  expect(props.keyphrase).toBe("seo agency");
  expect(props.marks).toBe(true);
  const measure = props.measure as (title: string) => unknown;
  expect(measure(GATE.serp_titles[2].title)).toEqual({
    length: 68,
    cutOff: true,
  });
  expect(measure(GATE.serp_titles[3].title)).toEqual({
    length: 43,
    cutOff: false,
  });
});

it("has no panel when the run has no search results", () => {
  renderStep(jest.fn(), { ...GATE, serp_titles: [] });

  expect(mockShown).toEqual([]);
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: PANE })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: PANE })).not.toBeInTheDocument();
});

it("puts the facts above the titles under 1024 px, and the rest after Continue, with no sheet", () => {
  renderStep();

  // Above the titles, on narrow screens only: a link down to the panel, and the facts.
  const link = screen.getByRole("link", { name: PANE });
  expect(link).toHaveAttribute("href", "#top-ten-titles");
  const first = link.parentElement?.parentElement as HTMLElement;
  expect(first).toHaveClass("lg:hidden");
  expect(
    within(first).getByText("Keyword").nextElementSibling,
  ).toHaveTextContent("2 of 4 use “seo agency”; 1 leads with it");
  const titles = screen.getByRole("group", { name: "Titles" });
  expect(
    first.compareDocumentPosition(titles) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();

  // After Continue, on narrow screens only: the panel's heading, the pick and the ten, no facts.
  const proceed = screen.getByRole("button", { name: "Continue" });
  expect(below()).toHaveClass("lg:hidden");
  expect(
    proceed.compareDocumentPosition(below()) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(within(below()).getByRole("heading", { name: PANE })).toHaveAttribute(
    "id",
    "top-ten-titles",
  );
  expect(within(below()).getByText("Your pick")).toBeInTheDocument();
  expect(
    within(below()).getByRole("list", { name: "Top search results" }),
  ).toBeInTheDocument();
  expect(within(below()).queryByText("Keyword")).not.toBeInTheDocument();

  // The pane beside the titles shows from 1024 px only, and nothing opens it as a sheet.
  expect(pane()).toHaveClass("hidden", "lg:block");
  expect(screen.queryByRole("button", { name: PANE })).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Top search results" }),
  ).not.toBeInTheDocument();
});
