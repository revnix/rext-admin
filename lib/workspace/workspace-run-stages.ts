import type {
  RunStage,
  RunStageDetail,
} from "@/lib/generate-content/run-stages";
import type { SSEEvent } from "@/types/sse";

/**
 * The workspace analysis as run stages (design/app-language.md §8), from its operation's events
 * (`GET /api/v1/events/{operation_id}`). rext-backend's `workspace_pipeline.py` reports three steps,
 * each `<step>.started` then `.completed` or `.failed`, and ends with `pipeline.completed` or
 * `pipeline.failed`. The personas are read and saved inside the brand-voice step, and the save and
 * the embeddings report nothing of their own, so they have no stage of their own.
 */
export const WORKSPACE_ANALYSIS_STAGES = [
  { step: "scrape", id: "workspace-scrape", label: "Reading your website" },
  {
    step: "brand_voice",
    id: "workspace-brand-voice",
    label: "Writing your brand voice and personas",
  },
  {
    step: "competitor_discovery",
    id: "workspace-competitors",
    label: "Finding competitors",
  },
] as const;

/** The step an event is about ("scrape" from "scrape.started"), and what happened to it. */
function readEvent(event: SSEEvent): { step: string; outcome: string } {
  const [step, suffix] = event.step.split(".");
  return { step, outcome: suffix ?? event.status };
}

/**
 * The pipeline runs its steps one after another: a later step that starts or finishes means the
 * earlier ones finished, whatever they reported (a reconnect can miss an event). A running one
 * ends at that event's time, so its duration stops counting.
 */
function closeEarlier(stages: RunStage[], index: number, time?: number) {
  for (const earlier of stages.slice(0, index)) {
    if (earlier.state === "active") {
      earlier.state = "complete";
      earlier.endedAt = time;
    } else if (earlier.state === "pending") {
      earlier.state = "complete";
    }
  }
}

/** Where the operation's events put each stage; with no event yet, every stage waits. */
export function workspaceRunStages(events: SSEEvent[]): RunStage[] {
  const stages: RunStage[] = WORKSPACE_ANALYSIS_STAGES.map((stage) => ({
    id: stage.id,
    label: stage.label,
    state: "pending",
  }));
  for (const event of events) {
    const at = Date.parse(event.timestamp);
    const time = Number.isNaN(at) ? undefined : at;
    const { step, outcome } = readEvent(event);

    if (step === "pipeline") {
      const failed = outcome === "failed" || event.status === "failed";
      const completed = outcome === "completed" || event.status === "completed";
      if (!failed && !completed) continue;
      for (const stage of stages) {
        if (stage.state === "active") {
          stage.state = failed ? "failed" : "complete";
          stage.endedAt = time;
        } else if (stage.state === "pending") {
          stage.state = failed ? "skipped" : "complete";
        }
      }
      continue;
    }

    const index = WORKSPACE_ANALYSIS_STAGES.findIndex((s) => s.step === step);
    if (index === -1) continue;
    const stage = stages[index];
    if (outcome === "started" && stage.state === "pending") {
      closeEarlier(stages, index, time);
      stage.state = "active";
      stage.startedAt = time;
    } else if (outcome === "completed") {
      closeEarlier(stages, index, time);
      stage.state = "complete";
      stage.startedAt ??= time;
      stage.endedAt = time;
    } else if (outcome === "failed") {
      stage.state = "failed";
      stage.endedAt = time;
      // The client stops listening at a failed step, so the pipeline's own failure may never
      // arrive to say the later stages won't run.
      for (const later of stages.slice(index + 1)) {
        if (later.state === "pending") later.state = "skipped";
      }
    }
  }
  return stages;
}

/** The operation ended badly: the event that says so (a failed step or the pipeline), if any. */
export function findFailedEvent(events: SSEEvent[]): SSEEvent | undefined {
  return events.find(
    (event) =>
      event.status === "failed" || readEvent(event).outcome === "failed",
  );
}

// ── What the analysis found, as it finds it (rext-control#845) ────────────────

/** The drafted brand voice, as the brand-voice step's end reports it. */
export interface DraftedVoice {
  brandName?: string;
  about?: string;
  sellingPosition?: string;
  audience: string[];
  tone: string[];
  pillars: string[];
}

/**
 * What each finished step of the analysis found, read from its `.completed` event's payload: the
 * page that was read, the drafted brand voice, the competitors' sites. Undefined until its step
 * ends; a step that ends with nothing to show (an empty site) leaves its part undefined too.
 */
export interface WorkspaceFindings {
  site?: { title?: string; words?: number };
  voice?: DraftedVoice;
  competitors?: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const texts = (value: unknown): string[] =>
  (Array.isArray(value) ? value : []).flatMap((item) => text(item) ?? []);

export function workspaceFindings(events: SSEEvent[]): WorkspaceFindings {
  const findings: WorkspaceFindings = {};
  for (const event of events) {
    const { step, outcome } = readEvent(event);
    if (outcome !== "completed" || !isRecord(event.payload)) continue;
    const payload = event.payload;
    if (step === "scrape") {
      const words = payload.word_count;
      findings.site = {
        title: text(payload.title),
        words: typeof words === "number" && words > 0 ? words : undefined,
      };
    } else if (step === "brand_voice") {
      const voice: DraftedVoice = {
        brandName: text(payload.brand_name),
        about: text(payload.about),
        sellingPosition: text(payload.selling_position),
        audience: texts(payload.target_audience),
        tone: texts(payload.brand_voice),
        pillars: texts(payload.content_pillar ?? payload.content_strategy),
      };
      // A voice with nothing in it is no voice to show.
      if (
        voice.brandName ||
        voice.about ||
        voice.sellingPosition ||
        voice.tone.length > 0
      ) {
        findings.voice = voice;
      }
    } else if (step === "competitor_discovery") {
      findings.competitors = texts(payload.competitors);
    }
  }
  return findings;
}

const plural = (count: number, one: string, many: string) =>
  `${count.toLocaleString("en")} ${count === 1 ? one : many}`;

/**
 * What each stage will do, is doing and found, for the run's box (`RunProgress`'s `details`): only
 * what the run reported. `people` are the author personas saved by the brand-voice step, once the
 * page has read them; undefined before.
 */
export function workspaceStageDetails(
  findings: WorkspaceFindings,
  site: string,
  people?: string[],
): Record<string, RunStageDetail> {
  const { site: read, voice, competitors } = findings;
  return {
    "workspace-scrape": {
      waiting: `The pages of ${site}.`,
      live: `Opening ${site} and reading what it says.`,
      result: read
        ? [
            read.title ? `“${read.title}”` : null,
            read.words ? `${plural(read.words, "word", "words")} read` : null,
          ]
            .filter(Boolean)
            .join(" · ") || undefined
        : undefined,
    },
    "workspace-brand-voice": {
      waiting: "How the brand sounds, who it's for, and who writes for it.",
      live: "Working out what the brand does, how it sounds, and who is named on the site.",
      result: voice
        ? [
            voice.tone.length > 0
              ? `${plural(voice.tone.length, "tone word", "tone words")}`
              : "Brand voice drafted",
            people === undefined
              ? null
              : people.length > 0
                ? `${plural(people.length, "person", "people")} named on the site`
                : "no one named on the site",
          ]
            .filter(Boolean)
            .join(" · ")
        : undefined,
    },
    "workspace-competitors": {
      waiting: "The sites yours is compared with in search.",
      live: "Looking at who ranks for the same searches.",
      result: competitors
        ? competitors.length > 0
          ? `${plural(competitors.length, "competitor", "competitors")} found`
          : "None found"
        : undefined,
    },
  };
}
