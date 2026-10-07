import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TitleStep } from "@/components/generate-content/title-step";

// The side pane's list is SerpSnapshot's to test; here only what the step hands it.
// The stage's credits come from the plan catalogue (run-cost.test.tsx); here, which stage it labels.
jest.mock("@/components/generate-content/run-cost", () => ({
  StageCostLabel: ({ stage }: { stage: string }) => <span>· {stage}</span>,
}));

const mockShown: unknown[] = [];
jest.mock("@/components/keywords/serp-snapshot", () => ({
  SerpSnapshot: ({ results }: { results: unknown[] }) => {
    mockShown.push(results);
    return <ol aria-label="Top search results" />;
  },
}));

const TITLES = [
  "How to Choose an SEO Agency: A Guide for Owners 2026",
  "SEO Agency Pricing Explained for Small Business Owners",
  "What an SEO Agency Does and When You Need One Today",
];

const GATE = {
  type: "topic",
  recommendation_reason: "Matches the how-to pages that rank.",
  focus_keyphrase: "seo agency",
  serp_titles: [
    {
      position: 1,
      title: "SEO agency guide",
      domain: "example.com",
      format: "guide",
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

beforeEach(() => {
  mockShown.length = 0;
});

it("starts on the recommended title, with its reason, and continues with it", async () => {
  const onContinue = renderStep();

  expect(screen.getByRole("radio", { name: TITLES[1] })).toBeChecked();
  expect(screen.getByText(GATE.recommendation_reason)).toBeInTheDocument();
  // Each title's count says what it counts (E25).
  expect(screen.getAllByText(/^\d of 3 checks$/)).toHaveLength(TITLES.length);
  // Continue takes the outline's credits, and says so (E25).
  await userEvent.click(
    screen.getByRole("button", { name: "Continue · generate_outline" }),
  );

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

  expect(screen.getAllByText("Has “seo agency”")).toHaveLength(3);
  expect(screen.getByText("52 characters")).toBeInTheDocument();
});

it("shows the search results' top ten beside the titles", () => {
  renderStep();

  expect(mockShown[0]).toEqual(GATE.serp_titles);
  expect(
    screen.getByRole("complementary", { name: "Top search results" }),
  ).toBeInTheDocument();
});

it("has no side pane when the run has no search results", () => {
  renderStep(jest.fn(), { ...GATE, serp_titles: [] });

  expect(mockShown).toEqual([]);
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Top search results" }),
  ).not.toBeInTheDocument();
});

it("opens the search results from the Continue row under 1024 px, with nothing floating over Continue", async () => {
  renderStep();

  const buttons = screen.getAllByRole("button", { name: "Top search results" });
  expect(buttons).toHaveLength(1);
  expect(buttons[0]).not.toHaveClass("fixed");
  const row = screen.getByRole("button", { name: /^continue/i }).parentElement;
  expect(row?.firstElementChild).toBe(buttons[0]);

  await userEvent.click(buttons[0]);
  expect(
    await screen.findByRole("dialog", { name: "Top search results" }),
  ).toBeInTheDocument();
});
