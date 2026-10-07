import { act, render, screen, within } from "@testing-library/react";
import { WorkflowStepIndicator } from "@/components/generate-content/workflow-step-indicator";
import type { RunStage } from "@/lib/generate-content/run-stages";
import { WORKFLOW_STEPS } from "@/lib/generate-content/workflow-steps";

const NOW = 1_000_000;

beforeEach(() => jest.useFakeTimers({ now: NOW }));
afterEach(() => jest.useRealTimers());

// What the run chose on the way to the Title step, and a title for once it is picked.
const CHOICES = [
  "garden planner",
  "vegetable garden planner",
  "How-to guide",
  "How to Use a Vegetable Garden Planner to Map Your Beds",
];

const writingTitles: RunStage = {
  id: "titles",
  label: "Writing five titles",
  state: "active",
  startedAt: NOW - 12_000,
};

function renderSteps(
  current: number,
  props: { choices?: string[]; running?: RunStage } = {},
) {
  render(
    <WorkflowStepIndicator
      steps={WORKFLOW_STEPS}
      current={current}
      choices={props.choices ?? CHOICES}
      running={props.running}
    />,
  );
  const nav = screen.getByRole("navigation", { name: "Article steps" });
  return { nav, steps: within(nav).getAllByRole("listitem") };
}

describe("WorkflowStepIndicator", () => {
  it("shows every step as done, current or not started, in words too", () => {
    const { steps } = renderSteps(3);

    expect(steps.map((step) => step.getAttribute("data-state"))).toEqual([
      "done",
      "done",
      "done",
      "current",
      "not-started",
      "not-started",
    ]);
    // The markers are for the eye (a check, the number on the accent, a hollow number); a
    // screen reader hears the state after the step's name.
    expect(steps[0]).toHaveTextContent(/^Search keyword.*, done$/);
    expect(steps[3]).toHaveTextContent(/^4Title.*, current step$/);
    expect(steps[4]).toHaveTextContent(/^5Content outline, not started$/);
    expect(steps[5]).toHaveTextContent(/^6Article, not started$/);
    // A done step's marker is a check, not its number.
    expect(steps[0].querySelector("svg")).not.toBeNull();
    expect(steps[3].querySelector("svg")).toBeNull();
  });

  it("marks the current step alone with aria-current", () => {
    const { nav, steps } = renderSteps(3);

    expect(steps[3]).toHaveAttribute("aria-current", "step");
    expect(nav.querySelectorAll("[aria-current]")).toHaveLength(1);
  });

  it("says what was chosen under each done step, and nothing under the ones to come", () => {
    const { steps } = renderSteps(3);

    expect(within(steps[0]).getByText("garden planner")).toBeInTheDocument();
    expect(
      within(steps[1]).getByText("vegetable garden planner"),
    ).toBeInTheDocument();
    expect(within(steps[2]).getByText("How-to guide")).toBeInTheDocument();
    // The whole choice on hover, where the column cuts it short.
    expect(
      within(steps[1]).getByText("vegetable garden planner"),
    ).toHaveAttribute("title", "vegetable garden planner");
    // The current step says what to do, not a choice it doesn't have yet.
    expect(
      within(steps[3]).getByText("Choose one of five"),
    ).toBeInTheDocument();
    expect(screen.queryByText(CHOICES[3])).toBeNull();
  });

  it("is no control yet: no link and no button, Back included", () => {
    const { nav } = renderSteps(3);

    expect(within(nav).queryByRole("link")).toBeNull();
    expect(within(nav).queryByRole("button")).toBeNull();
  });

  it("gives the narrow form its words: the step, its place and the next one", () => {
    const { nav, steps } = renderSteps(3);

    // One line under the markers, hidden from screen readers: the list already says it.
    const summary = nav.querySelector("p");
    expect(summary).toHaveTextContent("Title · Step 4 of 6");
    expect(summary).toHaveTextContent("Next: Content outline");
    expect(summary).toHaveAttribute("aria-hidden", "true");
    // The row answers to its own width (a phone, the editor's column): under 42 rem the names
    // are for screen readers only and this line shows. jsdom lays nothing out, so the classes say it.
    expect(nav).toHaveClass("@container");
    expect(summary).toHaveClass("@2xl:hidden");
    expect(within(steps[3]).getByText("Title").parentElement).toHaveClass(
      "@max-2xl:sr-only",
    );
  });

  it("shows the running stage and its time on the current step while the page waits", () => {
    const { steps, nav } = renderSteps(3, { running: writingTitles });

    expect(steps[3]).toHaveAttribute("aria-current", "step");
    expect(
      within(steps[3]).getByText("Writing five titles · 12 s"),
    ).toBeInTheDocument();
    // In place of the step's hint, with the choices so far still above it.
    expect(screen.queryByText("Choose one of five")).toBeNull();
    expect(within(steps[2]).getByText("How-to guide")).toBeInTheDocument();
    expect(nav.querySelector("p")).toHaveTextContent("Title · Step 4 of 6");

    act(() => jest.advanceTimersByTime(3000));
    expect(
      within(steps[3]).getByText("Writing five titles · 15 s"),
    ).toBeInTheDocument();
  });

  it("names a running stage with no start time without a time", () => {
    const { steps } = renderSteps(3, {
      running: { ...writingTitles, startedAt: undefined },
    });

    expect(
      within(steps[3]).getByText("Writing five titles"),
    ).toBeInTheDocument();
  });

  it("stays on the Article step: five steps done with their choices, no next step", () => {
    const { steps, nav } = renderSteps(5);

    expect(steps.map((step) => step.getAttribute("data-state"))).toEqual([
      "done",
      "done",
      "done",
      "done",
      "done",
      "current",
    ]);
    expect(steps[5]).toHaveAttribute("aria-current", "step");
    expect(within(steps[3]).getByText(CHOICES[3])).toBeInTheDocument();
    // The outline step has no choice to show: its name and state only.
    expect(steps[4]).toHaveTextContent(/^Content outline, done$/);
    const summary = nav.querySelector("p");
    expect(summary).toHaveTextContent("Article · Step 6 of 6");
    expect(summary).not.toHaveTextContent("Next:");
  });

  it("starts on the first step with nothing done", () => {
    const { steps, nav } = renderSteps(0, { choices: [] });

    expect(steps[0]).toHaveAttribute("aria-current", "step");
    expect(steps[0]).toHaveTextContent(/^1Search keyword.*, current step$/);
    expect(
      steps.slice(1).every((step) => step.dataset.state === "not-started"),
    ).toBe(true);
    expect(nav.querySelector("p")).toHaveTextContent(
      "Search keyword · Step 1 of 6",
    );
    expect(nav.querySelector("p")).toHaveTextContent("Next: Select keyword");
  });
});
