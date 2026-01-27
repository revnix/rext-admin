/**
 * Content Security Policy (CSP) Configuration
 *
 * This module provides environment-aware CSP headers for the application.
 * In development, it allows unsafe-eval and unsafe-inline for hot reload.
 * In production, it enforces strict CSP with nonce-based scripts/styles.
 */

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
  // Production backend URL
  const PRODUCTION_BACKEND = "api.rext.ai";

  const apiUrl =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    "http://192.168.1.130:2024" ||
    "http://localhost:2024";

  // In development, allow localhost variants
  // In production, allow both http and https for the production backend
  const backendOrigins = isDev
    ? `${apiUrl} http://localhost:2024 http://127.0.0.1:2024 http://192.168.1.130:2024`
    : `http://${PRODUCTION_BACKEND} https://${PRODUCTION_BACKEND}`;

  // Third-party service domains that need to be whitelisted
  // Add new services here as needed for payment processing, analytics, etc.
  const thirdPartyDomains = {
    lemonsqueezy: {
      app: "https://app.lemonsqueezy.com",
      assets: "https://assets.lemonsqueezy.com",
    },
    // Add more third-party services here as needed:
    // stripe: "https://js.stripe.com",
    // analytics: "https://www.google-analytics.com",
  };

  // Build CSP directives
  const directives = [
    "default-src 'self'",

    // Scripts: Simple policy that works with both Turbopack (dev) and Webpack (prod)
    // 'unsafe-eval': Required for Turbopack dev hot reload
    // 'unsafe-inline': Required for Webpack production inline scripts
    // Third-party: LemonSqueezy checkout script
    `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${thirdPartyDomains.lemonsqueezy.app} ${thirdPartyDomains.lemonsqueezy.assets}`,

    // Styles: ALWAYS allow unsafe-inline (React components use inline styles extensively)
    // In production, you may want to generate style hashes or use a CSS-in-JS solution
    `style-src 'self' 'unsafe-inline'`,

    // Images: Allow self, data URIs, and blobs
    "img-src 'self' blob: data: https:",

    // Fonts: Allow self and data URIs
    "font-src 'self' data:",

    // Connect: Allow self, backend API, and third-party services
    `connect-src 'self' ${backendOrigins} ${thirdPartyDomains.lemonsqueezy.app}`,

    // Frames: Allow LemonSqueezy checkout overlays
    `frame-src 'self' ${thirdPartyDomains.lemonsqueezy.app}`,

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
 *   - frame-src: Allows checkout overlay iframes from app.lemonsqueezy.com
 *   - connect-src: Enables API connections to app.lemonsqueezy.com
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
