"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import {
  AUTH_SESSION_SYNC_PERMISSIONS_ACTION,
  PERMISSIONS_STALE_EVENT,
} from "@/lib/auth-utils";

// A request that is genuinely forbidden keeps returning 403, and a sync
// re-renders the session, which can refetch that request. The cooldown stops
// that from looping; tab focus is never delayed by it.
const STALE_403_COOLDOWN_MS = 5_000;

/**
 * Keeps the session's platform role/permissions in step with the backend, so
 * a role an admin assigns or removes shows up without logging out and back in.
 * Syncs immediately when the tab/window regains focus and after a 403. Only
 * one sync runs at a time, so a burst of triggers makes a single call. Never
 * rotates tokens (see syncPlatformPermissions).
 */
export function PermissionSync() {
  const { status, update } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    let inFlight = false;
    let lastStaleSync = 0;

    const sync = async () => {
      if (inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      try {
        await update({ authAction: AUTH_SESSION_SYNC_PERMISSIONS_ACTION });
      } catch {
        // Keep the current permissions; the next trigger retries.
      } finally {
        inFlight = false;
      }
    };

    const onStale = () => {
      if (Date.now() - lastStaleSync < STALE_403_COOLDOWN_MS) return;
      lastStaleSync = Date.now();
      void sync();
    };
    const onFocus = () => void sync();

    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    window.addEventListener(PERMISSIONS_STALE_EVENT, onStale);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(PERMISSIONS_STALE_EVENT, onStale);
    };
  }, [status, update]);

  return null;
}
