"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, Suspense, useRef, useState } from "react";
import { analytics, registerPostHog } from "@/lib/analytics";
import { redactEventUrls, redactUrl } from "@/lib/analytics-redact";

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
    analytics.track(login.isNew ? "user_signed_up" : "user_signed_in", {
      method: login.provider,
    });
  }, [login]);

  return null;
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Set once posthog-js is wired into `analytics`. A child's effect runs before this one's, and an
  // event tracked before then never reaches PostHog, so the OAuth record mounts only after it.
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false, // tracked manually via PostHogPageView
      capture_pageleave: true,
      persistence: "localStorage",
      autocapture: false, // keep events intentional
      // PostHog adds the current address to every event; redact the credentials in it.
      before_send: redactEventUrls,
    });

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
        <PostHogPageView />
        <PostHogAuthSync />
        {registered && <OAuthLoginRecord />}
      </Suspense>
      {children}
    </PHProvider>
  );
}
