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
