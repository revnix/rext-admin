/**
 * What a person has typed into the create-workspace form, kept in the tab's own storage until the
 * workspace is made (rext-control task 854). Leaving the page and coming back (Home, a reload, a
 * phone's back gesture that went one step too far) brought the form back empty, with the way in
 * chosen gone too, and a newcomer who had started didn't start again. Session storage: this tab
 * only, gone when it closes, and cleared with everything else when the person signs out.
 */

const KEY = "rext:workspace-create-draft";
// No field of the form takes more than this; anything longer in storage isn't the form's.
const LONGEST = 2000;

export type CreateDraft = {
  from?: "website" | "description";
  name?: string;
  url?: string;
  description?: string;
};

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 && value.length <= LONGEST
    ? value
    : undefined;

/** The draft this tab holds, or nothing. Storage that is off or holds something else is nothing. */
export function readCreateDraft(): CreateDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const kept = JSON.parse(raw) as Record<string, unknown> | null;
    if (!kept || typeof kept !== "object") return null;
    return {
      from: kept.from === "description" ? "description" : "website",
      name: text(kept.name),
      url: text(kept.url),
      description: text(kept.description),
    };
  } catch {
    return null;
  }
}

/** Keeps what the form holds now; a form with nothing in it and the first way in keeps nothing. */
export function keepCreateDraft(draft: CreateDraft): void {
  try {
    const typed =
      text(draft.name) ?? text(draft.url) ?? text(draft.description);
    if (!typed && draft.from !== "description") {
      window.sessionStorage.removeItem(KEY);
      return;
    }
    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({
        from: draft.from === "description" ? "description" : "website",
        name: text(draft.name),
        url: text(draft.url),
        description: text(draft.description),
      }),
    );
  } catch {
    // Storage that is off or full: the form works without it.
  }
}

/** The workspace was made: nothing is left to come back to. */
export function dropCreateDraft(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // As above.
  }
}
