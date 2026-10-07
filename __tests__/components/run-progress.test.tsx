import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RunProgress } from "@/components/generate-content/run-progress";
import type {
  RunStage,
  RunStageDetail,
} from "@/lib/generate-content/run-stages";

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

  it("shows a timed-out run's failed stage and the notice, with no clock (E22)", () => {
    const stopped = analysis(60_000).map((stage) =>
      stage.state === "active"
        ? { ...stage, state: "failed" as const, endedAt: 1 }
        : stage.state === "pending"
          ? { ...stage, state: "skipped" as const }
          : stage,
    );
    render(<RunProgress stages={stopped} timedOut />);
    expect(screen.getByText("Failed")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Timed out");
  });

  it("says Timed out on the dock's one line", () => {
    render(<RunProgress stages={analysis(2000)} variant="compact" timedOut />);
    expect(screen.getByText("Timed out", { selector: "span" })).toBeVisible();
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

// rext-control#694, option A: the box says what each stage will do, is doing and found.
describe("RunProgress, saying what it found", () => {
  const RESULTS = Array.from({ length: 10 }, (_, index) => ({
    position: index + 1,
    title: `Result ${index + 1}`,
    site: `site-${index + 1}.example`,
  }));

  const DETAILS: Record<string, RunStageDetail> = {
    "search-results": {
      live: "Looking up Google’s first page for “tea” in France.",
      result: "10 results from 8 sites · 6 questions people ask",
      items: { kind: "results", items: RESULTS, preview: 3 },
    },
    competitors: {
      waiting: "What each site on the first page offers.",
      live: "Working out what each of the 8 sites offers.",
      result: "8 competing sites · searchers want to learn",
      items: { kind: "chips", items: ["almanac.com", "growveg.com"] },
    },
    measure: {
      waiting: "Monthly searches and how hard it is to rank.",
      live: "Looking up monthly searches.",
      result: "1,900 searches a month",
    },
  };

  const HEADER = {
    title: "Analysing “tea”",
    subtitle: "Google · France",
    startedAt: NOW - 17_000,
  };

  const rows = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>("li[data-state]"));
  const announced = (container: HTMLElement) =>
    container.querySelector('[aria-live="polite"]')?.textContent;

  it("has a title, the run's clock in the mono face and its usual total", () => {
    render(
      <RunProgress stages={analysis(2000)} header={HEADER} details={DETAILS} />,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Analysing “tea”" }),
    ).toBeVisible();
    expect(screen.getByText("Google · France")).toBeVisible();
    const clock = screen.getByRole("timer");
    expect(clock).toHaveTextContent("0:17");
    expect(clock).toHaveAccessibleName("17 seconds so far");
    expect(clock).toHaveClass("font-mono", "num");
    // 10 s, 5 s and 15 s: the typical times until the stages have run here.
    expect(screen.getByText("usually about 30 s")).toBeVisible();
    // The box is named by its title.
    expect(
      screen.getByRole("region", { name: "Analysing “tea”" }),
    ).toBeVisible();
  });

  it("counts the clock each second while a stage runs, and stops with the run", () => {
    const { rerender } = render(
      <RunProgress stages={analysis(2000)} header={HEADER} />,
    );
    act(() => jest.advanceTimersByTime(63_000));
    expect(screen.getByRole("timer")).toHaveTextContent("1:20");
    const settled = analysis(2000).map((stage) => ({
      ...stage,
      state: "complete" as const,
      startedAt: stage.startedAt ?? NOW,
      endedAt: NOW + 25_000,
    }));
    rerender(<RunProgress stages={settled} header={HEADER} />);
    act(() => jest.advanceTimersByTime(60_000));
    // From 17 s before now to 25 s after it.
    expect(screen.getByRole("timer")).toHaveTextContent("0:42");
  });

  it("has no clock for a run picked up mid-way, whose start it never saw", () => {
    render(
      <RunProgress
        stages={analysis(2000)}
        header={{ title: "Analysing “tea”" }}
      />,
    );
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.getByText("usually about 30 s")).toBeVisible();
  });

  it("counts the finished stages on its bar, in words too", () => {
    render(<RunProgress stages={analysis(2000)} header={HEADER} />);
    const bar = screen.getByRole("progressbar", { name: "Progress" });
    expect(bar).toHaveAttribute("aria-valuenow", "33");
    expect(bar).toHaveAttribute("aria-valuetext", "1 of 3 steps done");
    // The accent, on the fill only.
    expect(bar.firstElementChild).toHaveClass("bg-primary");
    expect(bar.firstElementChild).toHaveStyle({
      transform: "translateX(-67%)",
    });
  });

  it("adds what the running stage has done to the bar: the titles written", () => {
    const stages: RunStage[] = [
      {
        id: "titles",
        label: "Writing five titles",
        state: "active",
        startedAt: NOW - 7000,
      },
      { id: "title-checks", label: "Checking each title", state: "pending" },
    ];
    render(
      <RunProgress
        stages={stages}
        header={{ title: "Writing titles for “tea”", startedAt: NOW - 7000 }}
        details={{
          titles: {
            live: "3 of 5 written.",
            progress: { done: 3, total: 5, label: "titles written" },
          },
        }}
      />,
    );
    const bar = screen.getByRole("progressbar");
    // Three fifths of the first of two stages.
    expect(bar).toHaveAttribute("aria-valuenow", "30");
    expect(bar).toHaveAttribute("aria-valuetext", "3 of 5 titles written");
    expect(screen.getByText("usually about 12 s")).toBeVisible();
  });

  it("says what a waiting stage will do, in grey, with its usual time", () => {
    const { container } = render(
      <RunProgress stages={analysis(2000)} header={HEADER} details={DETAILS} />,
    );
    const waiting = rows(container)[2];
    expect(waiting).toHaveAttribute("data-state", "pending");
    expect(waiting).toHaveTextContent("about 15 s");
    const line = screen.getByText(
      "Monthly searches and how hard it is to rank.",
    );
    expect(waiting).toContainElement(line);
    expect(line).toHaveClass("text-muted-foreground");
    // Not what it would say while running or once done.
    expect(waiting).not.toHaveTextContent("Looking up monthly searches.");
    expect(waiting).not.toHaveTextContent("1,900 searches a month");
  });

  it("shows the running stage's live line and the things it is working on, on the inset fill", () => {
    const { container } = render(
      <RunProgress stages={analysis(2000)} header={HEADER} details={DETAILS} />,
    );
    const running = rows(container)[1];
    expect(running).toHaveClass("bg-surface-inset");
    expect(running).toHaveTextContent("2 s of about 5 s");
    expect(running).toHaveTextContent(
      "Working out what each of the 8 sites offers.",
    );
    expect(running).toHaveTextContent("almanac.com");
    expect(running).toHaveTextContent("growveg.com");
    expect(running).not.toHaveTextContent("8 competing sites");
    // The accent on the running stage's icon, and nowhere else in the rows.
    expect(running.querySelector("svg")).toHaveClass("text-primary");
    expect(rows(container)[0].querySelector("svg")).not.toHaveClass(
      "text-primary",
    );
  });

  it("keeps a finished stage's result line and its top three results, the rest a click away", async () => {
    const { container } = render(
      <RunProgress stages={analysis(2000)} header={HEADER} details={DETAILS} />,
    );
    const done = rows(container)[0];
    expect(done).toHaveTextContent(
      "10 results from 8 sites · 6 questions people ask",
    );
    expect(done).not.toHaveTextContent("Looking up Google’s first page");
    expect(done).toHaveTextContent("Result 3");
    expect(done).toHaveTextContent("site-3.example");
    expect(done).not.toHaveTextContent("Result 4");

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const more = screen.getByRole("button", { name: "Show all 10 results" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    await user.click(more);
    expect(done).toHaveTextContent("Result 10");
    const fewer = screen.getByRole("button", { name: "Show the top 3" });
    expect(fewer).toHaveAttribute("aria-expanded", "true");
    await user.click(fewer);
    expect(done).not.toHaveTextContent("Result 4");
  });

  it("offers no more results than there are", () => {
    render(
      <RunProgress
        stages={analysis(2000)}
        details={{
          "search-results": {
            items: { kind: "results", items: RESULTS.slice(0, 3), preview: 3 },
          },
        }}
      />,
    );
    expect(screen.getByText("Result 3")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Show/ })).toBeNull();
  });

  it("shows a failed or skipped stage with no line of its own", () => {
    const stopped = analysis(2000).map((stage) =>
      stage.state === "active"
        ? { ...stage, state: "failed" as const, endedAt: NOW }
        : stage.state === "pending"
          ? { ...stage, state: "skipped" as const }
          : stage,
    );
    const { container } = render(
      <RunProgress stages={stopped} header={HEADER} details={DETAILS} />,
    );
    const [, failed, skipped] = rows(container);
    expect(failed).toHaveTextContent("Finding competitors, failedFailed");
    expect(failed).not.toHaveTextContent("Working out");
    expect(failed).not.toHaveTextContent("almanac.com");
    expect(skipped).toHaveTextContent("Measuring the keyword, skippedSkipped");
    expect(skipped).not.toHaveTextContent("Monthly searches");
  });

  it("shows the titles as rows: the checks of a written one, the one being written, the next", () => {
    const stages: RunStage[] = [
      {
        id: "titles",
        label: "Writing five titles",
        state: "active",
        startedAt: NOW - 7000,
      },
      { id: "title-checks", label: "Checking each title", state: "pending" },
    ];
    const { container } = render(
      <RunProgress
        stages={stages}
        details={{
          titles: {
            live: "2 of 4 written.",
            items: {
              kind: "titles",
              rows: [
                {
                  title: "Tea for Beginners: What to Brew First",
                  state: "written",
                  checks: [
                    { label: "Has the keyword", met: true },
                    { label: "37 characters, under 50", met: false },
                  ],
                },
                {
                  title: "How to Brew Loose Leaf Tea at Home",
                  state: "written",
                  checks: [{ label: "Has the keyword", met: true }],
                  recommended: true,
                  reason: "It answers what most searchers ask first.",
                },
                { title: "The Tea Guide for", state: "writing", checks: [] },
                { title: "Fourth title", state: "next", checks: [] },
              ],
            },
          },
        }}
      />,
    );
    const titles = Array.from(
      rows(container)[0].querySelectorAll<HTMLElement>("ol > li"),
    );
    expect(titles).toHaveLength(4);
    expect(titles[0]).toHaveTextContent(
      "1Tea for Beginners: What to Brew First",
    );
    expect(titles[0]).toHaveTextContent("Has the keyword");
    // A failed check says so in words, not by colour.
    expect(titles[0]).toHaveTextContent("37 characters, under 50");
    expect(titles[1]).toHaveTextContent("Recommended");
    expect(titles[1]).toHaveTextContent(
      "It answers what most searchers ask first.",
    );
    expect(titles[0]).not.toHaveTextContent("Recommended");
    expect(titles[2]).toHaveTextContent("The Tea Guide for…Being written");
    expect(titles[3]).toHaveTextContent("4Fourth titleNext");
    expect(screen.getByText("Fourth title")).toHaveClass(
      "text-muted-foreground",
    );
  });

  it("lists the outline's headings under the stage that writes them", () => {
    const stages: RunStage[] = [
      {
        id: "keyword-groups",
        label: "Grouping the keywords",
        state: "complete",
        startedAt: NOW - 9000,
        endedAt: NOW - 3000,
      },
      {
        id: "outline",
        label: "Outlining",
        state: "active",
        startedAt: NOW - 3000,
      },
    ];
    const { container } = render(
      <RunProgress
        stages={stages}
        details={{
          "keyword-groups": { result: "26 phrases in 5 groups." },
          outline: {
            live: "Writing the sections: 2 so far.",
            items: { kind: "lines", items: ["Pick your beds", "Map the rows"] },
          },
        }}
      />,
    );
    const [groups, outline] = rows(container);
    expect(groups).toHaveTextContent("26 phrases in 5 groups.");
    expect(outline).toHaveTextContent("Writing the sections: 2 so far.");
    expect(outline).toHaveTextContent("1Pick your beds2Map the rows");
  });

  it("announces the finished stage's result line, then the stage that starts", () => {
    const { container, rerender } = render(
      <RunProgress stages={analysis(2000)} header={HEADER} details={DETAILS} />,
    );
    expect(announced(container)).toBe(
      "Reading the search results, done: 10 results from 8 sites, 6 questions people ask. Finding competitors",
    );

    // The next stage: the one before it is announced, the first one's line is not said again.
    const next = analysis(2000).map((stage) =>
      stage.id === "competitors"
        ? { ...stage, state: "complete" as const, endedAt: NOW }
        : stage.id === "measure"
          ? { ...stage, state: "active" as const, startedAt: NOW }
          : stage,
    );
    rerender(<RunProgress stages={next} header={HEADER} details={DETAILS} />);
    expect(announced(container)).toBe(
      "Finding competitors, done: 8 competing sites, searchers want to learn. Measuring the keyword",
    );

    // The gate: every stage ends at once, and the last one's line is the news.
    const settled = next.map((stage) => ({
      ...stage,
      state: "complete" as const,
      startedAt: stage.startedAt ?? NOW,
      endedAt: stage.id === "measure" ? NOW + 9000 : stage.endedAt,
    }));
    rerender(
      <RunProgress stages={settled} header={HEADER} details={DETAILS} />,
    );
    expect(announced(container)).toBe(
      "Measuring the keyword, done: 1,900 searches a month",
    );
  });

  it("announces only the stage that starts when the one before it found nothing to say", () => {
    const { container } = render(
      <RunProgress
        stages={analysis(2000)}
        details={{ competitors: DETAILS.competitors }}
      />,
    );
    expect(announced(container)).toBe("Finding competitors");
  });

  it("doesn't read the rows out: the found things sit outside the live region", () => {
    const { container } = render(
      <RunProgress stages={analysis(2000)} header={HEADER} details={DETAILS} />,
    );
    expect(container.querySelectorAll("[aria-live]")).toHaveLength(1);
    expect(announced(container)).not.toContain("almanac.com");
    expect(announced(container)).not.toContain("Result 1");
  });

  it("says the page can be left, inside the box", () => {
    render(
      <RunProgress
        stages={analysis(2000)}
        header={HEADER}
        footer="You can leave this page."
      />,
    );
    expect(
      screen.getByRole("region", { name: "Analysing “tea”" }),
    ).toContainElement(screen.getByText("You can leave this page."));
  });

  it("still says it is still working, with Cancel, under the box", async () => {
    const onCancel = jest.fn();
    render(
      <RunProgress
        stages={analysis(8000)}
        header={HEADER}
        details={DETAILS}
        onCancel={onCancel}
      />,
    );
    expect(
      screen.getByText(
        "Still working. Finding competitors usually takes about 5 s.",
      ),
    ).toBeVisible();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("is the plain list without a header: no title, no bar, no region", () => {
    render(<RunProgress stages={analysis(2000)} />);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("keeps the dock's one line when it is given what the stages found", () => {
    render(
      <RunProgress
        stages={analysis(2000)}
        variant="compact"
        header={HEADER}
        details={DETAILS}
        footer="You can leave this page."
      />,
    );
    expect(screen.queryByRole("listitem")).toBeNull();
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.queryByText("You can leave this page.")).toBeNull();
    expect(
      screen.getByText("Finding competitors", { selector: "span" }),
    ).toBeVisible();
    expect(screen.getByText("2 s")).toBeVisible();
  });
});
