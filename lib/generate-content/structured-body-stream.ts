/**
 * Live preview for structured-body article generation.
 *
 * The backend writes the article as one object per approved outline section —
 * `"<block>":{"heading":"…","markdown":"…"}` — plus `introduction`, and leaves
 * `body_markdown` null (rext-backend `structured_body.py`). These helpers read
 * that from the partial JSON streamed so far, so the article renders while it
 * is being written instead of only after the final `updates` event.
 *
 * Pass the raw token buffer: the `\"` escapes inside the values must still be
 * intact, or a quote in the prose would end the value early.
 */

/**
 * Reads a JSON string value starting just after its opening quote. A value
 * whose closing quote has not streamed in yet is returned as far as it goes.
 * `end` is the index of the closing quote (or the buffer length).
 */
const readJsonStringPartial = (raw: string, start: number) => {
  let out = "";
  let i = start;
  for (; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "\\") {
      const next = raw[i + 1];
      if (next === undefined) break; // escape split across tokens
      i++;
      if (next === "n") out += "\n";
      else if (next === "r") out += "\r";
      else if (next === "t") out += "\t";
      else if (next === "u") {
        const hex = raw.slice(i + 1, i + 5);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) break; // not fully streamed yet
        out += String.fromCharCode(Number.parseInt(hex, 16));
        i += 4;
      } else out += next; // \" \\ \/
      continue;
    }
    if (ch === '"') break;
    out += ch;
  }
  return { value: out, end: i };
};

/** Latest value of a string field, partial values included. */
const extractJsonStringValuePartial = (raw: string, field: string) => {
  const needle = `"${field}":"`;
  const idx = raw.lastIndexOf(needle);
  if (idx === -1) return "";
  return readJsonStringPartial(raw, idx + needle.length).value;
};

/**
 * Every `heading`/`markdown` section streamed so far, in stream order, as
 * `## heading\n\nmarkdown` — the same shape the backend's
 * `blocks_to_body_markdown` assembles. A heading whose prose has not started
 * yet is still shown so the section appears as soon as it begins.
 */
export const extractStructuredSectionsPartial = (raw: string) => {
  const parts: string[] = [];
  const key = /"(heading|markdown)":"/g;
  let heading = "";
  let match: RegExpExecArray | null = key.exec(raw);
  while (match) {
    const { value, end } = readJsonStringPartial(raw, key.lastIndex);
    // Resume after the value so text inside it can never match as a key.
    key.lastIndex = end;
    if (match[1] === "heading") {
      if (heading) parts.push(`## ${heading}`);
      heading = value.trim();
    } else {
      const body = value.trim();
      if (heading && body) parts.push(`## ${heading}\n\n${body}`);
      else if (heading || body) parts.push(heading ? `## ${heading}` : body);
      heading = "";
    }
    match = key.exec(raw);
  }
  if (heading) parts.push(`## ${heading}`);
  return parts.join("\n\n");
};

/** `introduction` followed by the sections — "" until either has streamed. */
export const extractStructuredBodyPartial = (raw: string) =>
  [
    extractJsonStringValuePartial(raw, "introduction").trim(),
    extractStructuredSectionsPartial(raw),
  ]
    .filter(Boolean)
    .join("\n\n");
