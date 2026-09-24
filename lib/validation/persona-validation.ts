/**
 * Persona field rules.
 *
 * One module rather than a copy in the create page and another in the detail
 * view: the two forms write the same row, and a rule that only one of them
 * knows about is a rule the other silently breaks. The backend mirrors these
 * in `PersonaCreate`/`PersonaUpdate` — this half exists to tell someone what
 * is wrong while they are still typing, not to be the only line of defence.
 */

/** Bounds every persona field is held to, in one place so a limit can be
 *  changed without hunting through JSX. Lengths are in characters. */
export const PERSONA_LIMITS = {
  name: { min: 2, max: 60 },
  full_name: { min: 2, max: 100 },
  /** Optional, per the meeting decision. The bounds have to clear a real
   *  title at both ends: "CEO" and "VP" are shorter than a name would be
   *  allowed to get away with, and "Board-Certified Dermatologist and Clinical
   *  Researcher" is the kind of length an E-E-A-T byline actually runs to. */
  professional_title: { min: 2, max: 80 },
  description: { min: 0, max: 200 },
  bio: { min: 10, max: 1000 },
  demographics: { min: 0, max: 300 },
  tone_of_voice: { min: 0, max: 100 },
  areas_of_expertise: { max: 300, maxItems: 20, itemMin: 2, itemMax: 50 },
  goals: { max: 500, maxItems: 20, itemMin: 2, itemMax: 120 },
  pain_points: { max: 500, maxItems: 20, itemMin: 2, itemMax: 120 },
  behaviors: { max: 500, maxItems: 20, itemMin: 2, itemMax: 120 },
  linkedin_url: { min: 0, max: 500 },
  avatar_url: { min: 0, max: 500 },
  email: { min: 0, max: 320 },
} as const;

/** Names and titles: letters, digits, spaces and the punctuation that really
 *  turns up in a person's name. Everything else is rejected by name so the
 *  message can say which character was the problem. */
const NAME_ALLOWED = /^[\p{L}\p{N} .,'’&()-]+$/u;
const TITLE_ALLOWED = /^[\p{L}\p{N} .,'’&()/-]+$/u;

/** Long-form prose is allowed ordinary punctuation; what it may not contain is
 *  the markup/template/shell furniture that has no business in a bio and is
 *  what breaks a page when it is rendered back out. */
const UNSAFE_TEXT_CHARS = /[<>{}[\]\\|`~^$*=+_#@]/g;

/** Tabs and newlines are fine in a textarea; the rest of C0 and DEL are not.
 *  Checked by code point rather than by regex — a literal control character in
 *  a character class is both unreadable and a lint error. */
function hasControlChars(value: string): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code === 0x09 || code === 0x0a || code === 0x0d) continue;
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

const CONTAINS_LETTER = /\p{L}/u;

export const LINKEDIN_URL_RE =
  /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[\p{L}\p{N}_-]+\/?$/iu;

/** Deliberately permissive: this only has to catch a typed mistake, and the
 *  address is used to derive a Gravatar rather than to reach anyone. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Whether a string is a URL a browser could actually fetch.
 *
 * `new URL()` alone is not enough — it happily parses "https:///example.com"
 * (empty host), "https://-example.com" (a label that cannot start with a
 * hyphen) and "https://example,com" (a comma is not a host character), which
 * is exactly the set of malformed links that were getting saved. So the host
 * is checked label by label afterwards.
 */
export function isValidHttpUrl(value: string): boolean {
  const raw = value.trim();
  // "https:///example.com" has an empty authority. The WHATWG parser quietly
  // rewrites it to "https://example.com/" and reports success, so it has to be
  // caught on the raw string — the backend's parser does not forgive it, and a
  // link the form accepts and the API then rejects is the worse outcome.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/{3,}/.test(raw)) return false;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  const host = parsed.hostname;
  if (!host) return false;
  if (host === "localhost") return true;
  // A bare IPv4 literal is a legitimate image host; IPv6 arrives bracketed.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return host.split(".").every((o) => Number(o) <= 255);
  }
  if (host.startsWith("[")) return false;

  const labels = host.split(".");
  if (labels.length < 2) return false;
  const labelOk = (label: string) =>
    label.length > 0 &&
    label.length <= 63 &&
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label);
  if (!labels.every(labelOk)) return false;
  return /^[a-zA-Z]{2,}$/.test(labels[labels.length - 1]);
}

/**
 * Whether an avatar value is one we produced rather than one someone typed.
 *
 * Generated initials are stored as an inline SVG data URI and an uploaded file
 * as a bare object key. The edit form sends whatever it was given straight
 * back, so holding those to the pasted-link rule would refuse to save a
 * persona whose picture the system itself had chosen.
 */
export function isServerOwnedAvatar(value: string): boolean {
  const v = value.trim();
  // The slash is required: every key the upload route writes is
  // "avatars/personas/<id>/<file>", and without it a bare typed word like
  // "exampledotcom" would be waved through as though it were one.
  return (
    v.startsWith("data:image/") ||
    /^[A-Za-z0-9][A-Za-z0-9._-]*(\/[A-Za-z0-9][A-Za-z0-9._-]*)+$/.test(v)
  );
}

/** The offending characters, de-duplicated, so the error can name them. */
function unsafeCharsIn(value: string): string[] {
  const found = value.match(UNSAFE_TEXT_CHARS) ?? [];
  return Array.from(new Set(found));
}

type TextRuleOptions = {
  label: string;
  value: string | undefined;
  required?: boolean;
  min?: number;
  max?: number;
  /** Names and titles get an allowlist; prose gets the blocklist above. */
  charset?: RegExp;
  requireLetter?: boolean;
};

/** One field's error message, or undefined when it passes. */
export function validateText({
  label,
  value,
  required = false,
  min = 0,
  max,
  charset,
  requireLetter = false,
}: TextRuleOptions): string | undefined {
  const text = (value ?? "").trim();

  if (!text) return required ? `${label} is required` : undefined;

  if (hasControlChars(text)) {
    return `${label} contains characters that are not allowed`;
  }
  if (min && text.length < min) {
    return `${label} must be at least ${min} characters`;
  }
  if (max && text.length > max) {
    return `${label} must be ${max} characters or fewer (currently ${text.length})`;
  }
  if (requireLetter && !CONTAINS_LETTER.test(text)) {
    return `${label} must contain at least one letter`;
  }
  if (charset) {
    if (!charset.test(text)) {
      return `${label} may only contain letters, numbers, spaces and . , ' - & ( )`;
    }
    return undefined;
  }
  const bad = unsafeCharsIn(text);
  if (bad.length) {
    return `${label} cannot contain ${bad.join(" ")}`;
  }
  return undefined;
}

/** Splits a comma-separated field the way the form and the API both read it. */
export function splitList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const parts = Array.isArray(value) ? value : value.split(",");
  return parts.map((s) => String(s).trim()).filter(Boolean);
}

type ListRuleOptions = {
  label: string;
  value: string | string[] | undefined;
  max: number;
  maxItems: number;
  itemMin: number;
  itemMax: number;
};

/** Comma-separated fields: the separator is part of the contract, so an entry
 *  that is empty (", ,") or over-long is reported as such rather than silently
 *  dropped the way `splitList` would. */
export function validateList({
  label,
  value,
  max,
  maxItems,
  itemMin,
  itemMax,
}: ListRuleOptions): string | undefined {
  const raw = Array.isArray(value) ? value.join(", ") : (value ?? "").trim();
  if (!raw) return undefined;

  if (hasControlChars(raw)) {
    return `${label} contains characters that are not allowed`;
  }
  const bad = unsafeCharsIn(raw);
  if (bad.length) return `${label} cannot contain ${bad.join(" ")}`;
  if (raw.length > max) {
    return `${label} must be ${max} characters or fewer (currently ${raw.length})`;
  }

  const items = splitList(raw);
  if (!items.length) {
    return `${label} must be a comma separated list, e.g. "One, Two, Three"`;
  }
  if (items.length > maxItems) {
    return `${label} may list at most ${maxItems} entries`;
  }
  const short = items.find((item) => item.length < itemMin);
  if (short)
    return `Each entry in ${label} must be at least ${itemMin} characters`;
  const long = items.find((item) => item.length > itemMax);
  if (long)
    return `Each entry in ${label} must be ${itemMax} characters or fewer`;
  if (!items.every((item) => CONTAINS_LETTER.test(item))) {
    return `Each entry in ${label} must contain at least one letter`;
  }
  return undefined;
}

export interface PersonaFormValues {
  name?: string;
  full_name?: string | null;
  description?: string;
  professional_title?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  bio?: string;
  linkedin_url?: string | null;
  demographics?: string;
  areas_of_expertise?: string | string[];
  tone_of_voice?: string;
  goals?: string | string[];
  pain_points?: string | string[];
  behaviors?: string | string[];
}

export type PersonaErrors = Partial<Record<keyof PersonaFormValues, string>>;

/**
 * Every rule for a persona, applied in one pass.
 *
 * `name` is the only required field. It is *not* allowed to stand in for
 * `full_name` (or the other way round): the two mean different things, and
 * the fallback that used to be here is why a display name ended up printed
 * under "Full Name" on the detail page.
 */
export function validatePersona(values: PersonaFormValues): PersonaErrors {
  const errors: PersonaErrors = {};
  const L = PERSONA_LIMITS;

  const set = (field: keyof PersonaFormValues, message?: string) => {
    if (message && !errors[field]) errors[field] = message;
  };

  set(
    "name",
    validateText({
      label: "Persona display name",
      value: values.name,
      required: true,
      min: L.name.min,
      max: L.name.max,
      charset: NAME_ALLOWED,
      requireLetter: true,
    }),
  );

  set(
    "full_name",
    validateText({
      label: "Persona full name",
      value: values.full_name ?? undefined,
      min: L.full_name.min,
      max: L.full_name.max,
      charset: NAME_ALLOWED,
      requireLetter: true,
    }),
  );

  set(
    "professional_title",
    validateText({
      label: "Professional title",
      value: values.professional_title ?? undefined,
      min: L.professional_title.min,
      max: L.professional_title.max,
      charset: TITLE_ALLOWED,
      requireLetter: true,
    }),
  );

  set(
    "description",
    validateText({
      label: "Short description",
      value: values.description,
      max: L.description.max,
    }),
  );

  set(
    "bio",
    validateText({
      label: "Bio",
      value: values.bio,
      min: L.bio.min,
      max: L.bio.max,
    }),
  );

  set(
    "demographics",
    validateText({
      label: "Demographics",
      value: values.demographics,
      max: L.demographics.max,
    }),
  );

  set(
    "tone_of_voice",
    validateText({
      label: "Tone of voice",
      value: values.tone_of_voice,
      max: L.tone_of_voice.max,
    }),
  );

  set(
    "areas_of_expertise",
    validateList({
      label: "Areas of expertise",
      value: values.areas_of_expertise,
      ...L.areas_of_expertise,
    }),
  );
  set(
    "goals",
    validateList({ label: "Goals", value: values.goals, ...L.goals }),
  );
  set(
    "pain_points",
    validateList({
      label: "Pain points",
      value: values.pain_points,
      ...L.pain_points,
    }),
  );
  set(
    "behaviors",
    validateList({
      label: "Behaviors",
      value: values.behaviors,
      ...L.behaviors,
    }),
  );

  const avatar = (values.avatar_url ?? "").trim();
  if (avatar && !isServerOwnedAvatar(avatar)) {
    if (avatar.length > L.avatar_url.max) {
      set(
        "avatar_url",
        `Avatar URL must be ${L.avatar_url.max} characters or fewer`,
      );
    } else if (!isValidHttpUrl(avatar)) {
      set(
        "avatar_url",
        "Enter a valid image URL, e.g. https://example.com/photo.jpg",
      );
    }
  }

  const linkedin = (values.linkedin_url ?? "").trim();
  if (linkedin) {
    if (!isValidHttpUrl(linkedin) || !LINKEDIN_URL_RE.test(linkedin)) {
      set(
        "linkedin_url",
        "Enter a valid LinkedIn profile URL, e.g. https://linkedin.com/in/username",
      );
    }
  }

  const email = (values.email ?? "").trim();
  if (email) {
    if (email.length > L.email.max) {
      set("email", `Email must be ${L.email.max} characters or fewer`);
    } else if (!EMAIL_RE.test(email)) {
      set("email", "Please enter a valid email address");
    }
  }

  return errors;
}

/** The first error in form order, for the toast that summarises a failed submit. */
export function firstError(errors: PersonaErrors): string | undefined {
  const order: (keyof PersonaFormValues)[] = [
    "name",
    "full_name",
    "description",
    "avatar_url",
    "email",
    "professional_title",
    "bio",
    "linkedin_url",
    "demographics",
    "areas_of_expertise",
    "tone_of_voice",
    "goals",
    "pain_points",
    "behaviors",
  ];
  for (const field of order) {
    if (errors[field]) return errors[field];
  }
  return undefined;
}

/**
 * Whether two persona names are "the same" for duplicate-detection purposes.
 * Case and surrounding/repeated whitespace are not a distinction anyone means
 * to make, so "Mary Jane" and "mary  jane" collide. The backend applies the
 * same normalisation; this one only exists to catch it before the round trip.
 */
export function normalizePersonaName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}
