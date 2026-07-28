interface ResolveApiBaseUrlOptions {
  explicitBaseUrl?: string;
  allowWindowOriginFallback?: boolean;
}

/**
 * Shared API base URL resolver.
 *
 * Resolution order:
 * 1. Explicitly provided base URL
 * 2. NEXT_PUBLIC_BACKEND_API_URL
 * 3. NEXT_PUBLIC_API_BASE_URL
 * 4. window.location.origin (if allowed and in browser)
 *
 * @throws {Error} If no valid API base URL can be determined.
 */
export function resolveApiBaseUrl(
  options: ResolveApiBaseUrlOptions = {},
): string {
  const { explicitBaseUrl, allowWindowOriginFallback = true } = options;

  const candidates = [
    explicitBaseUrl,
    process.env.NEXT_PUBLIC_BACKEND_API_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NODE_ENV !== "production" ? "http://127.0.0.1:2024" : undefined,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.replace(/\/+$/, "");
    }
  }

  if (
    allowWindowOriginFallback &&
    typeof window !== "undefined" &&
    window.location?.origin
  ) {
    return window.location.origin.replace(/\/+$/, "");
  }

  throw new Error(
    "No API base URL configured. Set NEXT_PUBLIC_BACKEND_API_URL or NEXT_PUBLIC_API_BASE_URL.",
  );
}
