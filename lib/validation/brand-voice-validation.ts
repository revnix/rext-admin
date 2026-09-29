const CONTAINS_LETTER = /\p{L}/u;
const BRAND_NAME_CHARACTERS = /^[\p{L} ]+$/u;

/** Brand name accepts letters and spaces only; blank remains optional. */
export function validateBrandName(value: string): string | undefined {
  const text = value.trim();
  if (!text) return undefined;
  if (!BRAND_NAME_CHARACTERS.test(text)) {
    return "Brand name may only contain letters and spaces";
  }
  return undefined;
}

/** Other brand voice text may use punctuation and digits, but needs a letter. */
export function validateBrandVoiceText(
  value: string,
  label: string,
): string | undefined {
  if (!value.trim() || CONTAINS_LETTER.test(value)) return undefined;
  return `${label} must contain at least one letter`;
}

/** Validate each non-empty tag independently, not just the combined list. */
export function validateBrandVoiceItems(
  values: string[],
  label: string,
): string | undefined {
  const invalidIndex = values.findIndex(
    (value) => value.trim() && !CONTAINS_LETTER.test(value),
  );
  if (invalidIndex === -1) return undefined;
  return `${label} entries must each contain at least one letter`;
}
