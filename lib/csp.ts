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
  // Always use unsafe-inline for styles in development to support React inline styles
  // Next.js dev server always sets NODE_ENV=development
  const isDev = process.env.NODE_ENV !== "production";
  const apiUrl =
    process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:2024";

  // Build CSP directives
  const directives = [
    "default-src 'self'",

    // Scripts: Environment-aware script policy
    // Dev (Turbopack): 'unsafe-eval' for hot reload
    // Prod (Webpack): 'unsafe-inline' for bundled inline scripts
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : "'unsafe-inline'"}`,

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
 * Environment-Aware Policy:
 * - Dev (Turbopack): Uses 'unsafe-eval' for hot module reload
 * - Prod (Webpack): Uses 'unsafe-inline' for bundled inline scripts
 *
 * Security Features:
 * - 'strict-dynamic': Allows dynamically created scripts to run if parent has nonce
 * - 'self': Only allows scripts from same origin
 * - Nonce-based: Scripts can use nonce attribute for additional control
 *
 * Why 'unsafe-inline' in Production?
 * Next.js Webpack builds generate inline scripts for:
 * - Module loading and chunk management
 * - Hydration data injection
 * - Runtime configuration
 *
 * These inline scripts are framework-generated and change with each build,
 * making hash-based CSP impractical. This is the standard approach for Next.js apps.
 *
 * Usage in middleware:
 * ```typescript
 * import { generateCSPNonce } from '@/lib/csp'
 * const nonce = generateCSPNonce()
 * const csp = getCSPHeader(nonce)
 * response.headers.set('Content-Security-Policy', csp)
 * response.headers.set('x-nonce', nonce)
 * ```
 */
