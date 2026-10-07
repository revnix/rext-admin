const normalize = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();

/**
 * Whether submitting `value` + `country` at the keyword step starts a new
 * analysis rather than confirming the one already on screen.
 *
 * An analysis is identified by keyword AND country. When the country the
 * analysis ran for is unknown (older threads restored without it) only the
 * keyword is compared; the backend still compares both and is authoritative.
 */
export function isKeywordReanalysis({
  value,
  primaryKeyword,
  country,
  analyzedCountry,
}: {
  value: string;
  primaryKeyword: string;
  country: string;
  analyzedCountry?: string | null;
}): boolean {
  if (normalize(value) !== normalize(primaryKeyword)) return true;
  if (!normalize(analyzedCountry)) return false;
  return normalize(country) !== normalize(analyzedCountry);
}

/**
 * Whether Analyze can be pressed (FB2.3, rext-control#684). On the keyword step, an Analyze for
 * the keyword and country already on screen would confirm that keyword and move the run on to the
 * next step, so it waits until one of them changes: typing the same keyword back shows the
 * analysis that's there, with no request.
 */
export function canAnalyze({
  atKeywordStep,
  value,
  primaryKeyword,
  country,
  analyzedCountry,
}: {
  /** The run is paused on the keyword step (step 2), with an analysis on screen. */
  atKeywordStep: boolean;
  value: string;
  primaryKeyword: string;
  country: string;
  analyzedCountry?: string | null;
}): boolean {
  // Step 1 is unchanged: the field's own "required" stops an empty keyword.
  if (!atKeywordStep) return true;
  return isKeywordReanalysis({ value, primaryKeyword, country, analyzedCountry });
}

/**
 * A keyword analysed from the keyword step itself (a suggestion's Analyze, or a new keyword typed
 * there) runs in place: the step stays on screen with its keyword card waiting, rather than the
 * whole page turning into the run's progress, as if the flow had moved on (FB2.3).
 */
export function isReanalysingInPlace({
  atKeywordStep,
  phase,
}: {
  atKeywordStep: boolean;
  phase: string | null | undefined;
}): boolean {
  return atKeywordStep && phase === "analysis";
}
