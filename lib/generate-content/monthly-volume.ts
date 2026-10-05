export type MonthlyVolumeInput = string | number | null | undefined;

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
