"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Where a typed "c" belongs to something else: a field, the editor, or an open menu or dialog. */
function typingElsewhere(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target.closest("input, textarea, select, [contenteditable='true']"))
    return true;
  return Boolean(
    target.closest(
      "[role='dialog'], [role='alertdialog'], [role='menu'], [role='listbox']",
    ),
  );
}

/** "C" opens Generate, as in Linear (research 06 §11.3); null when the person can't generate. */
export function useGenerateShortcut(url: string | null) {
  const router = useRouter();

  useEffect(() => {
    if (!url) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "c") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
        return;
      if (event.repeat || event.isComposing || event.defaultPrevented) return;
      if (typingElsewhere(event.target)) return;
      event.preventDefault();
      router.push(url as Route);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [url, router]);
}
