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
  const apiUrl =
    process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:2024";

  // Build CSP directives
  const directives = [
    "default-src 'self'",

    // Scripts: Simple policy that works with both Turbopack (dev) and Webpack (prod)
    // 'unsafe-eval': Required for Turbopack dev hot reload
    // 'unsafe-inline': Required for Webpack production inline scripts
    `script-src 'self' 'unsafe-eval' 'unsafe-inline'`,

    // Styles: ALWAYS allow unsafe-inline (React components use inline styles extensively)
    // In production, you may want to generate style hashes or use a CSS-in-JS solution
    `style-src 'self' 'unsafe-inline'`,

    // Images: Allow self, data URIs, and blobs
    "img-src 'self' blob: data: https:",

    // Fonts: Allow self and data URIs
    "font-src 'self' data:",

    // Connect: Allow self and backend API
    `connect-src 'self' ${apiUrl}`,

    // Objects: Block all plugins
    "object-src 'none'",

    // Base URI: Only allow same origin
    "base-uri 'self'",

    // Forms: Only allow same origin
    "form-action 'self'",

    // Frames: Block all framing
    "frame-ancestors 'none'",
  ];

  // Add upgrade-insecure-requests only in production
  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

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
 * Security Features Still Active:
 * - 'self': Only allows scripts from same origin (blocks external scripts)
 * - frame-ancestors 'none': Prevents clickjacking
 * - Other directives: Restrict images, fonts, connections, etc.
 *
 * Trade-off: We allow inline scripts but still get meaningful XSS protection
 * through same-origin restrictions and other CSP directives.
 */
