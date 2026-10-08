/**
 * What every analytics event carries (rext-control task 712): the workspace on screen, the role,
 * and the plan. Worked out here from what the app knows at the moment, so the provider can set it
 * the same way from a component and from outside one.
 */

/** Which deploy an event is from, as the website and the backend name theirs. */
export type EventEnvironment =
  | "production"
  | "staging"
  | "preview"
  | "development";

/**
 * The deploy a page is served by, from its host: the app itself, staging, one of Vercel's
 * previews, or anything else (a local run). On every event, so that a number in PostHog can be
 * read for real customers only whichever project a deploy reports to.
 */
export function environmentOf(hostname: string): EventEnvironment {
  const host = hostname.toLowerCase();
  if (host === "app.rext.ai") return "production";
  if (host === "staging.rext.ai") return "staging";
  if (host.endsWith(".vercel.app")) return "preview";
  return "development";
}

/** The mark on a browser of our own team, set once on rext.ai for `.rext.ai` (`?internal=1`). */
export const INTERNAL_COOKIE = "rext-internal";

/**
 * Whether this browser is one of the team's own: marked once on rext.ai, for both hosts. Its
 * events say so (`internal: true`), so the team's own visits can be left out of every number.
 * A preference of the browser, holding nothing about a person, read whatever their answer on
 * analytics.
 */
export function isTeamBrowser(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim() === `${INTERNAL_COOKIE}=1`);
}

// ── A workspace's brand voice ────────────────────────────────────────────────
// A workspace can be made from a name alone, with its brand voice set up later: an event says
// which kind it happened in (`workspace_has_brand_voice`). The fact comes from the workspace's own
// detail, which the workspace's pages read (providers/workspace-provider.tsx) and which has no
// brand voice in it when there is none. Until that detail has been read nothing is said: the
// workspace the app merely remembers, from a list, looks the same with none and with one not
// loaded yet, and a false must never be a guess.

/** What a workspace's detail holds of its brand voice: the two fields the rule looks at. */
type BrandVoiceRead =
  | { about?: string | null; brand_name?: string | null }
  | null
  | undefined;

/** Whether that is a brand voice, by the home page's own rule: an About or a brand name. */
export function hasBrandVoice(brandVoice: BrandVoiceRead): boolean {
  return Boolean(brandVoice?.about?.trim() || brandVoice?.brand_name?.trim());
}

const brandVoices = new Map<string, boolean>();
const BRAND_VOICE_EVENT = "rext:analytics-brand-voice";

/** Called when a workspace's detail has been read: it has a brand voice, or it has none. */
export function noteBrandVoice(workspaceId: string, has: boolean): void {
  if (!workspaceId || brandVoices.get(workspaceId) === has) return;
  brandVoices.set(workspaceId, has);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BRAND_VOICE_EVENT));
  }
}

/** What has been read of a workspace's brand voice; null until its detail has been. */
export function brandVoiceOf(workspaceId: string | null): boolean | null {
  return workspaceId ? (brandVoices.get(workspaceId) ?? null) : null;
}

/** Runs `listener` whenever a workspace's brand voice has been read anew. Returns the way to stop. */
export function onBrandVoiceNoted(listener: () => void): () => void {
  window.addEventListener(BRAND_VOICE_EVENT, listener);
  return () => window.removeEventListener(BRAND_VOICE_EVENT, listener);
}

/** For the tests: forgets what was read. */
export function forgetBrandVoices(): void {
  brandVoices.clear();
}

export interface EventContext {
  /** The workspace on screen, or null on a page that belongs to none. */
  workspace_id: string | null;
  /** Whether that workspace has a brand voice; null until its detail has been read. */
  workspace_has_brand_voice: boolean | null;
  role: string | null;
  plan: string | null;
  plan_status: string | null;
  billing_period: string | null;
}

interface ContextInput {
  /** The workspace the page's address names, if it names one. */
  routeSlug: string | null | undefined;
  /** The workspace the app last opened, which may be another one until this page's has loaded. */
  workspace: { id?: string; slug?: string } | null | undefined;
  role: string | null | undefined;
  subscription:
    | {
        plan_name?: string | null;
        status?: string | null;
        billing_period?: string | null;
      }
    | null
    | undefined;
}

export function eventContext({
  routeSlug,
  workspace,
  role,
  subscription,
}: ContextInput): EventContext {
  // Only the workspace the address names: the one opened before it stays in the app's memory
  // until this page's own has loaded, and an event must never carry the wrong one.
  const onScreen =
    routeSlug && workspace?.id && workspace.slug === routeSlug
      ? workspace.id
      : null;
  const plan = subscription?.plan_name ?? null;
  return {
    workspace_id: onScreen,
    workspace_has_brand_voice: brandVoiceOf(onScreen),
    role: role ?? null,
    plan,
    plan_status: plan ? (subscription?.status ?? null) : null,
    billing_period: plan ? (subscription?.billing_period ?? null) : null,
  };
}

/** The workspace an address names (`/w/acme/…`, `/edit/acme/…`), for code outside a component. */
export function workspaceSlugOf(pathname: string): string | null {
  const slug = pathname.match(/^\/(?:w|edit)\/([^/]+)/)?.[1];
  return slug && slug !== "create" ? decodeURIComponent(slug) : null;
}
