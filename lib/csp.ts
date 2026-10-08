import { resolveApiBaseUrl } from "./api-base-url";

/**
 * Builds a Content Security Policy header string
 *
 * @param _nonce - Nonce parameter (unused but kept for backwards compatibility)
 * @returns CSP header string
 */
export function getCSPHeader(_nonce: string): string {
  // Always use unsafe-inline for styles in development to support React inline styles
  // Next.js dev server always sets NODE_ENV=development
  const isDev = process.env.NODE_ENV !== "production";

  // Get base URL for backend (trims trailing slash)
  let apiBaseUrl: string;
  try {
    apiBaseUrl = resolveApiBaseUrl();
  } catch (_e) {
    // If we can't resolve (e.g. no window in some server context),
    // fallback to production default for CSP
    apiBaseUrl = "https://api.rext.ai";
  }

  // In development: allow localhost variants + raw IP for local testing
  // In production: allow resolved API base URL
  const backendOrigins = isDev
    ? `http://localhost:2024 http://127.0.0.1:2024 ${apiBaseUrl}`
    : apiBaseUrl;

  // Third-party service domains that need to be whitelisted
  // Add new services here as needed for payment processing, analytics, etc.
  const posthogHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
  // posthog-js reads the project's settings from PostHog's assets host (eu.i. becomes
  // eu-assets.i.). Allowed for requests only: no script is loaded from there, the recorder
  // ships with the app (providers/posthog-provider.tsx).
  const posthogAssets = posthogHost.replace(
    /^https:\/\/([a-z0-9-]+)\.i\.posthog\.com$/,
    "https://$1-assets.i.posthog.com",
  );

  const thirdPartyDomains = {
    lemonsqueezy: {
      app: "https://app.lemonsqueezy.com",
      assets: "https://assets.lemonsqueezy.com",
      // Checkout URLs come back from the API on the per-store subdomain
      // (https://<store>.lemonsqueezy.com/checkout/...), never on app., so
      // frame-src needs the wildcard. Listing only app. blocks the overlay
      // iframe outright — Chrome renders it as "This content is blocked".
      checkout: "https://*.lemonsqueezy.com",
    },
    // The same host twice where it isn't PostHog's own cloud (a proxy has no assets host).
    posthog:
      posthogAssets === posthogHost
        ? posthogHost
        : `${posthogHost} ${posthogAssets}`,
    // The password breach check on sign-up and reset (lib/password-utils.ts) asks Have I Been
    // Pwned for a five-character hash prefix, from the browser.
    pwnedPasswords: "https://api.pwnedpasswords.com",
    // The support chat (lib/support-chat/chat.ts, #711), loaded on its first opening only.
    // Crisp's own list: https://docs.crisp.chat/guides/others/whitelisting-our-systems/crisp-domain-names/
    crisp: {
      https: "https://*.crisp.chat",
      sockets: "wss://*.relay.crisp.chat wss://*.relay.rescue.crisp.chat",
    },
  };

  // Build CSP directives
  const directives = [
    "default-src 'self'",

    // Scripts: Simple policy that works with both Turbopack (dev) and Webpack (prod)
    // 'unsafe-eval': Required for Turbopack dev hot reload
    // 'unsafe-inline': Required for Webpack production inline scripts
    // Third-party: LemonSqueezy checkout script
    `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${thirdPartyDomains.lemonsqueezy.app} ${thirdPartyDomains.lemonsqueezy.assets} ${thirdPartyDomains.crisp.https}`,

    // Styles: ALWAYS allow unsafe-inline (React components use inline styles extensively)
    // In production, you may want to generate style hashes or use a CSS-in-JS solution
    `style-src 'self' 'unsafe-inline' ${thirdPartyDomains.crisp.https}`,

    // Images: Allow self, data URIs, and blobs
    // In dev: also allow http: for local MinIO (localhost:9000 presigned URLs)
    `img-src 'self' blob: data: https: ${isDev ? "http:" : ""}`.trim(),

    // Fonts: Allow self and data URIs
    `font-src 'self' data: ${thirdPartyDomains.crisp.https}`,

    // Media and workers: the support chat's sounds and its worker
    `media-src 'self' ${thirdPartyDomains.crisp.https}`,
    `worker-src 'self' blob: ${thirdPartyDomains.crisp.https}`,

    // Connect: Allow self, backend API, and third-party services
    `connect-src 'self' ${backendOrigins} ${thirdPartyDomains.lemonsqueezy.app} ${thirdPartyDomains.posthog} ${thirdPartyDomains.pwnedPasswords} ${thirdPartyDomains.crisp.https} ${thirdPartyDomains.crisp.sockets}`,

    // Frames: Allow LemonSqueezy checkout overlays
    `frame-src 'self' ${thirdPartyDomains.lemonsqueezy.checkout} ${thirdPartyDomains.crisp.https}`,

    // Objects: Block all plugins
    "object-src 'none'",

    // Base URI: Only allow same origin
    "base-uri 'self'",

    // Forms: Only allow same origin
    "form-action 'self'",

    // Frames: Block all framing
    "frame-ancestors 'none'",
  ];

  return directives.join("; ");
}

/**
 * CSP Configuration Notes:
 *
 * Simplified Policy for Next.js Compatibility:
 * This CSP uses 'unsafe-eval' and 'unsafe-inline' to support both:
 * - Turbopack (dev): Requires 'unsafe-eval' for hot module reload
 * - Webpack (prod): Generates inline scripts that require 'unsafe-inline'
 *
 * Why not use nonce/strict-dynamic?
 * - 'strict-dynamic' with nonce DISABLES 'unsafe-inline', breaking Webpack builds
 * - Next.js generates too many dynamic inline scripts to hash individually
 * - This is the pragmatic approach used by most Next.js production apps
 *
 * Third-Party Services:
 * - LemonSqueezy: Payment processing and checkout overlays
 *   - script-src: Loads lemon.js from assets.lemonsqueezy.com
 *   - frame-src: Allows checkout overlay iframes from *.lemonsqueezy.com
 *     (checkout URLs are served from the store subdomain, not app.)
 *   - connect-src: Enables API connections to app.lemonsqueezy.com
 * - Have I Been Pwned: the password breach check (connect-src api.pwnedpasswords.com)
 * - Crisp: the support chat, on its first opening only (Crisp's published list: scripts,
 *   styles, fonts, media, workers, frames and connections, with its websocket relays)
 * - To add new services: Update thirdPartyDomains object and relevant directives
 *
 * Security Features Still Active:
 * - 'self': Only allows scripts from same origin by default
 * - Explicit whitelisting: Third-party domains must be explicitly added
 * - frame-ancestors 'none': Prevents clickjacking
 * - Other directives: Restrict images, fonts, connections, etc.
 *
 * Trade-off: We allow inline scripts and whitelisted external scripts but still
 * get meaningful XSS protection through same-origin restrictions and explicit
 * third-party whitelisting.
 */
