"use client";

import posthog, { type CaptureResult } from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, Suspense, useRef, useState } from "react";
import {
  analytics,
  forgetPostHog,
  isImpersonating,
  registerPostHog,
  takeOAuthLinking,
  unregisterPostHog,
} from "@/lib/analytics";
import { analyticsMode, onConsentChange } from "@/lib/analytics-consent";
import {
  type EventContext,
  eventContext,
  workspaceSlugOf,
} from "@/lib/analytics-context";
import {
  anonymousEvent,
  anonymousRoute,
  redactEventUrls,
  redactStoredAddresses,
  redactUrl,
  STORED_ADDRESS_OPTIONS,
} from "@/lib/analytics-redact";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useWorkspaceStore } from "@/stores/workspace";
import { useWorkspaceContextStore } from "@/stores/workspace/use-workspace-context-store";

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

// ── What every event carries ─────────────────────────────────────────────────
/**
 * The workspace, the plan and the role on every event, and the plan on the person, so a funnel
 * can be split by plan or followed inside one workspace without each caller sending them (and
 * forgetting to). Set once here whenever one of them changes; posthog-js adds them to every event
 * from then on, page views included. The workspace is the one on screen, so an account page (no
 * workspace in its address) carries none.
 */
/** How long the person's properties are left to settle before they are sent, once. */
const PERSON_SETTLE_MS = 1500;
/** Where the person's properties as last sent are remembered, to send them only when they change. */
const PERSON_SENT_KEY = "rext-analytics-person";

/**
 * Puts the context on every event from here on. The workspace is taken off again on a page
 * that has none; the plan and the role stay as they were while they are still loading, so an
 * event sent meanwhile carries what the last page load knew.
 */
function applyContext(context: EventContext): void {
  const known = Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== null),
  );
  if (Object.keys(known).length > 0) posthog.register(known);
  if (context.workspace_id === null) posthog.unregister("workspace_id");
}

function AnalyticsContextSync() {
  const { data: session } = useSession();
  const { workspaceSlug } = useParams<{ workspaceSlug?: string }>() ?? {};
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspace?.id);
  const storedSlug = useWorkspaceStore((state) => state.currentWorkspace?.slug);
  const workspaceCount = useWorkspaceStore(
    (state) => state.workspaceList.length,
  );
  const plan = useSubscriptionStore(
    (state) => state.subscription?.subscription,
  );
  const role = session?.user?.role;
  const planName = plan?.plan_name;
  const planStatus = plan?.status;
  const billingPeriod = plan?.billing_period;
  const trialEnds = plan?.trial_end_date;

  useEffect(() => {
    applyContext(
      eventContext({
        routeSlug: workspaceSlug,
        workspace: { id: workspaceId, slug: storedSlug },
        role,
        subscription: {
          plan_name: planName,
          status: planStatus,
          billing_period: billingPeriod,
        },
      }),
    );
  }, [
    workspaceSlug,
    workspaceId,
    storedSlug,
    role,
    planName,
    planStatus,
    billingPeriod,
  ]);

  // The person's own properties, sent together once they have settled: the plan and the
  // workspaces load one after the other, and two updates would each look new to posthog-js,
  // which sends one again only when it differs from the last.
  useEffect(() => {
    if (!planName || !planStatus) return;
    const settle = window.setTimeout(() => {
      const properties = {
        plan: planName,
        plan_status: planStatus,
        billing_period: billingPeriod,
        trial_ends_at: trialEnds ?? null,
        workspaces: workspaceCount,
      };
      // Once per change, not once per page load: what was sent last is remembered in the
      // browser (signing out clears it, so the next sign-in sends it again).
      const sent = JSON.stringify(properties);
      try {
        if (window.localStorage.getItem(PERSON_SENT_KEY) === sent) return;
        window.localStorage.setItem(PERSON_SENT_KEY, sent);
      } catch {
        // Storage refused: it is sent on each page load instead.
      }
      posthog.setPersonProperties(properties);
    }, PERSON_SETTLE_MS);
    return () => window.clearTimeout(settle);
  }, [planName, planStatus, billingPeriod, trialEnds, workspaceCount]);

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

/**
 * posthog-js's before_send: nothing during impersonation; otherwise the credentials out of every
 * address, and for a "no", page routes only.
 */
function beforeSend(event: CaptureResult | null): CaptureResult | null {
  // An admin acting as a customer: nothing leaves, page views and identification included.
  if (isImpersonating()) return null;
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
  // the EEA, the UK and Switzerland that is after they answer the question in the shell
  // (AnalyticsConsentPrompt), and nothing is sent before. A child's effect runs before this one's, and posthog-js drops an identify or a capture
  // made before init, so the page views, the auth sync and the OAuth record mount only once it is
  // set: the sync before the record, so that the record goes out under the person rather than an
  // anonymous id (siblings' effects run in order).
  const [mode, setMode] = useState<RunningMode | null>(null);
  // The role, for the code below that runs outside a render.
  const { data: session } = useSession();
  const roleRef = useRef<string | undefined>(undefined);
  roleRef.current = session?.user?.role;

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    // NEXT_PUBLIC_ANALYTICS_ENABLED=false turns all of it off, page views and identification too.
    if (!key || process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false") return;

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
        // What every event carries, before the events held while the answer was awaited go
        // out below: they belong to this person and this page like any other.
        applyContext(
          eventContext({
            routeSlug: workspaceSlugOf(window.location.pathname),
            workspace: useWorkspaceContextStore.getState().currentWorkspace,
            role: roleRef.current,
            subscription:
              useSubscriptionStore.getState().subscription?.subscription,
          }),
        );
        // Wire posthog into the analytics singleton so analytics.track() etc. work
        registerPostHog({
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
      forgetPostHog();
    };
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        {/* Before the page view: siblings' effects run in order, and a page's view must carry
            that page's workspace, not the one before it. */}
        {mode === "full" && <AnalyticsContextSync />}
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
    </PHProvider>
  );
}
