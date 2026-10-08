import {
  findFailedEvent,
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
    expect(after["workspace-brand-voice"].result).toBe(
      "Brand voice drafted · no one named on the site",
    );
    expect(after["workspace-competitors"].result).toBe("None found");
  });
});
