/**
 * The steps while their run fills them in (rext-control#694, the second pass): the Select keyword
 * step during the analysis and the Title step while the titles are written, each in its own layout
 * with the run's stages beside it; the stages as one line on a phone; and the wait's plain box when
 * a filling view throws.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  FillBoundary,
  FillProgressBox,
  FillProgressStrip,
  StartAtTop,
} from "@/components/generate-content/fill-progress";
import { SuggestionsFilling } from "@/components/generate-content/suggestions";
import { TitleStepFilling } from "@/components/generate-content/title-step";
import {
  describeRun,
  type RunFindings,
} from "@/lib/generate-content/run-findings";
import { startStages } from "@/lib/generate-content/run-stages";
import { fillTitleRows } from "@/lib/generate-content/step-fill";

const KEYWORD = "vegetable garden planner";

const results = [
  {
    position: 1,
    title: "Vegetable Garden Planner | The Old Farmer's Almanac",
    domain: "almanac.com",
    url: "https://almanac.com/planner",
  },
  {
    position: 2,
    title: "Garden Planner: Plan Your Vegetable Garden",
    domain: "growveg.com",
    url: "https://growveg.com/",
  },
];

const stagesNode = <p>The run's stages</p>;
const stripNode = <p>The run's stages, one line</p>;

describe("the Select keyword step while its analysis runs", () => {
  const stages = startStages("analysis", 1);
  const renderStep = (findings: RunFindings) =>
    render(
      <SuggestionsFilling
        keyword={KEYWORD}
        findings={findings}
        stages={stages}
        progress={stagesNode}
        strip={stripNode}
      />,
    );

  it("shows the keyword at once, each figure waiting for its step", () => {
    renderStep({});
    const card = screen.getByRole("region", { name: KEYWORD });
    expect(within(card).getByText("Searched keyword")).toBeVisible();
    // Monthly searches, difficulty, backlinks and referring domains wait for the measuring.
    expect(within(card).getAllByText("Measured next")).toHaveLength(4);
    expect(within(card).getByText("From the competing sites")).toBeVisible();
    // Nothing acts before the analysis ends, and the button says why.
    const next = within(card).getByRole("button", {
      name: /continue with this keyword/i,
    });
    expect(next).toBeDisabled();
    expect(next).toHaveAccessibleDescription("Ready when the analysis ends");
    // The stages head the side pane; no results yet, so no list under them.
    const pane = screen.getByRole("complementary", {
      name: "Top search results",
    });
    expect(within(pane).getByText("The run's stages")).toBeVisible();
    expect(within(pane).queryByRole("link")).toBeNull();
    expect(screen.getByText("The run's stages, one line")).toBeVisible();
    // The list's shape stands where the results will (task 834): ten rows to come, and the line
    // that says what the list is.
    const waiting = pane.querySelector('[data-slot="serp-snapshot-skeleton"]');
    expect(waiting).toHaveAttribute("aria-busy", "true");
    expect(waiting?.querySelectorAll("li")).toHaveLength(10);
    expect(
      within(pane).getByText(
        "The pages Google shows first for this keyword. Your article will compete with them.",
      ),
    ).toBeVisible();
    // And the keyword table's, under the card.
    expect(
      screen.getByRole("region", { name: "Other keywords" }),
    ).toHaveAttribute("aria-busy", "true");
  });

  it("fills in: the results first, then the intent, then the figures", () => {
    const { rerender } = renderStep({ results });
    const pane = screen.getByRole("complementary", {
      name: "Top search results",
    });
    expect(
      within(pane).getByText(
        "Vegetable Garden Planner | The Old Farmer's Almanac",
      ),
    ).toBeVisible();
    // The results took the placeholder's place.
    expect(
      pane.querySelector('[data-slot="serp-snapshot-skeleton"]'),
    ).toBeNull();
    expect(within(pane).getByText("almanac.com")).toBeVisible();
    expect(screen.getAllByText("Measured next")).toHaveLength(4);

    const filling = (findings: RunFindings) => (
      <SuggestionsFilling
        keyword={KEYWORD}
        findings={findings}
        stages={stages}
        progress={stagesNode}
        strip={stripNode}
      />
    );
    rerender(filling({ results, intent: "informational" }));
    expect(screen.getByText("Informational")).toBeVisible();
    expect(screen.queryByText("From the competing sites")).toBeNull();

    rerender(
      filling({
        results,
        intent: "informational",
        metrics: {
          difficulty: 28,
          volume: 1900,
          volumeStatus: null,
          backlinks: 12,
          referringDomains: 9,
        },
      }),
    );
    expect(screen.queryByText("Measured next")).toBeNull();
    expect(screen.getByText("12")).toBeVisible();
    expect(screen.getByText("9")).toBeVisible();
    // Still the wait: the step itself takes over when the run ends.
    expect(
      screen.getByRole("button", { name: /continue with this keyword/i }),
    ).toBeDisabled();
  });
});

describe("the Title step while its titles are written", () => {
  const run = { phase: "titles" as const, stages: startStages("titles", 1) };
  const rowsFor = (findings: RunFindings) =>
    fillTitleRows(describeRun(run, findings, { keyword: KEYWORD }));
  const renderStep = (findings: RunFindings, shown = results) =>
    render(
      <TitleStepFilling
        context={[KEYWORD, "informational", "How-to guide"]}
        rows={rowsFor(findings)}
        keyphrase={KEYWORD}
        results={shown}
        progress={stagesNode}
        strip={stripNode}
      />,
    );
  const skeletons = (within_: HTMLElement) =>
    within_.querySelectorAll('[data-slot="skeleton"]');
  const titles = () =>
    within(screen.getByRole("list", { name: "Titles, being written" }))
      .getAllByRole("listitem")
      .map((row) => row.textContent);

  it("holds the five places before the first title is begun", () => {
    renderStep({});
    expect(
      screen.getByRole("heading", { name: "Select a title" }),
    ).toBeVisible();
    expect(
      screen.getByText(`${KEYWORD} · informational · How-to guide`),
    ).toBeVisible();
    expect(titles()).toEqual([
      "First titleNext",
      "Second titleNext",
      "Third titleNext",
      "Fourth titleNext",
      "Fifth titleNext",
    ]);
    for (const name of ["Regenerate", "Continue"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toBeDisabled();
      expect(button).toHaveAccessibleDescription(
        "You can pick one once all are written and checked.",
      );
    }
  });

  it("gives each title its row as it is written, with its score", () => {
    renderStep({
      drafts: [
        {
          title: "Vegetable Garden Planner: Map Your Beds in One Afternoon",
          complete: true,
          recommended: true,
          reason: "It answers what most searchers ask first.",
        },
        {
          title: "How to Use a Vegetable Garden",
          complete: false,
          recommended: false,
          reason: null,
        },
      ],
    });
    const rows = within(
      screen.getByRole("list", { name: "Titles, being written" }),
    ).getAllByRole("listitem");
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveTextContent(
      "Vegetable Garden Planner: Map Your Beds in One Afternoon",
    );
    expect(rows[0]).toHaveTextContent(/of 3 checks/);
    expect(rows[0]).toHaveTextContent("Recommended");
    expect(rows[0]).toHaveTextContent(
      "It answers what most searchers ask first.",
    );
    expect(rows[1]).toHaveTextContent("How to Use a Vegetable Garden");
    expect(rows[1]).toHaveTextContent("Being written");
    expect(rows[2]).toHaveTextContent("Third titleNext");
  });

  it("shows a title to come as a skeleton shaped like its card, never as an empty row (FB3.3)", () => {
    renderStep({
      drafts: [
        {
          title: "Vegetable Garden Planner: Map Your Beds in One Afternoon",
          complete: true,
          recommended: false,
          reason: null,
        },
        {
          title: "How to Use a Vegetable Garden",
          complete: false,
          recommended: false,
          reason: null,
        },
      ],
    });
    const rows = within(
      screen.getByRole("list", { name: "Titles, being written" }),
    ).getAllByRole("listitem");
    // A written title is all there: nothing stands in for it.
    expect(skeletons(rows[0])).toHaveLength(0);
    // The one being written shows its words so far, over bars where its score will be.
    expect(
      within(rows[1]).getByText(/How to Use a Vegetable Garden/),
    ).toBeVisible();
    expect(skeletons(rows[1]).length).toBeGreaterThan(1);
    // One to come: a bar for the title, the radio and the score, and its place and state said
    // for a screen reader only, not shown as words on an otherwise empty card.
    expect(skeletons(rows[2]).length).toBeGreaterThan(3);
    expect(within(rows[2]).getByText("Third title")).toHaveClass("sr-only");
    expect(within(rows[2]).getByText("Next")).toHaveClass("sr-only");
    expect(within(rows[1]).getByText("Being written")).toHaveClass("sr-only");
    for (const bar of skeletons(rows[2])) {
      expect(bar.closest("[aria-hidden='true']")).not.toBeNull();
    }
  });

  it("names the place of a title just begun, which has no words yet", () => {
    renderStep({
      drafts: [
        { title: "", complete: false, recommended: false, reason: null },
      ],
    });
    expect(titles()).toEqual([
      "First titleBeing written",
      "Second titleNext",
      "Third titleNext",
      "Fourth titleNext",
      "Fifth titleNext",
    ]);
  });

  it("has the top ten beside the titles from the start, under the run's stages", () => {
    renderStep({});
    const pane = screen.getByRole("complementary", {
      name: "Top search results",
    });
    expect(within(pane).getByText("The run's stages")).toBeVisible();
    expect(
      within(pane).getByText(/Garden Planner: Plan Your Vegetable Garden/),
    ).toBeVisible();
    expect(skeletons(pane)).toHaveLength(0);
  });

  it("holds the panel's shape under the stages until the search results are there (FB3.3)", () => {
    renderStep({}, []);
    const pane = screen.getByRole("complementary", {
      name: "Top search results",
    });
    expect(within(pane).getByText("The run's stages")).toBeVisible();
    expect(skeletons(pane).length).toBeGreaterThan(8);
    expect(
      within(pane).getByText("The top search results are being read."),
    ).toHaveClass("sr-only");
    expect(
      within(pane).queryByRole("heading", { name: "Top search results" }),
    ).toBeNull();
  });
});

describe("the run's stages beside a step that fills in", () => {
  const run = { phase: "titles" as const, stages: startStages("titles", 1) };
  const view = describeRun(
    run,
    {
      drafts: [
        {
          title: "Vegetable Garden Planner: Map Your Beds in One Afternoon",
          complete: true,
          recommended: false,
          reason: null,
        },
      ],
    },
    { keyword: KEYWORD },
  );

  it("keeps the stages' lines and leaves the titles to the step", () => {
    render(<FillProgressBox stages={run.stages} view={view} />);
    // The live region says the running stage's name too.
    expect(screen.getAllByText("Writing five titles")[0]).toBeVisible();
    expect(screen.getByText("Checking each title")).toBeVisible();
    expect(
      screen.queryByText(
        "Vegetable Garden Planner: Map Your Beds in One Afternoon",
      ),
    ).toBeNull();
  });

  it("is one line on a phone, with the whole list behind All steps", async () => {
    const user = userEvent.setup();
    render(<FillProgressStrip stages={run.stages} view={view} />);
    // The running stage and what it says; the stage to come isn't listed.
    expect(screen.getAllByText("Writing five titles")[0]).toBeVisible();
    expect(screen.queryByText("Checking each title")).toBeNull();

    const toggle = screen.getByRole("button", { name: "All steps" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(screen.getByText("Checking each title")).toBeVisible();
    expect(screen.getByRole("button", { name: "Hide steps" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});

describe("a filling view that throws", () => {
  const Broken = (): never => {
    throw new Error("a field the view didn't expect");
  };

  it("gives way to the wait's own box", () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    render(
      <FillBoundary fallback={<p>The plain progress box</p>}>
        <Broken />
      </FillBoundary>,
    );
    expect(screen.getByText("The plain progress box")).toBeVisible();
    error.mockRestore();
  });
});

describe("a filling wait's start", () => {
  it("is at the top of the page, wherever the step before it was left", () => {
    // The shell's column, scrolled down to the last step's button.
    const column = document.createElement("div");
    const inner = document.createElement("div");
    column.appendChild(inner);
    document.body.appendChild(column);
    let scrolled = 320;
    Object.defineProperty(column, "scrollTop", {
      get: () => scrolled,
      set: (value: number) => {
        scrolled = value;
      },
    });

    render(<StartAtTop />, { container: inner });
    expect(scrolled).toBe(0);
    column.remove();
  });
});
