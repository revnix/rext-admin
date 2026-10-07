"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The inline "Saved" beside a section's Save (design/app-language.md §10), in place of a toast: shown
 * for two seconds after a save, and gone at once when the form changes again. Pass it to FormShell's
 * `status`; call `markSaved()` after the save, before resetting the form to the saved values.
 */
export function useSavedStatus(isDirty: boolean) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isDirty) setSaved(false);
  }, [isDirty]);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  const markSaved = useCallback(() => setSaved(true), []);

  return { status: saved ? "Saved" : null, markSaved };
}
