/**
 * Whether the app may measure how this person uses it, and where they are asked first
 * (rext-control task 712). The same rule as rext.ai, which is what the privacy policy promises:
 *
 * - In the EEA, the UK and Switzerland a person is asked once, after signing in. Until they
 *   answer, nothing is sent. "No" means anonymous counts only: page views by route, with no
 *   identity, no events and no recording.
 * - Everywhere else it is on, and a switch in Settings, Privacy turns it off.
 *
 * Two first-party cookies hold it, both readable by the page and named as on rext.ai:
 * - `rext-region` (`eea` or `other`), set by `/api/region` from Vercel's country header. A missing
 *   or unknown country, or a failed request, counts as the EEA.
 * - `rext-consent` (`granted` or `denied`), set when the person chooses: here at once, and again
 *   by `/api/consent`, because Safari keeps a cookie written by a script for seven days only.
 */

export type ConsentChoice = "granted" | "denied";
export type ConsentRegion = "eea" | "other";

/**
 * What analytics may do for this person now: everything, anonymous counts only, or nothing until
 * they answer.
 */
export type AnalyticsMode = "full" | "anonymous" | "wait";

export const REGION_COOKIE = "rext-region";
export const CONSENT_COOKIE = "rext-consent";

/** Six months, after which the person is asked again. */
const CONSENT_MAX_AGE = 60 * 60 * 24 * 182;

export function isConsentChoice(value: unknown): value is ConsentChoice {
  return value === "granted" || value === "denied";
}

/** The `rext-consent` cookie, the same whether the page or the server sets it. */
export function consentCookie(choice: ConsentChoice, secure: boolean): string {
  return `${CONSENT_COOKIE}=${choice}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/**
 * The 27 EU states, Iceland, Liechtenstein, Norway, the United Kingdom and Switzerland, as ISO
 * 3166-1 codes (Greece is GR), plus the EU's own territories that carry codes of their own: Åland,
 * French Guiana, Guadeloupe, Martinique, Mayotte, Réunion and Saint Martin.
 */
// biome-ignore format: one line per group reads better than one code per line
const CONSENT_COUNTRIES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU",
  "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK",
  "IS", "LI", "NO", "GB", "CH",
  "AX", "GF", "GP", "MQ", "YT", "RE", "MF",
]);

/** The region for a country code from Vercel; a missing or unknown code is the EEA. */
export function regionForCountry(
  country: string | null | undefined,
): ConsentRegion {
  if (country?.length !== 2) return "eea";
  return CONSENT_COUNTRIES.has(country.toUpperCase()) ? "eea" : "other";
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const cookie = part.trim();
    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length));
    }
  }
  return null;
}

/** The person's own choice, or null when they haven't made one in this browser. */
export function readConsent(): ConsentChoice | null {
  const value = readCookie(CONSENT_COOKIE);
  return isConsentChoice(value) ? value : null;
}

let regionRequest: Promise<ConsentRegion> | null = null;

/** The region from its cookie, or from `/api/region` (once per page load) when there is none. */
function resolveRegion(): Promise<ConsentRegion> {
  const known = readCookie(REGION_COOKIE);
  if (known === "eea" || known === "other") return Promise.resolve(known);
  regionRequest ||= fetch("/api/region", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : null))
    .then((body: { region?: string } | null) =>
      body?.region === "other" ? "other" : "eea",
    )
    .catch((): ConsentRegion => "eea");
  return regionRequest;
}

/** What this person's choice and region allow. */
export async function analyticsMode(): Promise<AnalyticsMode> {
  const choice = readConsent();
  if (choice === "granted") return "full";
  if (choice === "denied") return "anonymous";
  return (await resolveRegion()) === "other" ? "full" : "wait";
}

const CHANGE_EVENT = "rext:analytics-consent";

function setConsentCookie(choice: ConsentChoice): void {
  // biome-ignore lint/suspicious/noDocumentCookie: the choice is read back synchronously, here and by the server
  document.cookie = consentCookie(
    choice,
    window.location.protocol === "https:",
  );
}

// The same cookie from the server lasts the full six months in Safari too. One request at a time,
// and always for the latest choice: two presses of the switch in quick succession would otherwise
// race, and the slower answer's cookie would replace the newer choice.
let latestChoice: ConsentChoice | null = null;
let serverBusy = false;

function sendToServer(): void {
  if (serverBusy || latestChoice === null) return;
  const choice = latestChoice;
  serverBusy = true;
  void fetch("/api/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choice }),
    keepalive: true,
  })
    // If the request fails, the cookie written by the page still holds the choice.
    .catch(() => {})
    .then(() => {
      serverBusy = false;
      if (latestChoice !== null && latestChoice !== choice) {
        // A newer choice was made meanwhile, and the server's cookie has just replaced it:
        // put it back at once, then send it.
        setConsentCookie(latestChoice);
        sendToServer();
      }
    });
}

// The app's other tabs hear a change at once, through one channel per page: the object that
// posts a message doesn't receive it, so this page's listeners hear it once, from the window.
let tabs: BroadcastChannel | null | undefined;

function otherTabs(): BroadcastChannel | null {
  if (tabs === undefined) {
    tabs =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel(CHANGE_EVENT);
  }
  return tabs;
}

/** Records the choice and tells the app, in this tab and the others. */
export function writeConsent(choice: ConsentChoice): void {
  setConsentCookie(choice);
  latestChoice = choice;
  sendToServer();
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: choice }));
  otherTabs()?.postMessage(choice);
}

/**
 * Runs `listener` whenever the person chooses, in this tab or another of the app's. Returns the
 * way to stop.
 */
export function onConsentChange(
  listener: (choice: ConsentChoice) => void,
): () => void {
  const here = (event: Event) => {
    const choice = (event as CustomEvent).detail;
    if (isConsentChoice(choice)) listener(choice);
  };
  const elsewhere = (event: MessageEvent) => {
    if (isConsentChoice(event.data)) listener(event.data);
  };
  const channel = otherTabs();
  window.addEventListener(CHANGE_EVENT, here);
  channel?.addEventListener("message", elsewhere);
  return () => {
    window.removeEventListener(CHANGE_EVENT, here);
    channel?.removeEventListener("message", elsewhere);
  };
}

/**
 * Whether a request to set the choice comes from the app itself: its `Origin` header against the
 * host it was sent to. No Origin header (an older browser) counts as the app; "null" or another
 * host does not, so another site can't change a person's choice with a form.
 */
export function fromThisSite(origin: string | null, host: string): boolean {
  if (origin === null) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** For tests: forgets the region request of this page load. */
export function resetRegionRequest(): void {
  regionRequest = null;
}
