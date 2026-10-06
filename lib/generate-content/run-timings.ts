/**
 * How long each run stage usually takes, for the run component's "about 20 s" and its "still
 * working" past 1.5 times that. Learned from this browser's past runs (the last five of each stage,
 * in localStorage); until a stage has run here, a typical time measured on the local stack.
 */

// Versioned with the stages' boundaries: #260 moved research out of "draft" and the save into
// "checks", so samples kept under the first key describe other stages.
const STORAGE_KEY = "rext-run-stage-times:2";
const SAMPLES = 5;

const TYPICAL_MS: Record<string, number> = {
  "search-results": 10_000,
  competitors: 5_000,
  measure: 15_000,
  "content-type": 10_000,
  titles: 12_000,
  "keyword-groups": 8_000,
  outline: 25_000,
  research: 40_000,
  draft: 110_000,
  style: 45_000,
  checks: 40_000,
  // The workspace analysis (lib/workspace/workspace-run-stages.ts).
  "workspace-scrape": 20_000,
  "workspace-brand-voice": 60_000,
  "workspace-competitors": 15_000,
};

type Samples = Record<string, number[]>;

function readSamples(): Samples {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" ? (parsed as Samples) : {};
  } catch {
    return {};
  }
}

/** The usual duration of a stage, in ms; undefined for a stage with no history and no typical time. */
export function expectedStageMs(stageId: string): number | undefined {
  const samples = readSamples()[stageId]?.filter(
    (ms) => typeof ms === "number" && ms > 0,
  );
  if (samples?.length) {
    return Math.round(
      samples.reduce((sum, ms) => sum + ms, 0) / samples.length,
    );
  }
  return TYPICAL_MS[stageId];
}

/** Remembers how long a stage took, keeping the last five. */
export function recordStageMs(stageId: string, ms: number): void {
  if (!(ms > 0)) return;
  try {
    const samples = readSamples();
    samples[stageId] = [...(samples[stageId] ?? []), ms].slice(-SAMPLES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
  } catch {
    // Storage blocked or full: the typical times still apply.
  }
}

/** "8 s", "1 min 20 s", "2 min". */
export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}
