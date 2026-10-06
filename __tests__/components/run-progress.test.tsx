import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RunProgress } from "@/components/generate-content/run-progress";
import type { RunStage } from "@/lib/generate-content/run-stages";

const NOW = 1_000_000;

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  window.localStorage.clear();
});
afterEach(() => jest.useRealTimers());

const analysis = (activeFor: number): RunStage[] => [
  {
    id: "search-results",
    label: "Reading the search results",
    state: "complete",
    startedAt: NOW - activeFor - 9000,
    endedAt: NOW - activeFor,
  },
  {
    id: "competitors",
    label: "Finding competitors",
    state: "active",
    startedAt: NOW - activeFor,
  },
  { id: "measure", label: "Measuring the keyword", state: "pending" },
];

describe("RunProgress", () => {
  it("names each stage with its state and time", () => {
    render(<RunProgress stages={analysis(2000)} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows.map((row) => row.getAttribute("data-state"))).toEqual([
      "complete",
      "active",
      "pending",
    ]);
    expect(rows[0]).toHaveTextContent("Reading the search results, done9 s");
    expect(rows[1]).toHaveTextContent("Finding competitors, running2 s");
    // A waiting stage shows its usual time (the typical 15 s until one has run here).
    expect(rows[2]).toHaveTextContent(
      "Measuring the keyword, waitingabout 15 s",
    );
  });

  it("counts the running stage's time each second", () => {
    render(<RunProgress stages={analysis(2000)} />);
    act(() => jest.advanceTimersByTime(3000));
    expect(screen.getAllByRole("listitem")[1]).toHaveTextContent("5 s");
  });

  it("says it is still working, with Cancel, past 1.5 times the usual time", async () => {
    const onCancel = jest.fn();
    // Finding competitors usually takes about 5 s; 8 s is past 7.5 s.
    render(<RunProgress stages={analysis(8000)} onCancel={onCancel} />);
    expect(
      screen.getByText(
        "Still working. Finding competitors usually takes about 5 s.",
      ),
    ).toBeVisible();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("stays quiet within the usual time", () => {
    render(<RunProgress stages={analysis(2000)} onCancel={jest.fn()} />);
    expect(screen.queryByText(/Still working/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  it("says a timed-out run timed out", () => {
    render(<RunProgress stages={analysis(60_000)} timedOut />);
    expect(screen.getByRole("alert")).toHaveTextContent("Timed out");
    expect(screen.queryByText(/Still working/)).toBeNull();
  });

  it("announces the running stage", () => {
    render(<RunProgress stages={analysis(2000)} />);
    expect(
      screen.getByText("Finding competitors", { selector: "p" }),
    ).toHaveAttribute("aria-live", "polite");
  });

  it("is one line over a bar when compact", () => {
    render(<RunProgress stages={analysis(2000)} variant="compact" />);
    expect(screen.queryByRole("listitem")).toBeNull();
    expect(
      screen.getByText("Finding competitors", { selector: "span" }),
    ).toBeVisible();
    expect(screen.getByText("2 s")).toBeVisible();
  });
});
