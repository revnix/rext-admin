"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import {
  AUTH_SESSION_SYNC_PERMISSIONS_ACTION,
  PERMISSIONS_STALE_EVENT,
  inTurnWithTokenRefresh,
} from "@/lib/auth-utils";

// A request that is genuinely forbidden keeps returning 403, and a sync
// re-renders the session, which can refetch that request. The cooldown stops
// that from looping; tab focus is never delayed by it.
const STALE_403_COOLDOWN_MS = 5_000;
const FOCUS_SYNC_COOLDOWN_MS = 60_000;

/**
 * Keeps the session's platform role/permissions in step with the backend, so
 * a role an admin assigns or removes shows up without logging out and back in.
 * Syncs immediately when the tab/window regains focus and after a 403. Only
 * one sync runs at a time, so a burst of triggers makes a single call. Never
 * rotates tokens (see syncPlatformPermissions).
 */
export function PermissionSync() {
  const { status, update } = useSession();
  const isAuthenticated = status === "authenticated";
  // Every sync flips status to "loading" and back and gives update() a new
  // identity, re-running the effect below. The cooldown and in-flight flag
  // live in refs so a re-run can't reset them — otherwise one 403 turns into
  // an endless update() loop.
  const updateRef = useRef(update);
  updateRef.current = update;
  const inFlight = useRef(false);
  const lastStaleSync = useRef(0);
  const lastFocusSync = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const sync = async () => {
      if (inFlight.current || document.visibilityState !== "visible") return;
      inFlight.current = true;
      try {
        // In turn with a token refresh: this write's answer sets the session cookie again, and
        // beside a refresh it could put the cookie of before the refresh back.
        await inTurnWithTokenRefresh(() =>
          updateRef.current({
            authAction: AUTH_SESSION_SYNC_PERMISSIONS_ACTION,
          }),
        );
      } catch {
        // Keep the current permissions; the next trigger retries.
      } finally {
        inFlight.current = false;
      }
    };

    const onStale = () => {
      if (Date.now() - lastStaleSync.current < STALE_403_COOLDOWN_MS) return;
      lastStaleSync.current = Date.now();
      void sync();
    };
    const onFocus = () => {
      if (Date.now() - lastFocusSync.current < FOCUS_SYNC_COOLDOWN_MS) return;
      lastFocusSync.current = Date.now();
      void sync();
    };

    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    window.addEventListener(PERMISSIONS_STALE_EVENT, onStale);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(PERMISSIONS_STALE_EVENT, onStale);
    };
  }, [isAuthenticated]);

  return null;
}
