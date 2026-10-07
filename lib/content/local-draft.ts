/**
 * An article's unsaved text kept on this device while a save is waiting or has failed (the
 * full-screen editor, task 706), so a closed tab or a lost connection doesn't lose it. Removed as soon
 * as a save works. Storage that is full, off or private-mode only costs the copy, never the editor.
 */

export type LocalDraft = { markdown: string; at: string };

const key = (contentId: string) => `rext:article-draft:${contentId}`;

export function readLocalDraft(contentId: string): LocalDraft | null {
  try {
    const raw = window.localStorage.getItem(key(contentId));
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<LocalDraft>;
    return typeof draft.markdown === "string" && typeof draft.at === "string"
      ? { markdown: draft.markdown, at: draft.at }
      : null;
  } catch {
    return null;
  }
}

export function writeLocalDraft(contentId: string, markdown: string) {
  try {
    window.localStorage.setItem(
      key(contentId),
      JSON.stringify({ markdown, at: new Date().toISOString() }),
    );
  } catch {
    // No room, or no storage: the save itself still runs.
  }
}

export function clearLocalDraft(contentId: string) {
  try {
    window.localStorage.removeItem(key(contentId));
  } catch {
    // Nothing to clear.
  }
}
