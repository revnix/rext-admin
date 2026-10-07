"use client";

import posthog, { type CaptureResult } from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, Suspense, useRef, useState } from "react";
import { AnalyticsConsentPrompt } from "@/components/privacy/analytics-consent-prompt";
import {
  analytics,
  registerPostHog,
  takeOAuthLinking,
  unregisterPostHog,
} from "@/lib/analytics";
import { analyticsMode, onConsentChange } from "@/lib/analytics-consent";
import {
  anonymousEvent,
  anonymousRoute,
  redactEventUrls,
  redactStoredAddresses,
  redactUrl,
  STORED_ADDRESS_OPTIONS,
} from "@/lib/analytics-redact";

// ── Page-view tracker ─────────────────────────────────────────────────────────
// Wrapped in Suspense because useSearchParams() requires it in App Router.
// The route of the page on screen, with its parameters named instead of filled in. Read by
// before_send, which turns the page views and leaves of someone who said no into this.
let routeOnScreen: string | null = null;

function PostHogPageView({ anonymous }: { anonymous: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();

  useEffect(() => {
    if (!pathname) return;
    routeOnScreen = anonymousRoute(pathname, params ?? {});
    let url = window.origin + pathname;
    const qs = searchParams.toString();
    if (qs) url = `${url}?${qs}`;
    posthog.capture("$pageview", {
      // For someone who said no, the page's route and nothing of whose it is. Otherwise the
      // address without an emailed link's token or a sign-in page's email.
      $current_url: anonymous ? window.origin + routeOnScreen : redactUrl(url),
    });
  }, [pathname, searchParams, params, anonymous]);

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
      resetIdentity();
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

/** What the person allows, once it is known and posthog-js runs: everything, or anonymous counts. */
type RunningMode = "full" | "anonymous";

// Read by before_send, which posthog-js keeps for the page's life: a "no" given later applies at once.
let runningMode: RunningMode | null = null;

/** posthog-js's before_send: the credentials out of every address; for a "no", page routes only. */
function beforeSend(event: CaptureResult | null): CaptureResult | null {
  const redacted = redactEventUrls(event);
  return runningMode === "anonymous"
    ? anonymousEvent(redacted, routeOnScreen)
    : redacted;
}

/**
 * Forgets who the person is (a sign-out) and puts back what is allowed. posthog-js's reset also
 * clears its own record of the choice, and under the consent rule it then captures nothing until
 * it is told again: without this, a sign-out followed by a sign-in on the same page would send
 * nothing until a reload.
 */
function resetIdentity(): void {
  posthog.reset();
  if (runningMode === "full") {
    posthog.opt_in_capturing({ captureEventName: false });
  } else if (runningMode === "anonymous") {
    posthog.opt_out_capturing();
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Null until the person's answer is known and posthog-js runs (lib/analytics-consent.ts): in
  // the EEA, the UK and Switzerland that is after they answer the prompt, and nothing is sent
  // before. A child's effect runs before this one's, and posthog-js drops an identify or a capture
  // made before init, so the page views, the auth sync and the OAuth record mount only once it is
  // set: the sync before the record, so that the record goes out under the person rather than an
  // anonymous id (siblings' effects run in order).
  const [mode, setMode] = useState<RunningMode | null>(null);
  // Whether analytics is set up at all here; without it nobody is asked anything.
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    // NEXT_PUBLIC_ANALYTICS_ENABLED=false turns all of it off, page views and identification too.
    if (!key || process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false") return;
    setConfigured(true);

    let started = false;
    let cancelled = false;

    /** `explicit`: the person has just chosen, here; otherwise their region or an earlier choice. */
    const run = (next: RunningMode, explicit: boolean) => {
      runningMode = next;
      if (!started) {
        started = true;
        posthog.init(key, {
          // The EU cloud, as the Content-Security-Policy's default (lib/csp.ts) and the privacy texts say.
          api_host:
            process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
          capture_pageview: false, // tracked manually via PostHogPageView
          capture_pageleave: true,
          persistence: "localStorage",
          autocapture: false, // keep events intentional
          // Nothing is captured or stored until one of the two calls below: opt_in_capturing for
          // everything, opt_out_capturing for counting without an identity or any storage. The
          // second needs "Cookieless server hash mode" switched on in the PostHog project;
          // without it PostHog drops those counts.
          cookieless_mode: "on_reject",
          // No session is recorded until the app asks for it and masks what a recording shows
          // (rext-control task 712): a switch in the PostHog project can't start one by itself.
          disable_session_recording: true,
          // PostHog adds the current address to every event; redact the credentials in it.
          before_send: beforeSend,
          // And nothing raw in what the SDK stores in the tab (the referrer, on every event).
          ...STORED_ADDRESS_OPTIONS,
        });

        // The SDK keeps the first address and referrer of the person and of each session in the
        // browser, raw, whatever before_send does: redacted now, and whenever a session begins.
        redactStoredAddresses(posthog);
        posthog.onSessionId(() => redactStoredAddresses(posthog));
      }

      if (next === "full") {
        // `$opt_in` is sent for an explicit yes only, so it counts the people who chose.
        posthog.opt_in_capturing(
          explicit ? undefined : { captureEventName: false },
        );
        // Wire posthog into the analytics singleton so analytics.track() etc. work
        registerPostHog({
          identify: (distinctId, properties) =>
            posthog.identify(distinctId, properties),
          capture: (event, properties) => posthog.capture(event, properties),
          reset: resetIdentity,
        });
      } else {
        // A no: our own events stop, the identity goes, and what is left is counted without one.
        unregisterPostHog();
        posthog.reset();
        posthog.opt_out_capturing();
      }
      setMode(next);
    };

    void analyticsMode().then((allowed) => {
      // A choice made in the meantime has started it already.
      if (cancelled || started || allowed === "wait") return;
      run(allowed, false);
    });
    const stopListening = onConsentChange((choice) =>
      run(choice === "granted" ? "full" : "anonymous", true),
    );
    return () => {
      cancelled = true;
      stopListening();
    };
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        {mode && <PostHogPageView anonymous={mode === "anonymous"} />}
        {/* A person's identity and the sign-in's record: only for someone who allows them. */}
        {mode === "full" && (
          <>
            <PostHogAuthSync />
            <OAuthLoginRecord />
          </>
        )}
      </Suspense>
      {children}
      {/* Asked once, after signing in, where the law asks for it and nothing is chosen yet. */}
      {configured && <AnalyticsConsentPrompt />}
    </PHProvider>
  );
}
