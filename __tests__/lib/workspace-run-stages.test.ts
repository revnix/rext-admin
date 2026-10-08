import {
  findFailedEvent,
  workspaceActivity,
  workspaceFindings,
  workspaceRunStages,
  workspaceStageDetails,
} from "@/lib/workspace/workspace-run-stages";
import type { SSEEvent } from "@/types/sse";

// The events rext-backend's workspace pipeline sends, in its order (workspace_pipeline.py).
const at = (seconds: number) =>
  new Date(Date.UTC(2026, 9, 6, 16, 0, seconds)).toISOString();
const event = (
  step: string,
  status: SSEEvent["status"],
  seconds: number,
  message = "",
): SSEEvent => ({
  id: step,
  operation_id: "op-1",
  scope: "workspace",
  step,
  status,
  message,
  timestamp: at(seconds),
});
const states = (events: SSEEvent[]) =>
  workspaceRunStages(events).map((stage) => stage.state);

describe("workspaceRunStages", () => {
  it("names the backend's three reported steps in words", () => {
    expect(workspaceRunStages([]).map((stage) => stage.label)).toEqual([
      "Reading your website",
      "Writing your brand voice and personas",
      "Finding competitors",
    ]);
    expect(states([])).toEqual(["pending", "pending", "pending"]);
  });

  it("moves each stage on its started and completed events, with their times", () => {
    const events = [
      event("scrape.started", "started", 0),
      event("scrape.completed", "completed", 12),
      event("brand_voice.started", "started", 13),
    ];
    expect(states(events)).toEqual(["complete", "active", "pending"]);
    const [scrape, voice] = workspaceRunStages(events);
    expect((scrape.endedAt ?? 0) - (scrape.startedAt ?? 0)).toBe(12_000);
    expect(voice.startedAt).toBe(Date.parse(at(13)));
  });

  it("completes every stage when the pipeline completes", () => {
    const events = [
      event("scrape.started", "started", 0),
      event("scrape.completed", "completed", 10),
      event("brand_voice.started", "started", 11),
      event("brand_voice.completed", "completed", 70),
      event("competitor_discovery.started", "started", 71),
      event("competitor_discovery.completed", "completed", 85),
      event("pipeline.completed", "completed", 86),
    ];
    expect(states(events)).toEqual(["complete", "complete", "complete"]);
  });

  it("fails the running stage and skips the rest when the pipeline fails", () => {
    const events = [
      event("scrape.started", "started", 0),
      event("scrape.failed", "failed", 5, "The website didn't answer."),
      event("pipeline.failed", "failed", 5, "The website didn't answer."),
    ];
    expect(states(events)).toEqual(["failed", "skipped", "skipped"]);
    expect(findFailedEvent(events)?.message).toBe("The website didn't answer.");
  });

  it("skips the later stages at a failed step, without waiting for the pipeline's failure", () => {
    expect(
      states([
        event("scrape.started", "started", 0),
        event("scrape.completed", "completed", 10),
        event("brand_voice.started", "started", 11),
        event(
          "brand_voice.failed",
          "failed",
          20,
          "The brand voice couldn't be read.",
        ),
      ]),
    ).toEqual(["complete", "failed", "skipped"]);
  });

  it("closes earlier stages that never reported, once a later one completes", () => {
    expect(states([event("brand_voice.completed", "completed", 60)])).toEqual([
      "complete",
      "complete",
      "pending",
    ]);
  });

  it("closes a running stage when the next one starts, though its completion was missed", () => {
    const stages = workspaceRunStages([
      event("scrape.started", "started", 0),
      event("brand_voice.started", "started", 20),
    ]);
    expect(stages.map((stage) => stage.state)).toEqual([
      "complete",
      "active",
      "pending",
    ]);
    expect(stages[0].endedAt).toBe(Date.parse(at(20)));
  });

  it("ends a stage closed by a later completion at that completion's time", () => {
    const [scrape] = workspaceRunStages([
      event("scrape.started", "started", 0),
      event("competitor_discovery.completed", "completed", 90),
    ]);
    expect(scrape.state).toBe("complete");
    expect(scrape.endedAt).toBe(Date.parse(at(90)));
  });

  it("has no failed event for a run that is going well", () => {
    expect(
      findFailedEvent([event("scrape.started", "started", 0)]),
    ).toBeUndefined();
  });
});

describe("workspaceFindings and the stages' lines (task 845)", () => {
  const done = (step: string, payload?: Record<string, unknown>): SSEEvent => ({
    ...event(`${step}.completed`, "completed", 10),
    payload,
  });

  it("is empty until a step ends, and for a step that says nothing", () => {
    expect(workspaceFindings([])).toEqual({});
    expect(
      workspaceFindings([
        event("scrape.started", "started", 0),
        done("brand_voice"),
      ]),
    ).toEqual({});
  });

  it("reads what each step found from its own event, and nothing else", () => {
    const findings = workspaceFindings([
      done("scrape", { title: " Acme: anvils ", word_count: 1240, url: "x" }),
      done("brand_voice", {
        brand_name: "Acme",
        about: "Makes anvils.",
        selling_position: "They last.",
        target_audience: ["Smiths", "", 4],
        brand_voice: ["Plain"],
        content_pillar: ["Anvils"],
        personas: [],
      }),
      done("competitor_discovery", { competitors: ["boltco.example", null] }),
    ]);
    expect(findings).toEqual({
      site: { title: "Acme: anvils", words: 1240 },
      voice: {
        brandName: "Acme",
        about: "Makes anvils.",
        sellingPosition: "They last.",
        audience: ["Smiths"],
        tone: ["Plain"],
        pillars: ["Anvils"],
      },
      competitors: ["boltco.example"],
    });
  });

  it("has no voice to show when the step drafted none", () => {
    expect(
      workspaceFindings([done("brand_voice", { personas: [] })]).voice,
    ).toBeUndefined();
  });

  it("says what each stage found, only once it has", () => {
    const before = workspaceStageDetails({}, "acme.example");
    expect(before["workspace-scrape"].result).toBeUndefined();
    expect(before["workspace-scrape"].live).toBe(
      "Opening acme.example and reading what it says.",
    );
    const after = workspaceStageDetails(
      {
        site: { title: "Acme", words: 1 },
        voice: { audience: [], tone: [], pillars: [], about: "x" },
        competitors: [],
      },
      "acme.example",
      [],
    );
    expect(after["workspace-scrape"].result).toBe("“Acme” · 1 word read");
    // None read yet is not "no one": the run can still save a persona.
    expect(after["workspace-brand-voice"].result).toBe("Brand voice drafted");
    expect(after["workspace-competitors"].result).toBe("None found");
  });
});

// ── The follow-up to rext-control#845: what is said before the run ends, and the work as it happens ──

/** An event with its own id and a payload, as the operation's stream sends them. */
const sent = (
  step: string,
  seconds: number,
  payload?: Record<string, unknown>,
): SSEEvent => ({
  ...event(step, step.endsWith("completed") ? "completed" : "started", seconds),
  id: `${step}@${seconds}`,
  payload,
});

describe("what the brand-voice stage says about people", () => {
  const findings = workspaceFindings([
    sent("brand_voice.completed", 20, {
      brand_name: "Acme",
      customer_profile: "Working smiths who forge for a living.",
      brand_voice: ["Plain", "Dry"],
    }),
  ]);

  it("reads who the brand is for from the step's end", () => {
    expect(findings.voice?.customers).toBe(
      "Working smiths who forge for a living.",
    );
  });

  it("doesn't say no one is named while the run can still save someone", () => {
    const line = (people: string[] | undefined, final: boolean) =>
      workspaceStageDetails(findings, "acme.example", people, final)[
        "workspace-brand-voice"
      ].result;
    // The first read came back empty, and the run is still going: only what is known is said.
    expect(line([], false)).toBe("2 tone words");
    expect(line(undefined, false)).toBe("2 tone words");
    // The run has ended: an empty list is the last word.
    expect(line([], true)).toBe("2 tone words · no one named on the site");
    // People found are said at once, final or not.
    expect(line(["Ana Ruiz"], false)).toBe(
      "2 tone words · 1 person named on the site",
    );
  });
});

/** A progress event as rext-backend sends it: the step's bare name, the status "progress". */
const progress = (
  step: string,
  seconds: number,
  payload?: Record<string, unknown>,
): SSEEvent => ({
  ...event(step, "progress" as SSEEvent["status"], seconds),
  id: `${step}:progress@${seconds}`,
  payload,
});

describe("the people the run says it saved", () => {
  it("come from the personas event, with their titles", () => {
    expect(
      workspaceFindings([
        progress("personas", 25, {
          people: [
            { person: "Ana Ruiz", title: "Head of forging" },
            { person: "Ben Ode", title: null },
            { person: "  " },
            "not a person",
          ],
          count: 2,
        }),
      ]).people,
    ).toEqual([
      { name: "Ana Ruiz", title: "Head of forging" },
      { name: "Ben Ode", title: undefined },
    ]);
  });

  it("are no one when the run says it saved no one, and unknown when it hasn't said", () => {
    expect(
      workspaceFindings([progress("personas", 25, { people: [], count: 0 })])
        .people,
    ).toEqual([]);
    expect(
      workspaceFindings([sent("brand_voice.completed", 20, { personas: [] })])
        .people,
    ).toBeUndefined();
    expect(
      workspaceFindings([progress("personas", 25)]).people,
    ).toBeUndefined();
  });
});

describe("workspaceActivity: the work as it happens, newest first", () => {
  const events = [
    sent("scrape.started", 0),
    progress("scrape", 5, {
      pages: [
        { page: "https://www.acme.example/", kind: "home" },
        { page: "https://www.acme.example/about", kind: "about" },
        { page: "https://www.acme.example/team", kind: "team" },
        { page: "https://www.acme.example/blog/a", kind: "article" },
        { page: "https://www.acme.example/blog/b", kind: "article" },
        { page: "https://www.acme.example/pricing", kind: "other" },
      ],
      count: 9,
    }),
    sent("scrape.completed", 6, {
      title: "Acme: anvils that last",
      word_count: 1240,
    }),
    sent("brand_voice.started", 7),
    sent("brand_voice.completed", 20, { brand_voice: ["Plain", "Dry"] }),
    sent("competitor_discovery.started", 21),
    progress("competitor_discovery", 22, { stage: "searching", queries: 6 }),
    progress("personas", 25, {
      people: [
        { person: "Ana Ruiz", title: "Head of forging" },
        { person: "Ben Ode", title: null },
      ],
      count: 2,
    }),
    progress("competitor_discovery", 40, { stage: "checking", candidates: 14 }),
    sent("competitor_discovery.completed", 60, {
      competitors: ["boltco.example", "hammerworks.example"],
    }),
  ];

  it("says each thing the run reported, the newest on top", () => {
    expect(
      workspaceActivity(events, "acme.example").map((line) => line.text),
    ).toEqual([
      "Finding competitors: 2 competitors found",
      "Checking 14 sites that came up",
      // The people arrive together: in the order the run gave them.
      "Found Ana Ruiz, Head of forging",
      "Found Ben Ode",
      "Running 6 searches your customers would make",
      "Looking at who ranks for the same searches.",
      "Writing your brand voice and personas: 2 tone words",
      "Working out what the brand does, how it sounds, and who is named on the site.",
      "Reading your website: “Acme: anvils that last” · 1,240 words read",
      "Read 9 pages: the home page, the about page, the team page, 2 articles and 4 other pages",
      "Opening acme.example and reading what it says.",
    ]);
  });

  it("keeps each line's time, its kind, and an id of its own", () => {
    const lines = workspaceActivity(events, "acme.example");
    expect(lines[0]).toMatchObject({
      kind: "done",
      at: Date.parse(at(60)),
      id: "competitor_discovery.completed@60",
    });
    expect(lines.at(-1)).toMatchObject({
      kind: "started",
      at: Date.parse(at(0)),
    });
    expect(lines.filter((line) => line.kind === "progress")).toHaveLength(5);
    // Two people in one event are two lines, and no two lines share an id.
    expect(new Set(lines.map((line) => line.id)).size).toBe(lines.length);
  });

  it("says how many pages it read, however they are listed", () => {
    const read = (payload: Record<string, unknown>) =>
      workspaceActivity([progress("scrape", 3, payload)], "acme.example").map(
        (line) => line.text,
      );
    expect(
      read({
        pages: [{ page: "https://acme.example/", kind: "home" }],
        count: 1,
      }),
    ).toEqual(["Read the home page"]);
    expect(
      read({
        pages: [
          { page: "https://acme.example/a" },
          { page: "https://acme.example/b" },
        ],
        count: 2,
      }),
    ).toEqual(["Read 2 pages"]);
    // More were read than are listed: the count is the run's.
    expect(
      read({
        pages: [{ page: "https://acme.example/", kind: "home" }],
        count: 30,
      }),
    ).toEqual(["Read 30 pages: the home page and 29 other pages"]);
    expect(read({ pages: [], count: 0 })).toEqual([]);
    // One page in an event of its own, should the run ever send them one by one.
    expect(
      read({ page: "https://www.acme.example/about/", title: "About Acme" }),
    ).toEqual(["Read “About Acme” (acme.example/about)"]);
  });

  it("says no one is named when the run saved no one", () => {
    expect(
      workspaceActivity(
        [progress("personas", 25, { people: [], count: 0 })],
        "acme.example",
      ).map((line) => line.text),
    ).toEqual(["No one is named on the site"]);
  });

  it("adds no line for what it can't read, and makes nothing up", () => {
    expect(workspaceActivity([], "acme.example")).toEqual([]);
    expect(
      workspaceActivity(
        [
          progress("scrape", 1),
          progress("scrape", 2, { read: 3 }),
          progress("personas", 3, { people: "two" }),
          progress("competitor_discovery", 4, { stage: "ranking" }),
          progress("embeddings", 5, { chunks: 40 }),
          sent("embeddings.started", 5),
          sent("pipeline.completed", 6),
        ],
        "acme.example",
      ),
    ).toEqual([]);
  });

  it("says a step that stopped, and one that ended with nothing to report", () => {
    expect(
      workspaceActivity(
        [
          sent("scrape.completed", 3, { title: null, word_count: 0 }),
          {
            ...event(
              "brand_voice.failed",
              "failed",
              9,
              "The model didn't answer.",
            ),
            id: "brand_voice.failed@9",
          },
        ],
        "acme.example",
      ).map((line) => [line.kind, line.text]),
    ).toEqual([
      ["failed", "Writing your brand voice and personas stopped"],
      ["done", "Reading your website: done"],
    ]);
  });
});
