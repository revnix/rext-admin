"use client";

import { getSession, useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout-utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
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
if (isExtending) {
log.debug(
"[Auth] handleExtendSession called while already extending — skipping",
);
return;
}

setIsExtending(true);
log.debug("[Auth] handleExtendSession starting", {
accessExpiryIso: session?.accessTokenExpires
? new Date(session.accessTokenExpires).toISOString()
: undefined,
msUntilAccessExpiry: session?.accessTokenExpires
? session.accessTokenExpires - Date.now()
: undefined,
});
try {
if (!session?.user?.refreshToken) {
log.error("[Auth] No refresh token available for automatic refresh");
performLogout("/login?session=expired");
return;
}

// All open tabs share the same session cookie and poll on the same
// 10s interval, so they cross the warning threshold within the same
// tick. Re-read the session first — if another tab already rotated
// the token in the meantime, its updated expiry is already visible
// here via the shared cookie, and we skip our own redundant refresh
// instead of reusing a refresh token that's about to be (or already
// was) blacklisted by that other tab's rotation.
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
return;
}

// A no-argument update() is a GET in next-auth/react beta.31 and does
// not set `trigger === "update"`. Send an explicit action so the JWT
// callback performs one intentional backend rotation.
log.debug("[Auth] Requesting an explicit server-side token refresh");
const updatedSession = await update({
authAction: "refresh-backend-token",
});

if (updatedSession?.error === "RefreshAccessTokenError") {
log.error("[Auth] Session refresh failed", updatedSession.error);
performLogout("/login?session=expired");
return;
}

log.info("[Auth] Session refreshed automatically", {
newAccessExpiryIso: updatedSession?.accessTokenExpires
? new Date(updatedSession.accessTokenExpires).toISOString()
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
// updated by a separate effect). Without the ref guard, that one-render
// staleness caused an immediate second refresh, which caused a third, and
// so on — a tight refresh loop that rotates the refresh token far faster
// than intended.
const hasTriggeredRef = useRef(false);

useEffect(() => {
if (!showWarning) {
hasTriggeredRef.current = false;
return;
}

if (hasTriggeredRef.current) {
log.debug(
"[Auth] Auto-refresh effect re-fired while already triggered this warning window — ignoring (loop guard)",
);
return;
}

if (isExtending || !session?.user?.refreshToken) {
return;
}

hasTriggeredRef.current = true;
log.info("[Auth] Session expiring soon, triggering automatic refresh...");
handleExtendSession();
}, [showWarning, isExtending, session, handleExtendSession]);

// Resume refresh: a backgrounded/throttled tab's 10s poll can miss the
// proactive window entirely, so re-check on every tab-visible/focus event
// and refresh immediately if the token already looks expired. Reuses
// handleExtendSession's own single-flight guard and definitive-failure-only
// logout — this is just an extra trigger to call it, not new refresh logic.
useEffect(() => {
const checkOnResume = () => {
if (document.visibilityState !== "visible") return;
if (isExtending || !session?.accessTokenExpires) return;
if (Date.now() < session.accessTokenExpires) return;

log.info("[Auth] Tab resumed with expired access token, refreshing...");
handleExtendSession();
};

document.addEventListener("visibilitychange", checkOnResume);
window.addEventListener("focus", checkOnResume);
return () => {
document.removeEventListener("visibilitychange", checkOnResume);
window.removeEventListener("focus", checkOnResume);
};
}, [session, isExtending, handleExtendSession]);

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

if (hasTriggeredExpiredRef.current || isExtending || !session) {
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