"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, Suspense, useRef } from "react";
import { registerPostHog } from "@/lib/analytics";

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
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

// ── Session → PostHog identity sync ──────────────────────────────────────────
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
      });
    } else if (status === "unauthenticated" && identifiedIdRef.current) {
      identifiedIdRef.current = null;
      posthog.reset();
    }
  }, [status, session]);

  return null;
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function PostHogProvider({ children }: { children: React.ReactNode }) {
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
    });

    // Wire posthog into the analytics singleton so analytics.track() etc. work
    registerPostHog({
      identify: (distinctId, properties) =>
        posthog.identify(distinctId, properties),
      capture: (event, properties) => posthog.capture(event, properties),
      reset: () => posthog.reset(),
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
        <PostHogAuthSync />
      </Suspense>
      {children}
    </PHProvider>
  );
}
