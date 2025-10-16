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
 * @param nonce - Cryptographic nonce for inline scripts/styles
 * @returns CSP header string
 */
export function getCSPHeader(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const apiUrl =
    process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:2024";

  // Build CSP directives
  const directives = [
    "default-src 'self'",

    // Scripts: Use nonce in production, allow unsafe-eval in dev for hot reload
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,

    // Styles: Use nonce, allow unsafe-inline in dev for hot reload
    `style-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline'" : ""}`,

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
 * - 'strict-dynamic': Allows dynamically created scripts to run if parent has nonce
 * - 'unsafe-eval': Only in dev for Next.js hot reload, removed in production
 * - 'unsafe-inline': Only in dev for CSS hot reload, removed in production
 * - Nonce-based CSP: All inline scripts/styles must have matching nonce attribute
 *
 * Usage in middleware:
 * ```typescript
 * import { generateCSPNonce } from '@/lib/csp'
 * const nonce = generateCSPNonce()
 * const csp = getCSPHeader(nonce)
 * response.headers.set('Content-Security-Policy', csp)
 * response.headers.set('x-nonce', nonce)
 * ```
 *
 * Usage in components (if needed):
 * ```tsx
 * import { headers } from 'next/headers'
 * const nonce = headers().get('x-nonce') || ''
 * <script nonce={nonce}>...</script>
 * ```
 */
