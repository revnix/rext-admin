/**
 * What a run has found so far (rext-control#694, option A), so its progress box says what each stage
 * found instead of only that it finished. Each backend step's update already carries its results
 * (rext-backend `src/flow/engines/`: fetch_serp, normalize_serp, extract_competitor, the keyword
 * metrics, the content subgraph's gates and models), and the title and outline models stream their
 * JSON as they write it.
 *
 * Only what the backend sent shows. Nothing moves on a timer, a part whose count is zero is left out,
 * and a line whose data never came is not written. What the backend does not send is never filled in:
 * each result's format, the results' dates, a signal that the titles are being checked (the end of the
 * model's text stands in for it), whether the outline used the brand.
 *
 * `reduceFindings` is the one way in: a pure reducer over a phase's start, a node's update, a model's
 * text so far, a custom stream event and a thread's saved state. `describeRun` turns the findings into
 * each stage's lines for `RunProgress`.
 *
 * The findings are kept in the shapes the steps' own views already take (`SerpResult` for the results
 * pane, `KeywordMetrics` for the keyword card, the title drafts and outline headings as lists), so a
 * step that fills in while its run goes reads them as they are.
 */

import { contentTypeLabel } from "@/lib/generate-content/content-type-step";
import { describeMonthlyVolume } from "@/lib/generate-content/monthly-volume";
import { streamedHeadings } from "@/lib/generate-content/outline-review";
import type {
  RunHeader,
  RunPhase,
  RunStage,
  RunStageDetail,
  RunStageState,
  RunTitleRow,
} from "@/lib/generate-content/run-stages";
import { RUN_PHASES } from "@/lib/generate-content/run-stages";
import {
  normalizeTitle,
  scoreTitle,
  TITLE_MIN_CHARS,
  titleMaxChars,
} from "@/lib/generate-content/title-score";
import {
  difficultyBand,
  formatCount,
  type KeywordMetrics,
  keywordMetrics,
  parseIntents,
  type SearchIntent,
} from "@/lib/keywords/keyword-metrics";
import { domainOf, type SerpResult } from "@/lib/keywords/serp-results";

/** One site of the first page as the competitor step read it (extract_competitor). */
export interface FoundCompetitor {
  site: string;
  /** Its best place on the first page. */
  position: number | null;
  /** What its page is for, as the step classified it; null when it gave none. */
  intent: SearchIntent | null;
  /** Whether that is what searchers want; null when the step didn't say which sites match. */
  matchesIntent: boolean | null;
}

/** A title as the model writes it: `complete` once its closing quote has come. */
export interface TitleDraft {
  title: string;
  complete: boolean;
  recommended: boolean;
  reason: string | null;
}

/** One of the article agent's searches (custom `tool_start` and `tool_end` events), for #703. */
export interface RunSearch {
  id: string;
  query: string;
  done: boolean;
  results?: number;
}

export interface RunFindings {
  /**
   * The run's own keyword and country, from a thread's saved state: after a reload the page's form
   * holds neither while a run is picked up mid-way.
   */
  searched?: { keyword: string; country: string | null };
  /** The first page of results, in rank order (fetch_serp), as the results pane takes them. */
  results?: SerpResult[];
  /** "People also ask", each question once, in the search's order. */
  questions?: string[];
  /** The searches Google relates to the keyword (fetch_serp; never the model's suggestions). */
  relatedSearches?: string[];
  /** How many of each the title step's prompt reads: the first eight entries of each list. */
  titleSources?: { relatedSearches: number; questions: number };
  /** The first page's sites, once each, in rank order (normalize_serp). */
  sites?: string[];
  /** How many different sites the first page holds (normalize_serp's `domain_stats`). */
  siteCount?: number;
  /** The competing sites, best placed first (extract_competitor). */
  competitors?: FoundCompetitor[];
  /** What searchers want, as the competitor step classified it. */
  intent?: SearchIntent;
  /**
   * The keyword's numbers (the keyword metrics step's `serp_backlinks`), as the keyword card takes
   * them beside `intent`. The wait's own line leaves the links out (rext-control#694's decision).
   */
  metrics?: Omit<KeywordMetrics, "intents">;
  /** Whether the research went into the keyword library (save_keyword_research). */
  saved?: boolean;
  /** The content type the backend suggests (recommend_content_type). */
  suggestedContentType?: string;
  /** The content type the user chose (the content-type gate's answer). */
  contentType?: string;
  /** A regeneration of the titles: the user's note, "" when they left none (the title gate's answer). */
  regenerationNote?: string;
  /** The titles as the model writes them (generate_topics' streamed text). */
  drafts?: TitleDraft[];
  /** The model's text has closed: every title is written and the checks begin. */
  draftsDone?: boolean;
  /** The checked set the title gate offers (generate_topics' update). */
  finalTitles?: string[];
  focusKeyphrase?: string;
  /** The title the user chose, which the outline is written for (the title gate's answer). */
  selectedTitle?: string;
  /** The keyword groups (keyword_clustering). */
  groups?: { name: string; phrases: number }[];
  /** The outline's headings as the model writes them (generate_outline's streamed text). */
  headings?: string[];
  /** The written outline (generate_outline's update). */
  outline?: { sections: number | null; words: number | null };
  /** The article agent's searches, for the article's stages (#703). */
  searches?: RunSearch[];
}

export const EMPTY_FINDINGS: RunFindings = {};

/** The model nodes whose streamed text the findings read. */
export const TITLE_MODEL_NODE = "generate_topics";
export const OUTLINE_MODEL_NODE = "generate_outline";

/**
 * The node a stream's token is read under. The title model's text comes labelled `generate_topics`
 * since the model has a node of its own, and `topic_generation` (the gate's node, where the model
 * call used to sit) in the recorded stream and on a run from before: both are the title model's.
 */
export function textNode(node: string | null | undefined): string | null {
  if (!node) return null;
  return node === "topic_generation" ? TITLE_MODEL_NODE : node;
}

export type FindingsEvent =
  /** A phase starts: what it finds is cleared (a new keyword clears everything). */
  | { type: "phase"; phase: RunPhase }
  /** A graph node finished: its update, as the stream's `updates` event carries it. */
  | { type: "update"; node: string; data: unknown }
  /** A model's text so far (every token joined), for the node that writes it. */
  | { type: "text"; node: string; text: string }
  /** A `custom` stream event. */
  | { type: "custom"; data: unknown }
  /**
   * A thread's saved state (the status route's `state`, read with its subgraphs), for a run picked
   * up after a reload or from the dock. `at` is where the run is: only what the stages before it
   * wrote is read, since the state still holds an earlier pass's data for the stages to come.
   */
  | { type: "seed"; state: unknown; at?: { phase: RunPhase; id: string } };

export function reduceFindings(
  findings: RunFindings,
  event: FindingsEvent,
): RunFindings {
  switch (event.type) {
    case "phase":
      return startPhase(findings, event.phase);
    case "update": {
      const groups = NODE_GROUPS[event.node];
      if (!groups || !isRecord(event.data)) return findings;
      const values = event.data;
      return groups.reduce((next, group) => READERS[group](next, values), {
        ...findings,
      });
    }
    case "text":
      return readText(findings, event.node, event.text);
    case "custom":
      return readCustom(findings, event.data);
    case "seed": {
      const values = threadValues(event.state);
      const found = (Object.keys(READERS) as Group[])
        .filter((group) => !event.at || writtenBefore(group, event.at))
        .reduce((next, group) => READERS[group](next, values), EMPTY_FINDINGS);
      const searched = readSearched(values, event.at?.phase);
      return searched ? { ...found, searched } : found;
    }
  }
}

// ── A phase's start ──────────────────────────────────────────────────────────

function startPhase(findings: RunFindings, phase: RunPhase): RunFindings {
  const next = { ...findings };
  switch (phase) {
    case "analysis":
      return EMPTY_FINDINGS;
    case "content-type":
      delete next.suggestedContentType;
      break;
    case "titles":
      delete next.regenerationNote;
      delete next.drafts;
      delete next.draftsDone;
      delete next.finalTitles;
      break;
    case "outline":
      delete next.selectedTitle;
      delete next.groups;
      delete next.headings;
      delete next.outline;
      break;
    case "article":
      delete next.searches;
      break;
  }
  return next;
}

// ── Updates and saved state ──────────────────────────────────────────────────

type Values = Record<string, unknown>;

const READERS = {
  serp: readSerp,
  sites: readNormalized,
  competitors: readCompetitors,
  metrics: readMetrics,
  saved: readSaved,
  pick: readPick,
  contentType: readContentType,
  regeneration: readRegeneration,
  selection: readSelection,
  topicSet: readTopicSet,
  groups: readGroups,
  outline: readOutline,
} satisfies Record<
  string,
  (findings: RunFindings, values: Values) => RunFindings
>;

type Group = keyof typeof READERS;

/**
 * What each node's update is read for. A subgraph's own update (serp_engine, seo_engine) repeats its
 * whole state, an earlier pass's data included, so it is read only for its own steps.
 */
const NODE_GROUPS: Record<string, Group[]> = {
  fetch_serp: ["serp"],
  normalize_serp: ["sites"],
  extract_competitor: ["competitors", "sites"],
  serp_engine: ["serp", "sites", "competitors"],
  fetch_dataforseo_backlinks: ["metrics"],
  save_keyword_research: ["saved"],
  seo_engine: ["metrics", "saved"],
  recommend_content_type: ["pick"],
  content_type: ["contentType"],
  topic_generation: ["regeneration", "selection"],
  generate_topics: ["topicSet"],
  keyword_clustering: ["groups"],
  generate_outline: ["outline"],
};

/**
 * Where a run writes each group: its phase, and the stage whose end it comes with; none for a gate's
 * answer, written as the phase starts.
 */
const GROUP_STAGES: Record<Group, { phase: RunPhase; stage: string | null }> = {
  serp: { phase: "analysis", stage: "search-results" },
  sites: { phase: "analysis", stage: "search-results" },
  competitors: { phase: "analysis", stage: "competitors" },
  metrics: { phase: "analysis", stage: "measure" },
  saved: { phase: "analysis", stage: "measure" },
  pick: { phase: "content-type", stage: "content-type" },
  contentType: { phase: "titles", stage: null },
  regeneration: { phase: "titles", stage: null },
  topicSet: { phase: "titles", stage: "title-checks" },
  selection: { phase: "outline", stage: null },
  groups: { phase: "outline", stage: "keyword-groups" },
  outline: { phase: "outline", stage: "outline" },
};

const PHASE_ORDER: RunPhase[] = [
  "analysis",
  "content-type",
  "titles",
  "outline",
  "article",
];

function writtenBefore(
  group: Group,
  at: { phase: RunPhase; id: string },
): boolean {
  const written = GROUP_STAGES[group];
  const phase = PHASE_ORDER.indexOf(written.phase);
  const now = PHASE_ORDER.indexOf(at.phase);
  if (phase !== now) return phase < now;
  if (written.stage === null) return true;
  const stages = RUN_PHASES[at.phase].map((def) => def.id);
  return stages.indexOf(written.stage) < stages.indexOf(at.id);
}

/** A thread state's values, a running subgraph's own (newer) values over its parent's. */
function threadValues(state: unknown): Values {
  if (!isRecord(state)) return {};
  let values: Values = isRecord(state.values) ? { ...state.values } : {};
  for (const task of Array.isArray(state.tasks) ? state.tasks : []) {
    if (isRecord(task) && isRecord(task.state)) {
      values = { ...values, ...threadValues(task.state) };
    }
  }
  return values;
}

/**
 * The keyword and country the run works on: the search's own while it is analysed, the keyword
 * chosen at the keyword step after that.
 */
function readSearched(
  values: Values,
  phase: RunPhase | undefined,
): RunFindings["searched"] {
  const payload = record(values.serp_payload);
  const query = text(payload.query);
  const chosen = text(values["Primary Keyword"]);
  const keyword = phase === "analysis" ? query || chosen : chosen || query;
  return keyword
    ? { keyword, country: text(payload.country) || null }
    : undefined;
}

function readSerp(findings: RunFindings, values: Values): RunFindings {
  const serp = values.serp_result;
  if (!isRecord(serp)) return findings;
  const results: SerpResult[] = records(serp.organic_results)
    .map((result, index) => {
      const url = text(result.link);
      return {
        position: wholeNumber(result.position) ?? index + 1,
        title: text(result.title),
        domain: domainOf(url) || text(result.domain).replace(/^www\./, ""),
        ...(url ? { url } : {}),
      };
    })
    .filter((result) => result.title);
  // One entry per answer, so a question with two answers comes twice.
  const asked = records(serp.people_ask).map((answer) => text(answer.question));
  const relatedSearches = strings(serp.related_searches);
  return {
    ...findings,
    results,
    questions: unique(asked),
    relatedSearches,
    titleSources: titleSources(relatedSearches, asked),
    sites: findings.sites ?? unique(results.map((result) => result.domain)),
  };
}

/** The title step reads the first eight related searches and the first eight questions. */
const TITLE_SOURCES = 8;

/** What the title step's prompt reads of the search (rext-backend `_build_human_prompt`). */
function titleSources(
  relatedSearches: string[],
  asked: string[],
): NonNullable<RunFindings["titleSources"]> {
  return {
    relatedSearches: Math.min(relatedSearches.length, TITLE_SOURCES),
    questions: unique(asked.slice(0, TITLE_SOURCES)).length,
  };
}

function readNormalized(findings: RunFindings, values: Values): RunFindings {
  const normalized = values.serp_normalized;
  if (!isRecord(normalized)) return findings;
  const next = { ...findings };
  const sites = unique(
    records(normalized.normalize_results).map((result) => text(result.domain)),
  );
  if (sites.length) next.sites = sites;
  const stats = record(normalized.domain_stats);
  const siteCount = wholeNumber(stats.unique_domains) ?? (sites.length || null);
  if (siteCount !== null) next.siteCount = siteCount;
  // The same questions as fetch_serp's, for a state that kept only the normalised search.
  if (!next.questions && Array.isArray(normalized.questions)) {
    const asked = strings(normalized.questions);
    next.questions = unique(asked);
    next.titleSources = titleSources(next.relatedSearches ?? [], asked);
  }
  return next;
}

function readCompetitors(findings: RunFindings, values: Values): RunFindings {
  const next = { ...findings };
  const normalized = values.serp_normalized;
  const signals = isRecord(normalized)
    ? normalized.intent_matched_signals
    : undefined;
  // "UNKNOWN" when the classification failed: no intent rather than a wrong one.
  const intent =
    parseIntents(values.final_intent_type)[0] ??
    (isRecord(signals) ? parseIntents(signals.primary_intent)[0] : undefined);
  if (intent) next.intent = intent;
  if (Array.isArray(values.competitors)) {
    const matched =
      isRecord(signals) && Array.isArray(signals.matched_domains)
        ? new Set(strings(signals.matched_domains))
        : null;
    next.competitors = records(values.competitors)
      .map((competitor) => {
        const site = text(competitor.domain);
        const positions = (
          Array.isArray(competitor.top_positions)
            ? competitor.top_positions
            : []
        )
          .map(wholeNumber)
          .filter((position): position is number => position !== null);
        return {
          site,
          position: positions.length ? Math.min(...positions) : null,
          intent: classifiedIntent(competitor.intent_distribution),
          matchesIntent: matched ? matched.has(site) : null,
        };
      })
      .filter((competitor) => competitor.site);
  }
  return next;
}

/** The one intent the step gave a site: its `intent_distribution` holds 1 for it and 0 for the rest. */
function classifiedIntent(distribution: unknown): SearchIntent | null {
  if (!isRecord(distribution)) return null;
  const given = Object.keys(distribution).filter(
    (intent) => Number(distribution[intent]) > 0,
  );
  return given.length === 1 ? (parseIntents(given[0])[0] ?? null) : null;
}

function readMetrics(findings: RunFindings, values: Values): RunFindings {
  const seo = values.seo_result;
  const numbers = isRecord(seo) ? seo.serp_backlinks : undefined;
  if (!isRecord(numbers)) return findings;
  const volume = numbers.search_volume;
  const read = keywordMetrics({
    keyword_difficulty: numbers.keyword_difficulty,
    volume:
      typeof volume === "number" || typeof volume === "string" ? volume : null,
    volume_status:
      typeof numbers.volume_status === "string" ? numbers.volume_status : null,
    backlinks: numbers.backlinks,
    referring_domains: numbers.referring_domains,
  });
  return {
    ...findings,
    metrics: {
      difficulty: read.difficulty,
      volume: read.volume,
      volumeStatus: read.volumeStatus,
      backlinks: read.backlinks,
      referringDomains: read.referringDomains,
    },
  };
}

function readSaved(findings: RunFindings, values: Values): RunFindings {
  const seo = values.seo_result;
  if (!isRecord(seo) || !("keyword_research_key" in seo)) return findings;
  return { ...findings, saved: Boolean(seo.keyword_research_key) };
}

function readPick(findings: RunFindings, values: Values): RunFindings {
  const pick = content(values).content_type_pick;
  const type = isRecord(pick) ? text(pick.recommended_content_type) : "";
  return type ? { ...findings, suggestedContentType: type } : findings;
}

function readContentType(findings: RunFindings, values: Values): RunFindings {
  const type = text(content(values).content_type);
  return type ? { ...findings, contentType: type } : findings;
}

function readRegeneration(findings: RunFindings, values: Values): RunFindings {
  const note = content(values).topic_regenerate;
  return typeof note === "string"
    ? { ...findings, regenerationNote: note.trim() }
    : findings;
}

function readSelection(findings: RunFindings, values: Values): RunFindings {
  const title = text(content(values).selected_topic);
  return title ? { ...findings, selectedTitle: title } : findings;
}

function readTopicSet(findings: RunFindings, values: Values): RunFindings {
  const set = content(values).topic_set;
  if (!isRecord(set) || !Array.isArray(set.topics)) return findings;
  const keyphrase = text(set.focus_keyphrase);
  return {
    ...findings,
    finalTitles: strings(set.topics),
    ...(keyphrase ? { focusKeyphrase: keyphrase } : {}),
  };
}

function readGroups(findings: RunFindings, values: Values): RunFindings {
  const seo = values.seo_result;
  if (!isRecord(seo) || !Array.isArray(seo.keyword_clusters)) return findings;
  return {
    ...findings,
    groups: records(seo.keyword_clusters).map((group) => ({
      // The theme reads as a group's name ("planting dates"); the head keyword when there is none.
      name: text(group.topic_theme) || text(group.cluster_name),
      phrases: Array.isArray(group.keywords) ? group.keywords.length : 0,
    })),
  };
}

function readOutline(findings: RunFindings, values: Values): RunFindings {
  const outline = content(values).outline;
  if (!isRecord(outline)) return findings;
  return {
    ...findings,
    outline: {
      sections: sectionCount(outline),
      words: wholeNumber(outline.target_word_count),
    },
  };
}

/** The outline's sections where its type keeps them, as the backend counts its word budget. */
function sectionCount(outline: Values): number | null {
  for (const holder of [
    outline,
    outline.structure,
    outline.content_structure,
  ]) {
    if (isRecord(holder) && Array.isArray(holder.sections)) {
      return holder.sections.length;
    }
  }
  return null;
}

// ── Streamed text ────────────────────────────────────────────────────────────

function readText(
  findings: RunFindings,
  node: string,
  streamed: string,
): RunFindings {
  if (node === TITLE_MODEL_NODE) {
    const { drafts, closed } = readTitleDrafts(streamed);
    if (
      closed === Boolean(findings.draftsDone) &&
      sameJson(drafts, findings.drafts ?? [])
    ) {
      return findings;
    }
    return { ...findings, drafts, draftsDone: closed };
  }
  if (node === OUTLINE_MODEL_NODE) {
    const headings = streamedHeadings(streamed);
    if (sameJson(headings, findings.headings ?? [])) return findings;
    return { ...findings, headings };
  }
  return findings;
}

/** Root object, its `topics` list, then each title's object. */
const TITLE_DEPTH = 3;

/**
 * The titles in the title model's JSON so far (rext-backend's `SEOTopics`: `{"topics": [{"title",
 * "recommended", "recommendation_reason"}]}`), the last one cut where the text ends, and whether the
 * JSON has closed. Only the first document is read: the backend's repair of a title that fails its
 * checks is a second call to the same model, inside the same node.
 */
export function readTitleDrafts(streamed: string): {
  drafts: TitleDraft[];
  closed: boolean;
} {
  const drafts: TitleDraft[] = [];
  let depth = 0;
  let started = false;
  let inString = false;
  let escaped = false;
  let raw = "";
  let expectKey = false;
  let key: string | null = null;
  let literal = "";

  const current = () => drafts[drafts.length - 1];
  const takeString = (complete: boolean) => {
    if (depth !== TITLE_DEPTH || !current()) return;
    if (expectKey) {
      if (complete) key = decodeJsonString(raw);
      return;
    }
    if (key === "title") {
      current().title = normalizeTitle(decodeJsonString(raw));
      current().complete = complete;
    } else if (key === "recommendation_reason" && complete) {
      current().reason = decodeJsonString(raw).trim() || null;
    }
  };
  const takeLiteral = () => {
    if (depth === TITLE_DEPTH && key === "recommended" && current()) {
      current().recommended = literal === "true";
    }
    literal = "";
  };

  for (const ch of streamed) {
    if (inString) {
      if (escaped) {
        raw += `\\${ch}`;
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
        takeString(true);
      } else {
        raw += ch;
      }
      continue;
    }
    if (!started && ch !== "{") continue;
    if (ch === '"') {
      inString = true;
      raw = "";
    } else if (ch === "{" || ch === "[") {
      depth += 1;
      started = true;
      if (ch === "{") {
        expectKey = true;
        key = null;
        if (depth === TITLE_DEPTH) {
          drafts.push({
            title: "",
            complete: false,
            recommended: false,
            reason: null,
          });
        }
      }
    } else if (ch === "}" || ch === "]") {
      takeLiteral();
      depth -= 1;
      if (depth === 0) return { drafts, closed: true };
    } else if (ch === ":") {
      expectKey = false;
    } else if (ch === ",") {
      takeLiteral();
      expectKey = depth === TITLE_DEPTH || depth === 1;
      key = expectKey ? null : key;
    } else if (!/\s/.test(ch)) {
      literal += ch;
    }
  }
  if (inString) takeString(false);
  return { drafts, closed: false };
}

/** A JSON string's characters, complete or cut short (a cut escape is dropped). */
function decodeJsonString(raw: string): string {
  const whole = raw.replace(/\\u[0-9a-fA-F]{0,3}$/, "");
  try {
    return JSON.parse(`"${whole}"`) as string;
  } catch {
    return whole.replace(/\\(.)/g, "$1");
  }
}

// ── Custom events (the article's searches, #703) ─────────────────────────────

function readCustom(findings: RunFindings, data: unknown): RunFindings {
  if (!isRecord(data)) return findings;
  const id = text(data.id);
  if (!id) return findings;
  const searches = findings.searches ?? [];
  if (data.type === "tool_start") {
    if (searches.some((search) => search.id === id)) return findings;
    return {
      ...findings,
      searches: [...searches, { id, query: text(data.query), done: false }],
    };
  }
  if (data.type === "tool_end") {
    if (!searches.some((search) => search.id === id)) return findings;
    const results = wholeNumber(data.count);
    return {
      ...findings,
      searches: searches.map((search) =>
        search.id === id
          ? { ...search, done: true, ...(results !== null ? { results } : {}) }
          : search,
      ),
    };
  }
  return findings;
}

// ── The lines on screen ──────────────────────────────────────────────────────

/** What the page knows about the run beside the stream: the form's keyword and country, the choices. */
export interface RunContext {
  keyword?: string | null;
  /** The keyword form's country: an ISO code ("us"), or "global". */
  country?: string | null;
  /** The content type chosen, or suggested. */
  contentType?: string | null;
  /** The search intent the page holds (the user's pick, else the analysis's). */
  intent?: unknown;
  /** The main sections of the outline as approved (the user may have added or removed some). */
  outlineSections?: number | null;
}

/** `RunProgress`'s props for a run's findings. */
export interface RunView {
  header?: RunHeader;
  details: Record<string, RunStageDetail>;
  footer?: string;
}

/** What searchers want, in the words the run uses ("searchers want to learn"). */
const INTENT_WORDS: Record<SearchIntent, string> = {
  informational: "learn",
  commercial: "compare options",
  transactional: "buy",
  navigational: "find a brand",
};

/** The title step asks the model for exactly five (rext-backend `_build_human_prompt`). */
const TITLES_ASKED = 5;
/** "Show all 10 results" under the first three. */
const RESULTS_PREVIEW = 3;
/** Group names listed in the groups' line before "and n more". */
const GROUPS_NAMED = 5;

const ORDINALS = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
];

export function describeRun(
  run: { phase: RunPhase; stages: RunStage[]; learn?: boolean },
  findings: RunFindings,
  context: RunContext = {},
): RunView {
  const state = (id: string): RunStageState =>
    run.stages.find((stage) => stage.id === id)?.state ?? "pending";
  // The clock runs from the run's start, which a run picked up mid-way never saw.
  const startedAt = run.learn ? run.stages[0]?.startedAt : undefined;
  // A run picked up mid-way says its own keyword and country (the thread's), not the form's.
  const keyword = findings.searched?.keyword || context.keyword?.trim() || "";
  const country = findings.searched?.country ?? context.country;
  const intent = parseIntents(context.intent)[0] ?? findings.intent;
  const type = findings.contentType ?? context.contentType ?? null;
  switch (run.phase) {
    case "analysis":
      return describeAnalysis(findings, keyword, country, state, startedAt);
    case "content-type":
      return {
        header: {
          title: keyword
            ? `Choosing a content type for “${keyword}”`
            : "Choosing a content type",
          subtitle: intent
            ? `For readers who want to ${INTENT_WORDS[intent]}`
            : undefined,
          startedAt,
        },
        details: {
          "content-type": {
            live: keyword
              ? `Comparing what kind of pages rank for “${keyword}”.`
              : "Comparing what kind of pages rank for the keyword.",
            result: findings.suggestedContentType
              ? `Suggested: ${contentTypeLabel(findings.suggestedContentType)}`
              : undefined,
          },
        },
        footer:
          "You can leave this page. The run keeps going, and we’ll tell you when it’s ready.",
      };
    case "titles":
      return describeTitles(findings, keyword, type, intent, state, startedAt);
    case "outline":
      return describeOutline(findings, type, state, startedAt);
    case "article":
      return describeArticle(findings, context.outlineSections ?? null);
  }
}

/**
 * The article's four stages (rext-control#703). No header: the box sits in the article page's side
 * panel, under a bar that already says "Writing the article". The article's text isn't sent while
 * it is written, so the Draft stage says what is being written, not how far it is.
 */
function describeArticle(
  findings: RunFindings,
  sections: number | null,
): RunView {
  const searches = findings.searches ?? [];
  const finished = searches.filter((search) => search.done).length;
  return {
    details: {
      research: {
        live: searches.length
          ? `Searching the web for facts and sources: ${formatCount(finished)} of ${count(searches.length, "search", "searches")} done.`
          : "Searching the web for facts and sources to cite.",
        result: researchLine(searches),
      },
      draft: {
        waiting: "The article, written from the outline you approved.",
        live: sections
          ? `Writing the article's ${count(sections, "section")}, in the outline's order.`
          : "Writing the article, in the outline's order.",
      },
      style: {
        waiting: "A pass over the wording and the flow.",
        live: "Checking the draft against the outline, then smoothing the wording and the flow.",
      },
      checks: {
        waiting: "Readability, on-page SEO and trust.",
        live: "Scoring readability, on-page SEO and trust, then saving the article.",
      },
    },
    footer:
      "You can leave this page. The article keeps being written, and we’ll tell you when it’s ready.",
  };
}

/** "7 searches · 12 results read". */
function researchLine(searches: RunSearch[]): string | undefined {
  if (!searches.length) return undefined;
  const results = searches.reduce(
    (sum, search) => sum + (search.results ?? 0),
    0,
  );
  return joinParts([
    count(searches.length, "search", "searches"),
    results ? `${count(results, "result")} read` : null,
  ]);
}

function describeAnalysis(
  findings: RunFindings,
  keyword: string,
  countryCode: string | null | undefined,
  state: (id: string) => RunStageState,
  startedAt: number | undefined,
): RunView {
  const country = countryName(countryCode);
  const sites = findings.siteCount ?? findings.sites?.length;
  const results = (findings.results ?? []).map((result) => ({
    position: result.position,
    title: result.title,
    site: result.domain,
  }));
  return {
    header: {
      title: keyword ? `Analysing “${keyword}”` : "Analysing the keyword",
      subtitle: `Google · ${country}`,
      startedAt,
    },
    details: {
      "search-results": {
        live: keyword
          ? `Looking up Google’s first page for “${keyword}” in ${inCountry(country)}.`
          : `Looking up Google’s first page in ${inCountry(country)}.`,
        result: searchResultsLine(findings),
        items:
          results.length && shown(state("search-results"))
            ? { kind: "results", items: results, preview: RESULTS_PREVIEW }
            : undefined,
      },
      competitors: {
        waiting: "What each site on the first page offers.",
        live: `Working out what ${
          sites === 1
            ? "the one site on the first page"
            : sites
              ? `each of the ${formatCount(sites)} sites`
              : "each site on the first page"
        } offers: a guide to learn from, a tool, or a shop.`,
        result: competitorsLine(findings),
        // One call works out every site, so they show together while it runs and are never
        // ticked one by one.
        items:
          state("competitors") === "active" && findings.sites?.length
            ? { kind: "chips", items: findings.sites }
            : undefined,
      },
      measure: {
        waiting:
          "Monthly searches, how hard it is to rank, and the links behind the top pages.",
        live: `Looking up monthly searches, difficulty and links for ${inCountry(country)}.`,
        result: metricsLine(findings),
      },
    },
    footer:
      "You can leave this page. The analysis keeps going, and we’ll tell you when it’s ready.",
  };
}

function describeTitles(
  findings: RunFindings,
  keyword: string,
  type: string | null,
  intent: SearchIntent | undefined,
  state: (id: string) => RunStageState,
  startedAt: number | undefined,
): RunView {
  const keyphrase = findings.focusKeyphrase || keyword;
  const max = titleMaxChars(keyphrase);
  const drafts = findings.drafts ?? [];
  const written = drafts.length
    ? drafts.filter((draft) => draft.complete).length
    : (findings.finalTitles?.length ?? 0);
  const total = findings.draftsDone
    ? drafts.length
    : Math.max(TITLES_ASKED, drafts.length, written);
  const typeAndIntent = sentence(
    [
      type ? contentTypeLabel(type) : null,
      intent ? `for readers who want to ${INTENT_WORDS[intent]}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
  );
  const note = findings.regenerationNote;
  const header: RunHeader =
    note !== undefined
      ? {
          title: "Writing five new titles",
          subtitle: note ? `Using your note: “${note}”` : typeAndIntent,
          startedAt,
        }
      : {
          title: keyword ? `Writing titles for “${keyword}”` : "Writing titles",
          subtitle: typeAndIntent,
          startedAt,
        };
  const rows = titleRows(findings, keyphrase, total);
  return {
    header,
    details: {
      titles: {
        live: writingLine(findings, written, total),
        result: written ? `${count(written, "title")} written` : undefined,
        items:
          rows.length && shown(state("titles"))
            ? { kind: "titles", rows }
            : undefined,
        progress: { done: written, total, label: "titles written" },
      },
      "title-checks": {
        waiting: keyphrase
          ? `Each one must contain “${keyphrase}” and run ${TITLE_MIN_CHARS} to ${max} characters. Any that don’t are rewritten.`
          : `Each one must run ${TITLE_MIN_CHARS} to ${max} characters. Any that don’t are rewritten.`,
        live: checkingLine(drafts, keyphrase, max),
        result: checksLine(findings),
      },
    },
    footer:
      "You can leave this page. The titles keep coming, and we’ll tell you when they’re ready.",
  };
}

function describeOutline(
  findings: RunFindings,
  type: string | null,
  state: (id: string) => RunStageState,
  startedAt: number | undefined,
): RunView {
  const headings = findings.headings ?? [];
  return {
    header: {
      title: findings.selectedTitle
        ? `Outlining “${findings.selectedTitle}”`
        : "Outlining the article",
      subtitle: type ? contentTypeLabel(type) : undefined,
      startedAt,
    },
    details: {
      "keyword-groups": {
        live: "Pulling phrases from the pages that match your reader, then grouping them by topic.",
        result: groupsLine(findings),
      },
      outline: {
        waiting: "The sections, written one by one.",
        live: headings.length
          ? `Writing the sections: ${formatCount(headings.length)} so far.`
          : "Writing the sections.",
        result: outlineLine(findings),
        items:
          headings.length && shown(state("outline"))
            ? { kind: "lines", items: headings }
            : undefined,
      },
    },
    footer:
      "You can leave this page. The outline keeps coming, and we’ll tell you when it’s ready.",
  };
}

/** "10 results from 8 sites · 6 questions people ask · 8 related searches". */
function searchResultsLine(findings: RunFindings): string | undefined {
  const results = findings.results?.length ?? 0;
  const sites = findings.siteCount ?? 0;
  const questions = findings.questions?.length ?? 0;
  const related = findings.relatedSearches?.length ?? 0;
  return joinParts([
    results
      ? sites
        ? `${count(results, "result")} from ${count(sites, "site")}`
        : count(results, "result")
      : null,
    questions ? `${count(questions, "question")} people ask` : null,
    related ? count(related, "related search", "related searches") : null,
  ]);
}

/** "8 competing sites · searchers want to learn · 5 of the 8 match that". */
function competitorsLine(findings: RunFindings): string | undefined {
  const competitors = findings.competitors ?? [];
  const sites = competitors.length;
  if (!sites) return undefined;
  const { intent } = findings;
  const matching = competitors.filter(
    (competitor) => competitor.matchesIntent,
  ).length;
  return joinParts([
    count(sites, "competing site"),
    intent ? `searchers want to ${INTENT_WORDS[intent]}` : null,
    intent && matching
      ? matching >= sites
        ? sites === 1
          ? "it matches that"
          : `all ${formatCount(sites)} match that`
        : `${formatCount(matching)} of the ${formatCount(sites)} match that`
      : null,
  ]);
}

/** Why there is no monthly figure, by the backend's `volume_status`. */
const NO_VOLUME: Record<string, string> = {
  no_data: "No monthly search figure for this keyword",
  lookup_failed: "Monthly searches couldn’t be looked up",
  insufficient_credits: "Not enough credits to measure the keyword",
};

/** "1,900 searches a month · difficulty 28 of 100 (Medium) · saved to Keywords". */
function metricsLine(findings: RunFindings): string | undefined {
  const { metrics, saved } = findings;
  const parts: (string | null)[] = [];
  if (metrics) {
    const volume = describeMonthlyVolume(metrics.volume, metrics.volumeStatus);
    parts.push(
      volume.kind === "volume"
        ? `${count(volume.volume, "search", "searches")} a month`
        : (NO_VOLUME[metrics.volumeStatus ?? ""] ?? NO_VOLUME.no_data),
    );
    // A failed lookup sends a difficulty of 0 that was never measured, and so does an empty one.
    const measured =
      metrics.volumeStatus === null ||
      metrics.volumeStatus === "ok" ||
      metrics.volumeStatus === "no_data";
    const { difficulty } = metrics;
    if (
      difficulty !== null &&
      measured &&
      (volume.kind === "volume" || difficulty > 0)
    ) {
      parts.push(
        `difficulty ${difficulty} of 100 (${difficultyBand(difficulty)})`,
      );
    }
  }
  if (saved) parts.push("saved to Keywords");
  return joinParts(parts);
}

/** "3 of 5 written, from 8 related searches and 6 questions people ask." */
function writingLine(
  findings: RunFindings,
  written: number,
  total: number,
): string {
  const related = findings.titleSources?.relatedSearches ?? 0;
  const questions = findings.titleSources?.questions ?? 0;
  const sources = [
    related ? count(related, "related search", "related searches") : null,
    questions ? `${count(questions, "question")} people ask` : null,
  ].filter(Boolean);
  return `${formatCount(written)} of ${formatCount(total)} written${
    sources.length ? `, from ${sources.join(" and ")}` : ""
  }.`;
}

/** The title rows: the drafts as written, the next ones to come, or the checked set when no text streamed. */
function titleRows(
  findings: RunFindings,
  keyphrase: string,
  total: number,
): RunTitleRow[] {
  const drafts = findings.drafts ?? [];
  if (!drafts.length) {
    return (findings.finalTitles ?? []).map((title) => ({
      title,
      state: "written",
      checks: titleChecks(title, keyphrase),
    }));
  }
  const rows: RunTitleRow[] = drafts.map((draft) =>
    draft.complete
      ? {
          title: draft.title,
          state: "written",
          checks: titleChecks(draft.title, keyphrase),
          ...(draft.recommended ? { recommended: true } : {}),
          ...(draft.recommended && draft.reason
            ? { reason: draft.reason }
            : {}),
        }
      : { title: draft.title, state: "writing", checks: [] },
  );
  for (let index = rows.length; index < total; index += 1) {
    const ordinal = ORDINALS[index];
    rows.push({
      title: ordinal ? `${ordinal} title` : `Title ${index + 1}`,
      state: "next",
      checks: [],
    });
  }
  return rows;
}

/** The two checks the title step's score makes that the backend enforces: the keyword and the length. */
function titleChecks(
  title: string,
  keyphrase: string,
): { label: string; met: boolean }[] {
  return scoreTitle(title, keyphrase)
    .checks.filter((check) => check.id !== "clarity")
    .map((check) =>
      check.id === "keyphrase"
        ? {
            label: check.met ? "Has the keyword" : "Missing the keyword",
            met: check.met,
          }
        : { label: check.label, met: check.met },
    );
}

/** What the checks are doing, and the titles written so far that fail them (worked out in the page). */
function checkingLine(
  drafts: TitleDraft[],
  keyphrase: string,
  max: number,
): string {
  const checking = keyphrase
    ? `Checking each title holds “${keyphrase}” and runs ${TITLE_MIN_CHARS} to ${max} characters.`
    : `Checking each title runs ${TITLE_MIN_CHARS} to ${max} characters.`;
  const failing = drafts
    .filter((draft) => draft.complete)
    .map((draft) => titleChecks(draft.title, keyphrase))
    .filter((checks) => checks.some((check) => !check.met));
  if (failing.length === 0) return checking;
  if (failing.length > 1) {
    return `${checking} Rewriting ${failing.length} titles that don’t pass.`;
  }
  const length = failing[0].find(
    (check) => !check.met && check.label.includes("characters"),
  );
  return length
    ? `${checking} Rewriting 1 title that ran to ${length.label.split(",")[0]}.`
    : `${checking} Rewriting 1 title that left out “${keyphrase}”.`;
}

/** "All 5 pass · 1 rewritten to fit": the checked set against the drafts. */
function checksLine(findings: RunFindings): string | undefined {
  const finals = findings.finalTitles ?? [];
  if (!finals.length) return undefined;
  const drafts = (findings.drafts ?? [])
    .filter((draft) => draft.complete)
    .map((draft) => normalizeTitle(draft.title));
  const drafted = new Set(drafts);
  const rewritten = drafts.length
    ? finals.filter((title) => !drafted.has(normalizeTitle(title))).length
    : 0;
  const leftOut = Math.max(0, drafts.length - finals.length);
  return joinParts([
    leftOut
      ? `${formatCount(finals.length)} ${finals.length === 1 ? "passes" : "pass"}`
      : finals.length === 1
        ? "The title passes"
        : `All ${formatCount(finals.length)} pass`,
    rewritten ? `${formatCount(rewritten)} rewritten to fit` : null,
    leftOut ? `${formatCount(leftOut)} left out` : null,
  ]);
}

/** "26 phrases in 5 groups: bed layout, planting dates, spacing, small spaces, planner tools." */
function groupsLine(findings: RunFindings): string | undefined {
  const groups = findings.groups ?? [];
  if (!groups.length) return undefined;
  const phrases = groups.reduce((sum, group) => sum + group.phrases, 0);
  const names = groups.map((group) => group.name).filter(Boolean);
  const named = names.slice(0, GROUPS_NAMED);
  const more = names.length - named.length;
  const counted = phrases
    ? `${count(phrases, "phrase")} in ${count(groups.length, "group")}`
    : count(groups.length, "group");
  return `${counted}${
    named.length
      ? `: ${named.join(", ")}${more > 0 ? ` and ${formatCount(more)} more` : ""}`
      : ""
  }.`;
}

/** "7 sections · about 1,800 words". */
function outlineLine(findings: RunFindings): string | undefined {
  const sections =
    findings.outline?.sections ?? (findings.headings?.length || null);
  const words = findings.outline?.words ?? null;
  return joinParts([
    sections ? count(sections, "section") : null,
    words ? `about ${formatCount(words)} words` : null,
  ]);
}

// ── Words ────────────────────────────────────────────────────────────────────

/**
 * The country the search runs in, by name. The backend looks a global search up in the United
 * States (rext-backend `fetch_serp`, and the keyword metrics' `resolve_country`).
 */
export function countryName(code: string | null | undefined): string {
  const value = (code ?? "").trim();
  if (!value || value.toLowerCase() === "global") return "United States";
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(
        value.toUpperCase(),
      ) ?? value.toUpperCase()
    );
  } catch {
    return value;
  }
}

/** "in the United States", "in France". */
function inCountry(name: string): string {
  return /^United |Islands$|^(Netherlands|Philippines|Bahamas|Gambia|Maldives|Comoros|Seychelles|Dominican Republic|Central African Republic|Czech Republic)$/.test(
    name,
  )
    ? `the ${name}`
    : name;
}

/** "1 result", "1,200 results". */
function count(n: number, one: string, many = `${one}s`): string {
  return `${formatCount(n)} ${n === 1 ? one : many}`;
}

function joinParts(parts: (string | null)[]): string | undefined {
  const kept = parts.filter((part): part is string => Boolean(part));
  return kept.length ? kept.join(" · ") : undefined;
}

function sentence(line: string): string | undefined {
  return line ? line.charAt(0).toUpperCase() + line.slice(1) : undefined;
}

function shown(state: RunStageState): boolean {
  return state === "active" || state === "complete";
}

// ── Reading unknown data ─────────────────────────────────────────────────────

function isRecord(value: unknown): value is Values {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function records(value: unknown): Values[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function wholeNumber(value: unknown): number | null {
  const n = typeof value === "string" && value.trim() ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n >= 0
    ? Math.round(n)
    : null;
}

/** The object, or an empty one for anything else. */
function record(value: unknown): Values {
  return isRecord(value) ? value : {};
}

function content(values: Values): Values {
  return record(values.content);
}

/** Each once, in order, empty ones dropped. */
function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
