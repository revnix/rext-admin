"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, Suspense, useRef, useState } from "react";
import { analytics, registerPostHog, takeOAuthLinking } from "@/lib/analytics";
import {
  redactEventUrls,
  redactStoredAddresses,
  redactUrl,
  STORED_ADDRESS_OPTIONS,
} from "@/lib/analytics-redact";

// ── Page-view tracker ─────────────────────────────────────────────────────────
// Wrapped in Suspense because useSearchParams() requires it in App Router.
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    let url = window.origin + pathname;
    const qs = searchParams.toString();
    if (qs) url = `${url}?${qs}`;
    // An emailed link's token (or a sign-in page's email) never reaches analytics.
    posthog.capture("$pageview", { $current_url: redactUrl(url) });
  }, [pathname, searchParams]);

  return null;
}

// ── Session → PostHog identity sync ──────────────────────────────────────────
function systemColourScheme(): "dark" | "light" | undefined {
  if (typeof window.matchMedia !== "function") return undefined;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function PostHogAuthSync() {
  const { data: session, status } = useSession();
  const identifiedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      const userId = session.user.id;
      // Avoid redundant identify calls for the same user
      if (identifiedIdRef.current === userId) return;
      identifiedIdRef.current = userId;

      posthog.identify(userId, {
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
        role: session.user.role ?? undefined,
        // The app is light only; the system's preference is kept for a later decision on a dark theme.
        prefers_color_scheme: systemColourScheme(),
      });
    } else if (status === "unauthenticated" && identifiedIdRef.current) {
      identifiedIdRef.current = null;
      posthog.reset();
    }
  }, [status, session]);

  return null;
}

/** The logins already recorded, for a browser that refuses storage. */
const recordedLogins = new Set<number>();

/**
 * A Google or GitHub login, recorded once its session exists: a sign-up when the backend created the
 * account on it, otherwise a sign-in. The login's time keys it, so a reload or another tab doesn't
 * record it again. (The button's click records only that the person started, `oauth_started`.)
 */
export function OAuthLoginRecord() {
  const { data: session } = useSession();
  const login = session?.oauthLogin;

  useEffect(() => {
    if (!login || recordedLogins.has(login.at)) return;
    recordedLogins.add(login.at);
    const key = `rext-oauth-login-recorded:${login.at}`;
    try {
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, "1");
    } catch {
      // Storage refused: this page's set above still records it once.
    }
    // A provider linked from the settings is not a sign-in (markOAuthLinking); a new account still is.
    if (takeOAuthLinking(login.provider) && !login.isNew) return;
    analytics.track(login.isNew ? "user_signed_up" : "user_signed_in", {
      method: login.provider,
    });
  }, [login]);

  return null;
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Set once posthog-js is initialised and wired into `analytics`. A child's effect runs before this
  // one's, and posthog-js drops an identify or a capture made before init, so the page views, the auth
  // sync and the OAuth record mount only after it: the sync before the record, so that the record goes
  // out under the person rather than an anonymous id (siblings' effects run in order).
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    // NEXT_PUBLIC_ANALYTICS_ENABLED=false turns all of it off, page views and identification too.
    if (!key || process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false") return;

    posthog.init(key, {
      // The EU cloud, as the Content-Security-Policy's default (lib/csp.ts) and the privacy texts say.
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
      capture_pageview: false, // tracked manually via PostHogPageView
      capture_pageleave: true,
      persistence: "localStorage",
      autocapture: false, // keep events intentional
      // No session is recorded until the app asks for it and masks what a recording shows
      // (rext-control task 712): a switch in the PostHog project can't start one by itself.
      disable_session_recording: true,
      // PostHog adds the current address to every event; redact the credentials in it.
      before_send: redactEventUrls,
      // And nothing raw in what the SDK stores in the tab (the referrer, on every event).
      ...STORED_ADDRESS_OPTIONS,
    });

    // The SDK keeps the first address and referrer of the person and of each session in the
    // browser, raw, whatever before_send does: redacted now, and whenever a session begins.
    redactStoredAddresses(posthog);
    posthog.onSessionId(() => redactStoredAddresses(posthog));

    // Wire posthog into the analytics singleton so analytics.track() etc. work
    registerPostHog({
      identify: (distinctId, properties) =>
        posthog.identify(distinctId, properties),
      capture: (event, properties) => posthog.capture(event, properties),
      reset: () => posthog.reset(),
    });
    setRegistered(true);
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        {registered && (
          <>
            <PostHogPageView />
            <PostHogAuthSync />
            <OAuthLoginRecord />
          </>
        )}
      </Suspense>
      {children}
    </PHProvider>
  );
}
