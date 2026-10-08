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

/**
 * A workspace made from a description of the business has no website to read (rext-control#853):
 * its run is the brand voice only, drafted from what the person wrote. No personas, no competitors.
 */
export const WORKSPACE_DESCRIPTION_STAGES = [
  {
    step: "brand_voice",
    id: "workspace-brand-voice",
    label: "Writing your brand voice",
  },
] as const;

/** Which run the page follows: the website's three steps, or the description's one. */
export interface WorkspaceRunKind {
  withoutSite?: boolean;
}

const stagesOf = ({
  withoutSite,
}: WorkspaceRunKind = {}): ReadonlyArray<{
  step: string;
  id: string;
  label: string;
}> => (withoutSite ? WORKSPACE_DESCRIPTION_STAGES : WORKSPACE_ANALYSIS_STAGES);

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
export function workspaceRunStages(
  events: SSEEvent[],
  kind: WorkspaceRunKind = {},
): RunStage[] {
  const defined = stagesOf(kind);
  const stages: RunStage[] = defined.map((stage) => ({
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

    const index = defined.findIndex((s) => s.step === step);
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
  /** Who buys from the brand, in a sentence or two. */
  customers?: string;
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
  /**
   * The people named on the site, from the run's own word that it saved them as author personas
   * (a `personas` progress event, some seconds after the brand voice). An empty list is the run
   * saying it saved no one; undefined is a run that hasn't said, or a backend that doesn't yet.
   */
  people?: { name: string; title?: string }[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const texts = (value: unknown): string[] =>
  (Array.isArray(value) ? value : []).flatMap((item) => text(item) ?? []);

/** The people a `personas` event lists: each with a name, and a title where it has one. */
function readPeople(people: unknown[]): { name: string; title?: string }[] {
  return people.flatMap((item) => {
    const name = isRecord(item) ? text(item.person ?? item.name) : undefined;
    return name
      ? [{ name, title: isRecord(item) ? text(item.title) : undefined }]
      : [];
  });
}

export function workspaceFindings(events: SSEEvent[]): WorkspaceFindings {
  const findings: WorkspaceFindings = {};
  for (const event of events) {
    const { step, outcome } = readEvent(event);
    if (!isRecord(event.payload)) continue;
    if (step === "personas" && Array.isArray(event.payload.people)) {
      findings.people = readPeople(event.payload.people);
      continue;
    }
    if (outcome !== "completed") continue;
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
        customers: text(payload.customer_profile),
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
 * what the run reported. `people` are the author personas the run has saved so far, once the page
 * has read some; none yet says nothing, since "no one" is only known when the run has ended.
 */
export function workspaceStageDetails(
  findings: WorkspaceFindings,
  site: string,
  people?: string[],
  /**
   * Whether `people` is the last word. The personas are saved during the run and can arrive after
   * the first read of them: unless the caller says the run has had its say, an empty list says
   * nothing yet.
   */
  peopleFinal = false,
  kind: WorkspaceRunKind = {},
): Record<string, RunStageDetail> {
  const { site: read, voice, competitors } = findings;
  if (kind.withoutSite) {
    // No website: the voice comes from the description, and nobody is looked for.
    return {
      "workspace-brand-voice": {
        waiting:
          "How the brand sounds and who it's for, from what you tell us.",
        live: "Working out how the brand sounds and who it's for, from your description.",
        result: voice
          ? voice.tone.length > 0
            ? `${plural(voice.tone.length, "tone word", "tone words")}`
            : "Brand voice drafted"
          : undefined,
      },
    };
  }
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
                : peopleFinal
                  ? "no one named on the site"
                  : null,
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

// ── The work as it happens, newest first (rext-control#845) ───────────────────

/** One thing the analysis did, in a line. */
export interface WorkspaceActivity {
  id: string;
  text: string;
  /** When, in milliseconds; undefined when the event's time can't be read. */
  at?: number;
  /** A step's own end, which sums it up; the lines between are what it met on the way. */
  kind: "started" | "progress" | "done" | "failed";
}

const quoted = (value: string) => `“${value}”`;

/** "acme.example/about" from a page's address, without the scheme, "www." or a trailing slash. */
function pageName(address: string): string {
  try {
    const url = new URL(address);
    const path = url.pathname.replace(/\/$/, "");
    return `${url.host.replace(/^www\./, "")}${path}`;
  } catch {
    return address;
  }
}

/** How a kind of page is counted in a line: "the home page", "3 articles". */
const PAGE_KINDS: [kind: string, one: string, many: string][] = [
  ["home", "the home page", "home pages"],
  ["about", "the about page", "about pages"],
  ["team", "the team page", "team pages"],
  ["article", "1 article", "articles"],
];

/** "the home page, the about page, 6 articles and 3 other pages" from the pages a read lists. */
function pagesRead(pages: unknown[], count: number): string {
  const kinds = pages.map((page) =>
    isRecord(page) ? (text(page.kind) ?? "other") : "other",
  );
  const named = PAGE_KINDS.flatMap(([kind, one, many]) => {
    const found = kinds.filter((item) => item === kind).length;
    return found === 0 ? [] : [found === 1 ? one : `${found} ${many}`];
  });
  // The list holds at most the first pages; the count is all of them.
  const known = kinds.filter((kind) =>
    PAGE_KINDS.some(([name]) => name === kind),
  ).length;
  const others = Math.max(count, pages.length) - known;
  if (others > 0)
    named.push(
      named.length > 0
        ? plural(others, "other page", "other pages")
        : plural(others, "page", "pages"),
    );
  return named.length > 1
    ? `${named.slice(0, -1).join(", ")} and ${named[named.length - 1]}`
    : (named[0] ?? "");
}

/**
 * What a progress event says the run just did, as lines (rext-backend's `<step>` events with the
 * status "progress"): the pages it read, the people it saved as personas, the phase of the
 * competitors' search. An event this page can't read gives no line.
 */
function progressLines(
  step: string,
  payload: Record<string, unknown>,
): string[] {
  if (step === "scrape") {
    if (Array.isArray(payload.pages)) {
      const listed = payload.pages.length;
      const count =
        typeof payload.count === "number" && payload.count > listed
          ? payload.count
          : listed;
      if (count === 0) return [];
      const read = pagesRead(payload.pages, count);
      const pages = plural(count, "page", "pages");
      // With no kind to tell them apart, the count says it all.
      if (read === pages) return [`Read ${pages}`];
      return [count === 1 ? `Read ${read}` : `Read ${pages}: ${read}`];
    }
    const page = text(payload.page) ?? text(payload.url);
    if (!page) return [];
    const title = text(payload.title);
    return [
      title
        ? `Read ${quoted(title)} (${pageName(page)})`
        : `Read ${pageName(page)}`,
    ];
  }
  if (step === "personas" || step === "brand_voice") {
    if (Array.isArray(payload.people)) {
      const people = readPeople(payload.people);
      return people.length > 0
        ? people.map(({ name, title }) =>
            title ? `Found ${name}, ${title}` : `Found ${name}`,
          )
        : ["No one is named on the site"];
    }
    const person = text(payload.person);
    if (!person) return [];
    const title = text(payload.title);
    return [title ? `Found ${person}, ${title}` : `Found ${person}`];
  }
  if (step === "competitor_discovery") {
    const number = (value: unknown) =>
      typeof value === "number" && value > 0 ? value : null;
    if (payload.stage === "searching") {
      const queries = number(payload.queries);
      return [
        queries
          ? `Running ${plural(queries, "search", "searches")} your customers would make`
          : "Searching where your customers would",
      ];
    }
    if (payload.stage === "checking") {
      const candidates = number(payload.candidates);
      return [
        candidates
          ? `Checking ${plural(candidates, "site", "sites")} that came up`
          : "Checking the sites that came up",
      ];
    }
    const domain = text(payload.domain);
    if (domain) return [`Found ${domain}`];
  }
  return [];
}

/**
 * Everything the analysis has reported, newest first: each step as it starts, what it meets on the
 * way (a `<step>.progress` event: a page read, a person found, a competitor confirmed) and what it
 * found when it ends. Only what the run reports is here; an event this page can't read adds no
 * line, so nothing is made up.
 */
export function workspaceActivity(
  events: SSEEvent[],
  site: string,
  kind: WorkspaceRunKind = {},
): WorkspaceActivity[] {
  const lines: WorkspaceActivity[] = [];
  const details = workspaceStageDetails(
    workspaceFindings(events),
    site,
    undefined,
    false,
    kind,
  );
  for (const event of events) {
    const { step, outcome } = readEvent(event);
    const time = Date.parse(event.timestamp);
    const at = Number.isNaN(time) ? undefined : time;
    const line = (
      kind: WorkspaceActivity["kind"],
      said: string | null | undefined,
      part = 0,
    ) => {
      if (said)
        lines.push({
          id: part === 0 ? event.id : `${event.id}:${part}`,
          text: said,
          at,
          kind,
        });
    };
    if (outcome === "progress") {
      // Also from a step with no stage of its own (the personas are saved inside the brand
      // voice's). One event can say several things, which arrived together: they keep the order
      // the run gave them, so they go in last first, since the whole list is reversed at the end.
      const said = isRecord(event.payload)
        ? progressLines(step, event.payload)
        : [];
      said
        .slice()
        .reverse()
        .forEach((text, part) => {
          line("progress", text, part);
        });
      continue;
    }
    const stage = stagesOf(kind).find((item) => item.step === step);
    if (!stage) continue;
    if (outcome === "started") {
      line("started", details[stage.id]?.live);
    } else if (outcome === "completed") {
      const result = details[stage.id]?.result;
      line(
        "done",
        result ? `${stage.label}: ${result}` : `${stage.label}: done`,
      );
    } else if (outcome === "failed") {
      line("failed", `${stage.label} stopped`);
    }
  }
  return lines.reverse();
}
