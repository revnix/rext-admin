export type MonthlyVolumeInput = string | number | null | undefined;

/**
 * Why the keyword analysis has, or lacks, a monthly search volume. Sent by the
 * backend beside the volume (`seo_state.volume_status`); the volume is a number
 * only when the status is `ok`. Runs and library records from before the
 * backend sent it carry no status.
 */
export type VolumeStatus =
  | "ok"
  | "no_data"
  | "lookup_failed"
  | "insufficient_credits";

/** What to show for a keyword's monthly volume: the number, or why there is none. */
export type MonthlyVolumeDisplay =
  | { kind: "volume"; volume: number }
  | { kind: "message"; label: string; detail: string };

const VOLUME_MESSAGES: Record<
  Exclude<VolumeStatus, "ok">,
  { label: string; detail: string }
> = {
  no_data: {
    label: "No search data",
    detail: "There is no measured monthly search volume for this keyword.",
  },
  lookup_failed: {
    label: "Lookup failed",
    detail:
      "The search volume could not be loaded. The rest of the analysis is not affected.",
  },
  insufficient_credits: {
    label: "Not enough credits",
    detail: "The volume lookup was skipped because the credits ran out.",
  },
};

/**
 * Whether the keyword analysis returned a usable monthly search volume.
 *
 * A volume of `0` is a valid result. `null`, `undefined`, empty strings and
 * non-numeric values mean the volume is unavailable, which is a completed
 * (handled) state rather than a loading one.
 */
export function isMonthlyVolumeAvailable(
  volume: MonthlyVolumeInput,
): volume is string | number {
  if (volume === null || volume === undefined) return false;
  if (typeof volume === "number") return Number.isFinite(volume);
  const normalized = volume.replace(/,/g, "").trim();
  return normalized !== "" && Number.isFinite(Number(normalized));
}

/**
 * The volume to show, or the words for why there is none. A status other than
 * `ok` always wins; a volume of 0 reads "No search data" (nobody searches it
 * enough to measure), never a spinner.
 */
export function describeMonthlyVolume(
  volume: MonthlyVolumeInput,
  status?: string | null,
): MonthlyVolumeDisplay {
  if (status && status !== "ok" && status in VOLUME_MESSAGES) {
    return {
      kind: "message",
      ...VOLUME_MESSAGES[status as Exclude<VolumeStatus, "ok">],
    };
  }
  if (isMonthlyVolumeAvailable(volume)) {
    const value = Number(String(volume).replace(/,/g, ""));
    if (value > 0) return { kind: "volume", volume: value };
  }
  return { kind: "message", ...VOLUME_MESSAGES.no_data };
}

/** 1.2k, 3.4M: the compact form used on cards and in tables. */
export function formatCompactVolume(volume: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(volume);
}
