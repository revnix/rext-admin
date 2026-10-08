"use client";

import posthog, { type CaptureResult } from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useLayoutEffect, Suspense, useRef, useState } from "react";
import {
  analytics,
  forgetPostHog,
  IMPERSONATION_EVENT,
  isImpersonating,
  registerPostHog,
  takeOAuthLinking,
  unregisterPostHog,
} from "@/lib/analytics";
import { analyticsMode, onConsentChange } from "@/lib/analytics-consent";
import {
  type EventContext,
  environmentOf,
  eventContext,
  isTeamBrowser,
  onBrandVoiceNoted,
  workspaceSlugOf,
} from "@/lib/analytics-context";
import {
  EXCEPTION_CAPTURE,
  EXCEPTIONS_ON,
  exceptionByClass,
} from "@/lib/analytics-exceptions";
import {
  hideTypedValues,
  loadWords,
  RECORDING_ON,
  RECORDING_OPTIONS,
  recordableRoute,
} from "@/lib/analytics-recording";
import {
  anonymousEvent,
  anonymousRoute,
  redactEventUrls,
  redactStoredAddresses,
  redactUrl,
  STORED_ADDRESS_OPTIONS,
  VISITOR_STORE_OPTIONS,
} from "@/lib/analytics-redact";
import {
  mayUseToolbar,
  syncToolbarMark,
  TOOLBAR_RECHECK_MS,
  toolbarMarked,
} from "@/lib/analytics-toolbar";
import {
  WEB_VITALS_ON,
  WEB_VITALS_OPTIONS,
  webVitalsNumbers,
} from "@/lib/analytics-web-vitals";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useWorkspaceStore } from "@/stores/workspace";
import { useWorkspaceContextStore } from "@/stores/workspace/use-workspace-context-store";

// ── Page-view tracker ─────────────────────────────────────────────────────────
// Wrapped in Suspense because useSearchParams() requires it in App Router.
// The route of the page on screen, with its parameters named instead of filled in. Read by
// before_send, which turns the page views and leaves of someone who said no into this.
let routeOnScreen: string | null = null;

/** How long a page load's first view waits for the workspace and the plan before it goes without. */
const FIRST_VIEW_WAIT_MS = 3000;
// Whether this page load's first view has gone out. The ones after it find the app's memory filled.
let firstViewSent = false;
// The address of the last page view sent. A list writes its search and its filters into the
// address, and what a person typed there leaves as "redacted" (lib/analytics-redact.ts): the
// same page under the same address is the same view, not a new one for every key pressed.
let lastViewed: string | null = null;

function PostHogPageView({ anonymous }: { anonymous: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const { status } = useSession();
  const storedSlug = useWorkspaceStore((state) => state.currentWorkspace?.slug);
  const planKnown = useSubscriptionStore((state) =>
    Boolean(state.subscription?.subscription?.plan_name),
  );
  // Right after a sign-in or a reload the page is on screen before the workspace and the plan
  // have loaded, and the view would go out without them (AnalyticsContextSync puts them on
  // every event once they are known). A signed-in person's first view waits for both, a few
  // seconds at most; someone signed out, or counted without an identity, has neither to wait for.
  const routeSlug = pathname ? workspaceSlugOf(pathname) : null;
  const settled =
    anonymous ||
    status === "unauthenticated" ||
    (status === "authenticated" &&
      planKnown &&
      (!routeSlug || storedSlug === routeSlug));
  const [waitedOut, setWaitedOut] = useState(false);
  const ready = firstViewSent || settled || waitedOut;

  useEffect(() => {
    if (firstViewSent || settled) return;
    const timer = window.setTimeout(
      () => setWaitedOut(true),
      FIRST_VIEW_WAIT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [settled]);

  // The first view while it waits: it is still sent, as it was, when the person moves to another
  // page or leaves before the workspace and the plan arrive.
  const waiting = useRef<string | null>(null);
  // A view sent as the person left: the wait ending a moment later is not a second view of it.
  const sentOnLeaving = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    routeOnScreen = anonymousRoute(pathname, params ?? {});
    let url = window.origin + pathname;
    const qs = searchParams.toString();
    if (qs) url = `${url}?${qs}`;
    // For someone who said no, the page's route and nothing of whose it is. Otherwise the
    // address without an emailed link's token or a sign-in page's email.
    const address = anonymous ? window.origin + routeOnScreen : redactUrl(url);
    if (waiting.current && waiting.current !== address) {
      // The page it was for never learnt its workspace, and by now the events carry the next
      // page's (AnalyticsContextSync runs before this): it goes without one, not with another's.
      posthog.capture("$pageview", {
        $current_url: waiting.current,
        workspace_id: null,
      });
      lastViewed = waiting.current;
      firstViewSent = true;
    }
    waiting.current = null;
    if (sentOnLeaving.current === address) {
      sentOnLeaving.current = null;
      return;
    }
    sentOnLeaving.current = null;
    if (!ready && !firstViewSent) {
      waiting.current = address;
      return;
    }
    firstViewSent = true;
    if (lastViewed === address) return;
    lastViewed = address;
    posthog.capture("$pageview", { $current_url: address });
  }, [pathname, searchParams, params, anonymous, ready]);

  useEffect(() => {
    const leave = () => {
      if (!waiting.current) return;
      posthog.capture("$pageview", { $current_url: waiting.current });
      lastViewed = waiting.current;
      sentOnLeaving.current = waiting.current;
      waiting.current = null;
      firstViewSent = true;
    };
    window.addEventListener("pagehide", leave);
    return () => window.removeEventListener("pagehide", leave);
  }, []);

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

      // By the account's id only: no email and no name goes to PostHog. The person carries
      // their role here, and their plan from AnalyticsContextSync.
      posthog.identify(userId, {
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

/** With the identity goes the record of what was sent for it: the next person's are sent anew. */
function forgetPersonSent(): void {
  try {
    window.localStorage.removeItem(PERSON_SENT_KEY);
  } catch {
    // Storage refused: nothing was kept.
  }
}

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
  // What was read of one workspace says nothing of the next.
  if (context.workspace_has_brand_voice === null) {
    posthog.unregister("workspace_has_brand_voice");
  }
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
  const userId = session?.user?.id;
  const role = session?.user?.role;
  const planName = plan?.plan_name;
  const planStatus = plan?.status;
  const billingPeriod = plan?.billing_period;
  const trialEnds = plan?.trial_end_date;
  // Counts each time a workspace's brand voice is read (its detail arrives after the page does).
  const [brandVoiceRead, setBrandVoiceRead] = useState(0);
  useEffect(() => onBrandVoiceNoted(() => setBrandVoiceRead((n) => n + 1)), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a brand voice read anew is the reason to apply again
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
    brandVoiceRead,
  ]);

  // The person's own properties, sent together once they have settled: the plan and the
  // workspaces load one after the other, and two updates would each look new to posthog-js,
  // which sends one again only when it differs from the last.
  useEffect(() => {
    if (!userId || !planName || !planStatus) return;
    const settle = window.setTimeout(() => {
      const properties = {
        plan: planName,
        plan_status: planStatus,
        billing_period: billingPeriod,
        trial_ends_at: trialEnds ?? null,
        workspaces: workspaceCount,
      };
      // Once per person and change, not once per page load: what was sent last, and for whom,
      // is remembered in the browser. Another person on the same plan is not the same record,
      // and a sign-out forgets it (resetIdentity).
      const sent = JSON.stringify({ person: userId, ...properties });
      try {
        if (window.localStorage.getItem(PERSON_SENT_KEY) === sent) return;
        window.localStorage.setItem(PERSON_SENT_KEY, sent);
      } catch {
        // Storage refused: it is sent on each page load instead.
      }
      posthog.setPersonProperties(properties);
    }, PERSON_SETTLE_MS);
    return () => window.clearTimeout(settle);
  }, [userId, planName, planStatus, billingPeriod, trialEnds, workspaceCount]);

  return null;
}

// ── Session recording ────────────────────────────────────────────────────────
/**
 * Starts and stops the recording of the session (lib/analytics-recording.ts says what one holds).
 * Mounted only where NEXT_PUBLIC_SESSION_RECORDING is "true" and the person allows analytics; it
 * records while they are signed in, on one of the app's working pages, and nobody is acting as
 * them. The recorder's code and the list of the app's own words are fetched then, not before, and
 * from the app itself: without the list nothing is recorded.
 */
function SessionRecordingSync() {
  const pathname = usePathname();
  const { status } = useSession();
  const [impersonating, setImpersonatingNow] = useState(isImpersonating);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const changed = () => setImpersonatingNow(isImpersonating());
    window.addEventListener(IMPERSONATION_EVENT, changed);
    return () => window.removeEventListener(IMPERSONATION_EVENT, changed);
  }, []);

  const wanted =
    status === "authenticated" &&
    !impersonating &&
    Boolean(pathname) &&
    recordableRoute(pathname ?? "");

  useEffect(() => {
    if (!wanted || ready) return;
    let gone = false;
    void Promise.all([import("posthog-js/dist/lazy-recorder"), loadWords()])
      .then(([, listed]) => {
        if (!gone && listed) setReady(true);
      })
      .catch(() => {
        // The recorder's code didn't load: no recording.
      });
    return () => {
      gone = true;
    };
  }, [wanted, ready]);

  const record = wanted && ready;
  // A layout effect: a page that isn't recorded stops the recorder before the browser hands it
  // the new page's content.
  useLayoutEffect(() => {
    if (!record) {
      if (posthog.sessionRecordingStarted()) posthog.stopSessionRecording();
      return;
    }
    // Every session of the app's is recorded. The PostHog project's sample rate is shared with
    // the website, which records a share of its visitors: the app says "this one" for itself
    // and leaves that setting alone.
    const start = () => posthog.startSessionRecording({ sampling: true });
    start();
    // The library decides by the sample rate again for each new session (a return after half
    // an hour away starts one on the same page), so it is told again, once its own handling of
    // the new session is done.
    let session = posthog.get_session_id();
    let told: ReturnType<typeof setTimeout> | undefined;
    const forget = posthog.onSessionId((next) => {
      if (next === session) return;
      session = next;
      clearTimeout(told);
      told = setTimeout(start, 0);
    });
    return () => {
      clearTimeout(told);
      forget();
    };
  }, [record]);

  // Unmounted when the person says no, or signs out.
  useEffect(
    () => () => {
      if (posthog.sessionRecordingStarted()) posthog.stopSessionRecording();
    },
    [],
  );

  return null;
}

/**
 * Heatmaps: where on a page people click and move, as positions only, for a person who allows
 * analytics. posthog-js would fetch one piece for them from PostHog's servers (it tells a click
 * that did nothing from one that did); that piece ships with the app and is loaded here before
 * the heatmap is switched on, so nothing is asked for from outside.
 */
function HeatmapSync() {
  useEffect(() => {
    let gone = false;
    void import("posthog-js/dist/dead-clicks-autocapture")
      .then(() => {
        if (!gone) posthog.set_config({ capture_heatmaps: true });
      })
      .catch(() => {
        // The piece didn't load: no heatmap, and nothing fetched in its place.
      });
    return () => {
      gone = true;
      posthog.set_config({ capture_heatmaps: false });
    };
  }, []);

  return null;
}

/**
 * Errors nobody caught, for a person who allows analytics (lib/analytics-exceptions.ts says what
 * a report holds). Mounted only where NEXT_PUBLIC_EXCEPTION_CAPTURE is "true". posthog-js would
 * fetch the piece that listens for them from PostHog's servers; it ships with the app and is
 * loaded here before the listening is switched on, so nothing is asked for from outside.
 */
function ExceptionSync() {
  useEffect(() => {
    let gone = false;
    void import("posthog-js/dist/exception-autocapture")
      .then(() => {
        if (!gone) posthog.startExceptionAutocapture(EXCEPTION_CAPTURE);
      })
      .catch(() => {
        // The piece didn't load: no reports, and nothing fetched in its place.
      });
    return () => {
      gone = true;
      posthog.stopExceptionAutocapture();
    };
  }, []);

  return null;
}

/**
 * How fast a page loaded and answered, for a person who allows analytics (lib/analytics-web-vitals.ts
 * says what leaves). Mounted only where NEXT_PUBLIC_WEB_VITALS is "true". The piece that measures
 * ships with the app and is loaded here before the library is asked for the measures, so nothing
 * is fetched from outside. The library can't be told to stop measuring: after a no, what it still
 * measures is dropped in before_send with every other event of a person.
 */
function WebVitalsSync() {
  useEffect(() => {
    let gone = false;
    void import("posthog-js/dist/web-vitals")
      .then(() => {
        if (gone) return;
        posthog.set_config({ capture_performance: WEB_VITALS_OPTIONS });
        // set_config doesn't start it by itself.
        posthog.webVitalsAutocapture?.startIfEnabled();
      })
      .catch(() => {
        // The piece didn't load: no measures, and nothing fetched in its place.
      });
    return () => {
      gone = true;
    };
  }, []);

  return null;
}

/**
 * PostHog's toolbar, for an admin of ours who opened it from PostHog (lib/analytics-toolbar.ts).
 * Marks their browser and loads the page once more, so the server answers with the policy that
 * lets the toolbar's script in; takes the mark away once the launch is over, or the person
 * signed in is not one of ours.
 */
function ToolbarAccess() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  // Looked at again on every page: closing the toolbar tells the page nothing.
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: the path is the reason to look again
  useEffect(() => {
    if (status === "loading") return;
    const look = () => {
      const allowed =
        status === "authenticated" && mayUseToolbar(role) && !isImpersonating();
      if (syncToolbarMark(allowed)) window.location.reload();
    };
    look();
    // And while the browser carries the mark, every few seconds: the mark goes soon after
    // the toolbar is closed, not at the next page.
    if (!toolbarMarked()) return;
    const again = window.setInterval(look, TOOLBAR_RECHECK_MS);
    return () => window.clearInterval(again);
  }, [status, role, pathname]);

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
  const sent =
    runningMode === "anonymous"
      ? anonymousEvent(redacted, routeOnScreen)
      : redacted;
  if (!sent) return null;
  // An error's report leaves by its class and its place in the code, never with its message
  // (lib/analytics-exceptions.ts).
  const classed = exceptionByClass(sent);
  if (!classed) return null;
  // A page's speed leaves as its numbers and the address's shape (lib/analytics-web-vitals.ts).
  const measured = webVitalsNumbers(classed);
  if (!measured) return null;
  // A recording's batch leaves with no field's value readable (lib/analytics-recording.ts).
  const shown = hideTypedValues(measured);
  // Where the event is from, on every one: the website sends "website" to the same project and
  // the backend "server", so the sets of numbers can be told apart; and which deploy, so a
  // chart can be read for real customers only.
  shown.properties = {
    ...shown.properties,
    surface: "app",
    source: "client",
    environment: environmentOf(window.location.hostname),
    // A browser of our own team, marked on rext.ai: left out of the numbers by this.
    ...(isTeamBrowser() ? { internal: true } : {}),
  };
  return shown;
}

/**
 * Forgets who the person is (a sign-out) and puts back what is allowed. posthog-js's reset also
 * clears its own record of the choice, and under the consent rule it then captures nothing until
 * it is told again: without this, a sign-out followed by a sign-in on the same page would send
 * nothing until a reload.
 */
function resetIdentity(): void {
  posthog.reset();
  forgetPersonSent();
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
          // The visitor's id, in the cookie rext.ai shares (lib/analytics-redact.ts).
          ...VISITOR_STORE_OPTIONS,
          autocapture: false, // keep events intentional
          // Decided here, not by a switch in the PostHog project. Heatmaps are started by
          // HeatmapSync, once the one piece the library would fetch for them has arrived with
          // the app's own code. A heatmap holds positions on a page, never what was there, and
          // its addresses are redacted (redactEventUrls). A rage click or a dead click event
          // would send the clicked element's own text, which can be a person's: off.
          capture_heatmaps: false,
          rageclick: false,
          capture_dead_clicks: false,
          // Everything else the library can fetch and run is off by name, so that letting the
          // toolbar in (below) lets nothing else in. (Web vitals only: a recording's list of
          // requests reads the same option's other half, which stays as the project has it.
          // Errors nobody caught are started by ExceptionSync and a page's speed by
          // WebVitalsSync, where the deploy asks for them.)
          capture_exceptions: false,
          capture_performance: { web_vitals: false },
          disable_surveys: true,
          disable_product_tours: true,
          disable_conversations: true,
          // Nothing is captured or stored until one of the two calls below: opt_in_capturing for
          // everything, opt_out_capturing for counting without an identity or any storage. The
          // second needs "Cookieless server hash mode" switched on in the PostHog project;
          // without it PostHog drops those counts.
          cookieless_mode: "on_reject",
          // No session is recorded until the app starts one (SessionRecordingSync): a switch in
          // the PostHog project can't start one by itself. What one may hold is set here, so it
          // holds whatever starts it, and the browser's console is never part of it.
          disable_session_recording: true,
          session_recording: RECORDING_OPTIONS,
          enable_recording_console_log: false,
          // No code is loaded from PostHog's servers. The library would fetch the project's
          // settings as a script, which the security policy refuses (and the browser logs on
          // every page); told this, it reads them as data from the assets host, which the
          // policy allows for requests only (lib/csp.ts). The recorder ships with the app.
          // The one exception is PostHog's toolbar, for an admin of ours who opened it from
          // PostHog (lib/analytics-toolbar.ts): their browser carries a mark, and the server's
          // policy, which checks the role, decides whether that script may load at all.
          disable_external_dependency_loading: !toolbarMarked(),
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
          // An event sent while the page is being left goes by beacon, as the first page view of
          // someone who leaves early does; any other is sent as it always was.
          capture: (event, properties, options) =>
            options?.leaving
              ? posthog.capture(event, properties, { transport: "sendBeacon" })
              : posthog.capture(event, properties),
          reset: resetIdentity,
        });
      } else {
        // A no: a recording stops, our own events stop, the identity goes, and what is left is
        // counted without one.
        if (posthog.sessionRecordingStarted()) posthog.stopSessionRecording();
        unregisterPostHog();
        posthog.reset();
        forgetPersonSent();
        posthog.opt_out_capturing();
      }
      setMode(next);
    };

    void analyticsMode().then((allowed) => {
      // A choice made in the meantime has started it already.
      if (cancelled || started || allowed === "wait") return;
      run(allowed, false);
    });
    // An answer taken over from the account is not a new one: `$opt_in` counts people who chose.
    const stopListening = onConsentChange((choice, origin) =>
      run(choice === "granted" ? "full" : "anonymous", origin === "chosen"),
    );
    return () => {
      cancelled = true;
      stopListening();
      forgetPostHog();
      firstViewSent = false;
      lastViewed = null;
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
            <HeatmapSync />
            {EXCEPTIONS_ON && <ExceptionSync />}
            {WEB_VITALS_ON && <WebVitalsSync />}
            {RECORDING_ON && <SessionRecordingSync />}
          </>
        )}
        <ToolbarAccess />
      </Suspense>
      {children}
    </PHProvider>
  );
}
