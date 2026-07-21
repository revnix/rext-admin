"use client";

import { getSession, useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout-utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { withRefreshLock } from "@/lib/auth-refresh-lock";
import { log } from "@/lib/logger";

/**
 * Session Manager Component
 *
 * Automatically refreshes the session when it's about to expire.
 * Keeps the UI components for manual fallback if auto-refresh fails.
 */
export function SessionTimeoutWarning() {
  const { showWarning, sessionExpired } = useSessionTimeout();
  const { data: session, update } = useSession();
  const [isExtending, setIsExtending] = useState(false);

  const handleExtendSession = useCallback(async () => {
    if (isExtending) return;

    // The session already carries a definitive rejection from a previous
    // refresh attempt — retrying here would reuse the same dead refresh
    // token and get the same rejection, re-triggering useAuthSession's
    // logout effect in a tight loop (repeated backend calls, repeated
    // signOut()/redirect cycles) instead of letting that single effect
    // own the logout.
    if (session?.error) {
      return;
    }

    setIsExtending(true);
    try {
      if (!session?.user?.refreshToken) {
        log.error("[Auth] No refresh token available for automatic refresh");
        performLogout("/login?session=expired");
        return;
      }

      // Route the whole check-then-refresh sequence through the cross-tab
      // refresh lock (see lib/auth-refresh-lock.ts) so it can never run
      // concurrently with authenticatedFetch's reactive 401 handler — or
      // another tab's copy of this same effect — for the same refresh
      // token. Backend refresh tokens are single-use: two concurrent
      // requests racing for the same token produce one legitimate rotation
      // and one definitive-looking "invalid/revoked" rejection, which
      // previously forced a logout moments after a valid refresh had just
      // succeeded. Serializing on the lock means the second caller only
      // starts once the first has fully resolved and the session cookie
      // reflects the outcome.
      const result = await withRefreshLock(async () => {
        // All open tabs share the same session cookie and poll on the same
        // 10s interval, so they cross the warning threshold within the same
        // tick. Re-read the session first, now that we hold the lock — if
        // another tab (or the reactive 401 handler) already rotated the
        // token while we were waiting for the lock, its updated expiry is
        // already visible here via the shared cookie, and we skip our own
        // redundant refresh instead of reusing a refresh token that's about
        // to be (or already was) rotated by that other caller.
        const expiryBeforeSync = session.accessTokenExpires;
        const freshSession = await getSession();

        log.debug("[Auth] Cross-tab sync check", {
          expiryBeforeSyncIso: expiryBeforeSync
            ? new Date(expiryBeforeSync).toISOString()
            : undefined,
          freshExpiryIso: freshSession?.accessTokenExpires
            ? new Date(freshSession.accessTokenExpires).toISOString()
            : undefined,
          changedByAnotherTab:
            !!freshSession?.accessTokenExpires &&
            freshSession.accessTokenExpires !== expiryBeforeSync,
        });

        if (
          freshSession?.accessTokenExpires &&
          freshSession.accessTokenExpires !== expiryBeforeSync &&
          freshSession.accessTokenExpires > Date.now()
        ) {
          log.info(
            "[Auth] Token already refreshed by another tab, skipping redundant refresh",
          );
          return { skipped: true } as const;
        }

        // A no-argument update() is a GET in next-auth/react beta.31 and does
        // not set `trigger === "update"`. Send an explicit action so the JWT
        // callback performs one intentional backend rotation.
        log.debug("[Auth] Requesting an explicit server-side token refresh");
        const updatedSession = await update({
          authAction: "refresh-backend-token",
        });

        return { skipped: false, updatedSession } as const;
      });

      if (result.skipped) {
        return;
      }

      if (result.updatedSession?.error === "RefreshAccessTokenError") {
        log.error("[Auth] Session refresh failed", result.updatedSession.error);
        performLogout("/login?session=expired");
        return;
      }

      log.info("[Auth] Session refreshed automatically", {
        newAccessExpiryIso: result.updatedSession?.accessTokenExpires
          ? new Date(result.updatedSession.accessTokenExpires).toISOString()
          : undefined,
      });
    } catch (error) {
      // A thrown exception here (e.g. a network blip calling getSession()/
      // update()) is not the same as a definitive "refresh token rejected"
      // response — that's handled above via updatedSession?.error. Forcing
      // a logout on any transient error was itself a bug: a single flaky
      // request could end a session whose refresh token was still valid
      // for days. Log it and let the next check — or the reactive 401
      // handler in authenticatedFetch, which has its own retry/classify
      // logic — resolve it instead.
      log.error("[Auth] Failed to extend session, will retry later:", error);
    } finally {
      setIsExtending(false);
    }
  }, [isExtending, session, update]);

  // Handle automatic refresh when session is about to expire.
  //
  // Edge-triggered via `hasTriggeredRef` rather than firing on every
  // dependency change: `session` (and therefore `handleExtendSession`) gets
  // a new identity on every refresh, which re-runs this effect immediately
  // after a refresh completes — but `showWarning` from useSessionTimeout()
  // hasn't been recomputed to `false` yet in that same render pass (it's
  // updated by a separate effect/hook). Without the ref guard, that
  // one-render staleness re-triggers a refresh, which produces another new
  // session object, which re-triggers again — a tight loop that hammers the
  // backend's single-use refresh-token rotation many times a second until it
  // starts rejecting requests, which is what was causing the login redirect
  // loop.
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!showWarning) {
      hasTriggeredRef.current = false;
      return;
    }

    if (
      hasTriggeredRef.current ||
      isExtending ||
      !session?.user?.refreshToken ||
      session?.error
    ) {
      return;
    }

    hasTriggeredRef.current = true;
    log.info("[Auth] Session expiring soon, triggering automatic refresh...");
    handleExtendSession();
  }, [showWarning, isExtending, session, handleExtendSession]);

  // `sessionExpired` is a local wall-clock check against a cached
  // access-token timestamp (see useSessionTimeout) — it's computed on a 10s
  // poll and can go stale, e.g. a backgrounded tab whose interval was
  // throttled past the real expiry. Treat it as "go verify" rather than
  // "the refresh token is dead": attempt one refresh first, and only log
  // out if that refresh itself comes back with a definitive rejection
  // (handled inside handleExtendSession via updatedSession?.error).
  // Logging out unconditionally here was the bug — it could end a session
  // whose refresh token was still valid for days. Edge-triggered via
  // `hasTriggeredExpiredRef` for the same reason as the warning effect
  // above: `session` changes identity on every refresh attempt, which
  // would otherwise re-fire this effect and re-attempt on every settle.
  const hasTriggeredExpiredRef = useRef(false);

  useEffect(() => {
    if (!sessionExpired) {
      hasTriggeredExpiredRef.current = false;
      return;
    }

    if (
      hasTriggeredExpiredRef.current ||
      isExtending ||
      !session ||
      session.error
    ) {
      return;
    }

    hasTriggeredExpiredRef.current = true;
    log.warn(
      "[Auth] Local expiry check fired, verifying via refresh before logout",
    );
    handleExtendSession();
  }, [sessionExpired, isExtending, session, handleExtendSession]);

  // Don't render if session doesn't exist or has error
  if (!session || session.error) {
    return null;
  }

  // No modal is shown if refresh fails; user is logged out instead
  return null;
}
