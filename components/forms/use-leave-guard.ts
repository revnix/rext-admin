"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { leaveGuardsLifted, putLeaveGuard } from "@/lib/leave-guard";

/**
 * Asks before leaving a form with unsaved changes (research 06 §6.2). Closing or reloading the tab
 * gets the browser's own prompt (`beforeunload`, only while dirty). A click on a link inside the app
 * is held, so the caller can ask in a dialog and then `leave()` or `stay()`; so is the form's own way
 * out, through `confirm(action)`. The App Router has no navigation events, so the links are watched
 * at the document, before Next's Link handles them. A navigation the shell makes in code (the
 * workspace switcher, the Generate shortcut) is held the same way, through lib/leave-guard.ts.
 */
export function useLeaveGuard(dirty: boolean) {
  const router = useRouter();
  // Where the person was going: a link they clicked, or the form's own Cancel.
  const [pending, setPending] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      // The person already said to leave, from the signed-out notice (lib/auth/signed-out.ts).
      if (leaveGuardsLifted()) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const href = url.pathname + url.search + url.hash;
      setPending(() => () => router.push(href as Route));
    };
    // Capture phase, so the held click never reaches Next's Link.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty, router]);

  // While dirty, this is the guard the shell's own navigation goes through.
  useEffect(() => {
    if (!dirty) return;
    return putLeaveGuard((action) => setPending(() => action));
  }, [dirty]);

  /** Runs `action` at once on a clean form; on a dirty one, asks first. */
  const confirm = useCallback(
    (action: () => void) => {
      if (dirty) setPending(() => action);
      else action();
    },
    [dirty],
  );

  const leave = useCallback(() => {
    const action = pending;
    setPending(null);
    action?.();
  }, [pending]);

  const stay = useCallback(() => setPending(null), []);

  return { isAsking: pending !== null, confirm, leave, stay };
}
